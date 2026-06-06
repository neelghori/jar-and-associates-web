import type { User } from './types';

export function isPlatformAdmin(user?: User | null) {
  return user?.role === 'platform_admin';
}

export function isCompanySuperadmin(user?: User | null) {
  return user?.role === 'superadmin';
}

export function isEmployee(user?: User | null) {
  return user?.role === 'employee';
}

export function canManageCompanies(user?: User | null) {
  return isPlatformAdmin(user);
}

export function canManageCompanyUsers(user?: User | null) {
  return user?.role === 'superadmin' || user?.role === 'platform_admin';
}

export function hasCompanyWorkspace(user?: User | null) {
  return Boolean(user?.company) && user?.role !== 'platform_admin';
}

/** Landing route after login */
export function getHomePath(user?: User | null) {
  if (isEmployee(user)) return '/tasks';
  return '/dashboard';
}

/** Dashboard routes employees may access */
export const EMPLOYEE_ALLOWED_PREFIXES = ['/tasks', '/account'];

export function isEmployeeAllowedPath(pathname: string) {
  return EMPLOYEE_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
