import type { Role, User } from './types';

export function isPlatformAdmin(user?: User | null) {
  return user?.role === 'platform_admin';
}

export function isCompanySuperadmin(user?: User | null) {
  return user?.role === 'superadmin';
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
