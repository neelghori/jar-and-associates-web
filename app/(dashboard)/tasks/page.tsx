'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CompanyRequired } from '@/components/CompanyRequired';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { RowActions } from '@/components/RowActions';
import { TaskStatusPicker } from '@/components/TaskStatusPicker';
import { TaskStatusSelect } from '@/components/TaskStatusSelect';
import { TaskViewModal } from '@/components/TaskViewModal';
import { EmptyTableRow, TableToolbar } from '@/components/TableToolbar';
import { filterBySearch } from '@/lib/filterList';
import { Alert, Button, Card, Input, PageHeader, Select, Table, Textarea } from '@/components/ui';
import {
  formatDisplayDate,
  isDateBeforeToday,
  toDateInputValue,
} from '@/lib/dates';
import { normalizeTaskStatus, taskStatusLabel, type TaskStatus } from '@/lib/taskStatus';
import type { Client, Service, Task } from '@/lib/types';

const emptyForm = {
  client: '', service: '', taskName: '', startDate: '', endDate: '', description: '',
  status: 'todo' as TaskStatus,
};

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
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
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

  async function loadData() {
    const [tasksRes, clientsRes, servicesRes] = await Promise.all([
      api.getTasks(),
      api.getClients(),
      api.getServices(),
    ]);
    setTasks(tasksRes.tasks as Task[]);
    setClients(clientsRes.clients as Client[]);
    setServices(servicesRes.services as Service[]);
  }

  useEffect(() => { loadData().catch(console.error); }, []);

  const filteredTasks = useMemo(
    () =>
      filterBySearch(tasks, search, (task) => [
        task.taskName,
        typeof task.client === 'object' ? task.client.name : '',
        typeof task.service === 'object' ? task.service.name : '',
        task.status,
        taskStatusLabel(task.status),
        task.description,
        formatDisplayDate(task.startDate),
        formatDisplayDate(task.endDate),
        isTaskOverdue(task) ? 'overdue' : '',
      ]),
    [tasks, search]
  );

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
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
      if (attachment) data.append('attachment', attachment);
      if (editing) {
        await api.updateTask(editing._id, data);
        setSuccess('Task updated successfully');
      } else {
        await api.createTask(data);
        setSuccess('Task created successfully');
      }
      closeForm();
      await loadData();
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
      await loadData();
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
      await loadData();
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
          title="Tasks"
          subtitle="Track status with labels, view details, or edit tasks. Overdue tasks are marked on the task name."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          }
        />

        {success && <div className="mb-4"><Alert message={success} type="success" /></div>}
        {error && !showForm && !deleteTarget && !viewing && <div className="mb-4"><Alert message={error} /></div>}

        <Card>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by task, client, service, or status..."
            total={tasks.length}
            filtered={filteredTasks.length}
          />

          <Table headers={['Task', 'Client', 'Service', 'Start Date', 'Due Date', 'Status', 'Actions']}>
            {filteredTasks.length === 0 ? (
              <EmptyTableRow
                colSpan={7}
                message={search ? 'No tasks match your search.' : 'No tasks yet. Click Create Task to add one.'}
              />
            ) : (
              filteredTasks.map((task) => {
                const overdue = isTaskOverdue(task);
                const statusDisabled = statusUpdatingId === task._id || !!task.isInvoiced;
                return (
                  <tr
                    key={task._id}
                    className={`hover:bg-brand-50/50 ${overdue ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-brand-800">{task.taskName}</span>
                        {overdue && <OverdueLabel />}
                      </div>
                    </td>
                    <td className="px-4 py-3">{typeof task.client === 'object' ? task.client.name : '—'}</td>
                    <td className="px-4 py-3">{typeof task.service === 'object' ? task.service.name : '—'}</td>
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
                        onEdit={() => openEdit(task)}
                        onDelete={() => setDeleteTarget(task)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </Table>
        </Card>

        <TaskViewModal
          task={viewing}
          open={!!viewing}
          onClose={() => setViewing(null)}
          onEdit={viewing ? () => openEdit(viewing) : undefined}
          overdue={viewing ? isTaskOverdue(viewing) : false}
        />

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
            <div className="sm:col-span-2">
              <TaskStatusPicker
                value={form.status}
                onChange={(status) => setForm({ ...form, status })}
              />
            </div>
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

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete task?"
          message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.taskName}"?` : ''}
          confirmLabel="Yes, delete"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CompanyRequired>
  );
}
