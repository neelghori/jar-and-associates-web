'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { RowActions } from '@/components/RowActions';
import { TaskStatusPicker } from '@/components/TaskStatusPicker';
import { TaskStatusSelect } from '@/components/TaskStatusSelect';
import { TaskViewModal } from '@/components/TaskViewModal';
import { Pagination } from '@/components/Pagination';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { mapPaginatedList } from '@/lib/listApi';
import { Alert, Button, Card, Input, PageHeader, Select, Table, Textarea } from '@/components/ui';
import {
  formatDisplayDate,
  isDateBeforeToday,
  toDateInputValue,
} from '@/lib/dates';
import { normalizeTaskStatus, type TaskStatus } from '@/lib/taskStatus';
import { isCompanySuperadmin, isEmployee } from '@/lib/roles';
import { RECURRENCE_OPTIONS, recurrenceLabel, type RecurrenceFrequency, type TaskType } from '@/lib/recurrence';
import type { Client, Service, Task, TaskRecurrenceRef, User } from '@/lib/types';

const emptyForm = {
  client: '', service: '', taskName: '', startDate: '', endDate: '', description: '',
  status: 'todo' as TaskStatus,
  assignedTo: '',
  taskType: 'one_time' as TaskType,
  recurrenceFrequency: '' as RecurrenceFrequency | '',
};

function isPopulatedAssignee(
  value: Task['assignedTo']
): value is { _id: string; name: string } {
  return Boolean(value && typeof value === 'object' && 'name' in value);
}

function assigneeIdFromTask(task: Task) {
  if (!task.assignedTo) return '';
  if (isPopulatedAssignee(task.assignedTo)) return task.assignedTo._id;
  return typeof task.assignedTo === 'string' ? task.assignedTo : '';
}

function assigneeName(task: Task) {
  if (isPopulatedAssignee(task.assignedTo)) return task.assignedTo.name;
  return '—';
}

function recurrenceFromTask(task: Task): TaskRecurrenceRef | null {
  if (!task.recurrenceId || typeof task.recurrenceId === 'string') return null;
  return task.recurrenceId;
}

function isTaskOverdue(task: Task) {
  return isDateBeforeToday(task.endDate);
}

function OverdueLabel() {
  return (
    <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
      Overdue
    </span>
  );
}

function taskToForm(task: Task) {
  return {
    client: typeof task.client === 'object' ? task.client._id : task.client,
    service: typeof task.service === 'object' ? task.service._id : task.service,
    taskName: task.taskName,
    startDate: toDateInputValue(task.startDate),
    endDate: toDateInputValue(task.endDate),
    description: task.description || '',
    status: normalizeTaskStatus(task.status),
    assignedTo: assigneeIdFromTask(task),
    taskType: 'one_time' as TaskType,
    recurrenceFrequency: '' as RecurrenceFrequency | '',
  };
}

export default function TasksPage() {
  const { user } = useAuth();
  const employeeView = isEmployee(user);
  const canManage = isCompanySuperadmin(user);
  const canAssign = canManage;
  const fetchTasks = useCallback(
    async (params: Record<string, string>) => mapPaginatedList<Task>('tasks', await api.getTasks(params)),
    []
  );
  const {
    items: tasks,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    limit,
    loading: listLoading,
    reload,
  } = usePaginatedList({ fetchList: fetchTasks });
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<Task | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canManage) return;
    Promise.all([api.getClients(), api.getServices(), api.getUsers()])
      .then(([clientsRes, servicesRes, usersRes]) => {
        setClients(clientsRes.clients as Client[]);
        setServices(servicesRes.services as Service[]);
        setEmployees((usersRes.users as User[]).filter((u) => u.role === 'employee' && u.isActive));
      })
      .catch(console.error);
  }, [canManage]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setAttachment(null);
    setError('');
    setShowForm(true);
  }

  function openView(task: Task) {
    setViewing(task);
  }

  function openEdit(task: Task) {
    setViewing(null);
    setEditing(task);
    setForm(taskToForm(task));
    setAttachment(null);
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setAttachment(null);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!editing && form.taskType === 'recurring' && !form.recurrenceFrequency) {
      setError('Select a recurrence frequency for recurring tasks');
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'assignedTo' && !canAssign) return;
        if (editing && (key === 'taskType' || key === 'recurrenceFrequency')) return;
        if (key === 'recurrenceFrequency' && form.taskType !== 'recurring') return;
        data.append(key, String(value));
      });
      if (attachment) data.append('attachment', attachment);
      if (editing) {
        await api.updateTask(editing._id, data);
        setSuccess('Task updated successfully');
      } else {
        await api.createTask(data);
        setSuccess(
          form.taskType === 'recurring'
            ? 'Recurring task created. Future tasks will be generated automatically.'
            : 'Task created successfully'
        );
      }
      closeForm();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (normalizeTaskStatus(task.status) === status) return;
    setStatusUpdatingId(task._id);
    setError('');
    try {
      await api.updateTaskStatus(task._id, status);
      await reload();
      if (viewing?._id === task._id) {
        setViewing((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteTask(deleteTarget._id);
      setSuccess('Task deleted successfully');
      if (viewing?._id === deleteTarget._id) setViewing(null);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete task');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <CompanyRequired>
      <div>
        <PageHeader
          title={employeeView ? 'My Tasks' : 'Tasks'}
          subtitle={
            employeeView
              ? 'Tasks assigned to you. Update status or view details. Overdue tasks are highlighted.'
              : 'Track status with labels, view details, or edit tasks. Overdue tasks are marked on the task name.'
          }
          action={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            ) : undefined
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !deleteTarget && !viewing && <div className="mb-4"><Alert message={error} /></div>}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by task, client, service, or status..."
            total={total}
            page={page}
            limit={limit}
            loading={listLoading}
          />

          <Table
            headers={
              employeeView
                ? ['Task', 'Client', 'Service', 'Start Date', 'Due Date', 'Status', 'Actions']
                : ['Task', 'Client', 'Service', 'Assigned To', 'Start Date', 'Due Date', 'Status', 'Actions']
            }
          >
            {!listLoading && tasks.length === 0 ? (
              <EmptyTableRow
                colSpan={employeeView ? 7 : 8}
                message={
                  search
                    ? 'No tasks match your search.'
                    : employeeView
                      ? 'No tasks assigned to you yet.'
                      : 'No tasks yet. Click Create Task to add one.'
                }
              />
            ) : (
              tasks.map((task) => {
                const overdue = isTaskOverdue(task);
                const statusDisabled = statusUpdatingId === task._id || !!task.isInvoiced;
                return (
                  <tr
                    key={task._id}
                    className={`hover:bg-brand-50/50 ${overdue ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug text-brand-800">{task.taskName}</p>
                        {(recurrenceFromTask(task) || overdue) && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {recurrenceFromTask(task) && (
                              <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                                {recurrenceLabel(recurrenceFromTask(task)!.frequency)}
                              </span>
                            )}
                            {overdue && <OverdueLabel />}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{typeof task.client === 'object' ? task.client.name : '—'}</td>
                    <td className="px-4 py-3">{typeof task.service === 'object' ? task.service.name : '—'}</td>
                    {!employeeView && <td className="px-4 py-3">{assigneeName(task)}</td>}
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDisplayDate(task.startDate)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${overdue ? 'text-red-700 font-medium' : ''}`}>
                      {formatDisplayDate(task.endDate)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <TaskStatusSelect
                        value={task.status}
                        disabled={statusDisabled}
                        onChange={(status) => handleStatusChange(task, status)}
                      />
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <RowActions
                        onView={() => openView(task)}
                        onEdit={canManage ? () => openEdit(task) : undefined}
                        onDelete={canManage ? () => setDeleteTarget(task) : undefined}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            disabled={listLoading}
          />
        </Card>

        <TaskViewModal
          task={viewing}
          open={!!viewing}
          onClose={() => setViewing(null)}
          onEdit={canManage && viewing ? () => openEdit(viewing) : undefined}
          overdue={viewing ? isTaskOverdue(viewing) : false}
        />

        {canManage && (
        <Modal
          open={showForm}
          onClose={closeForm}
          title={editing ? 'Edit Task' : 'Create Task'}
          description="Set dates and status. Billing amount is entered when you generate an invoice."
          size="xl"
        >
          {error && <div className="mb-4"><Alert message={error} /></div>}
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Select label="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Select label="Service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required>
              <option value="">Select service</option>
              {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
            <div className="sm:col-span-2">
              <Input label="Task Name" value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} required />
            </div>
            {!editing && (
              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-brand-800">Task type</span>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm has-[:checked]:border-brand-900 has-[:checked]:bg-brand-50">
                    <input
                      type="radio"
                      name="taskType"
                      value="one_time"
                      checked={form.taskType === 'one_time'}
                      onChange={() => setForm({ ...form, taskType: 'one_time', recurrenceFrequency: '' })}
                      className="accent-brand-900"
                    />
                    One-time
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm has-[:checked]:border-brand-900 has-[:checked]:bg-brand-50">
                    <input
                      type="radio"
                      name="taskType"
                      value="recurring"
                      checked={form.taskType === 'recurring'}
                      onChange={() => setForm({ ...form, taskType: 'recurring' })}
                      className="accent-brand-900"
                    />
                    Recurring
                  </label>
                </div>
              </div>
            )}
            {!editing && form.taskType === 'recurring' && (
              <div className="sm:col-span-2">
                <Select
                  label="Recurrence"
                  value={form.recurrenceFrequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrenceFrequency: e.target.value as RecurrenceFrequency,
                    })
                  }
                  required
                >
                  <option value="">Select frequency</option>
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-muted">
                  The first task uses the start and due dates below. The next task will be created on the
                  following {form.recurrenceFrequency ? recurrenceLabel(form.recurrenceFrequency).toLowerCase() : 'period'}{' '}
                  cycle from the start date.
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <TaskStatusPicker
                value={form.status}
                onChange={(status) => setForm({ ...form, status })}
              />
            </div>
            {canAssign && (
              <div className="sm:col-span-2">
                <Select
                  label="Assign to employee"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Input label="Due Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            <div className="sm:col-span-2">
              <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="sm:col-span-2 block">
              <span className="mb-2 block text-sm font-medium text-brand-800">
                Attachment {editing ? '(optional — leave empty to keep current)' : ''}
              </span>
              <input type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="text-sm" />
            </label>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : editing ? 'Update Task' : 'Save Task'}</Button>
            </div>
          </form>
        </Modal>
        )}

        {canManage && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete task?"
          message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.taskName}"?` : ''}
          confirmLabel="Yes, delete"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
        )}
      </div>
    </CompanyRequired>
  );
}
