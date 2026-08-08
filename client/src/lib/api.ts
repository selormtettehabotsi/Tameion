import type {
  ApiResponse, User, DashboardData, Loan, FinesData,
  Reservation, BooksResponse, BookDetail,
  AdminDashboardData, Member, AdminLoan,
  AdminFine, Branch, Book, PaginatedLoans,
  PaginatedMembers, PaginatedAdminLoans, PaginatedAdminFines,
  PaginatedAdminReservations, StaffMember, PaginatedStaff,
  PaginatedAuditLog, ReportsData
} from '../types';

const B = '/api';
let csrfToken = '';

export function setCsrfToken(token: string) { csrfToken = token; }

async function r<T>(p: string, o: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const res = await fetch(B + p, { headers, credentials: 'include', ...o });
  const d = await res.json();
  if (!res.ok) throw d;
  return d;
}

function j(b: unknown) { return JSON.stringify(b); }
function qs(p?: Record<string, string>) { return p ? '?' + new URLSearchParams(p).toString() : ''; }

export const api = {
  login: async (id: string, pw: string) => {
    const res = await r<{ isStaff: boolean; csrfToken?: string }>('/auth/login', { method: 'POST', body: j({ identifier: id, password: pw }) });
    if (res.data?.csrfToken) setCsrfToken(res.data.csrfToken);
    return res;
  },
  register: (f: Record<string, string>) => r<null>('/auth/register', { method: 'POST', body: j(f) }),
  logout: async () => { const res = await r<null>('/auth/logout', { method: 'POST' }); csrfToken = ''; return res; },
  me: async () => {
    const res = await r<User>('/auth/me');
    if (res.data?.csrfToken) setCsrfToken(res.data.csrfToken);
    return res;
  },
  verifyEmail: (token: string) => r<null>('/auth/verify-email', { method: 'POST', body: j({ token }) }),
  forgotPassword: (email: string) => r<null>('/auth/forgot-password', { method: 'POST', body: j({ email }) }),
  resetPassword: (token: string, password: string) => r<null>('/auth/reset-password', { method: 'POST', body: j({ token, password }) }),
  dashboard: () => r<DashboardData>('/patron/dashboard'),
  loans: (p?: Record<string, string>) => r<PaginatedLoans>('/patron/loans' + qs(p)),
  fines: () => r<FinesData>('/patron/fines'),
  reservations: () => r<Reservation[]>('/patron/reservations'),
  books: (p?: Record<string, string>) => r<BooksResponse>('/books' + qs(p)),
  book: (isbn: string) => r<BookDetail>('/books/' + isbn),
  reserveBook: (isbn: string) => r<Reservation>('/books/' + isbn + '/reserve', { method: 'POST' }),
  adminDashboard: () => r<AdminDashboardData>('/admin/dashboard'),
  adminMembers: (p?: Record<string, string>) => r<PaginatedMembers>('/admin/members' + qs(p)),
  adminMember: (id: number) => r<Member>('/admin/members/' + id),
  adminUpdateMember: (id: number, d: Partial<Member>) => r<Member>('/admin/members/' + id, { method: 'PUT', body: j(d) }),
  adminCreateBook: (d: Partial<Book>) => r<Book>('/admin/books', { method: 'POST', body: j(d) }),
  adminUpdateBook: (isbn: string, d: Partial<Book>) => r<Book>('/admin/books/' + isbn, { method: 'PUT', body: j(d) }),
  adminDeleteBook: (isbn: string) => r<{ isbn: string; title: string }>('/admin/books/' + isbn, { method: 'DELETE' }),
  adminLoans: (p?: Record<string, string>) => r<PaginatedAdminLoans>('/admin/loans' + qs(p)),
  adminCheckout: (d: { book_isbn: string; member_knust_id: string; due_days?: number }) => r<AdminLoan>('/admin/loans/checkout', { method: 'POST', body: j(d) }),
  adminReturn: (id: number) => r<{ loanId: number; title: string; fineAmount: number }>('/admin/loans/' + id + '/return', { method: 'POST' }),
  adminFines: (p?: Record<string, string>) => r<PaginatedAdminFines>('/admin/fines' + qs(p)),
  adminPayFine: (id: number) => r<{ id: number }>('/admin/fines/' + id + '/pay', { method: 'POST' }),
  adminBranches: () => r<Branch[]>('/admin/branches'),
  adminCreateBranch: (d: { branch_name: string; college: string; location?: string }) => r<Branch>('/admin/branches', { method: 'POST', body: j(d) }),
  adminUpdateBranch: (id: number, d: Partial<Branch>) => r<Branch>('/admin/branches/' + id, { method: 'PUT', body: j(d) }),
  adminReservations: (p?: Record<string, string>) => r<PaginatedAdminReservations>('/admin/reservations' + qs(p)),
  adminFulfillReservation: (id: number) => r<{ id: number }>('/admin/reservations/' + id + '/fulfill', { method: 'POST' }),
  adminCancelReservation: (id: number) => r<{ id: number }>('/admin/reservations/' + id + '/cancel', { method: 'POST' }),
  adminRenewLoan: (id: number, days?: number) => r<{ loanId: number; title: string; newDueDate: string }>('/admin/loans/' + id + '/renew', { method: 'POST', body: j({ days: days || 14 }) }),
  adminStaff: (p?: Record<string, string>) => r<PaginatedStaff>('/admin/staff' + qs(p)),
  adminCreateStaff: (d: { knust_staff_id: string; full_name: string; email: string; password: string; role?: string; branch_id?: number }) => r<StaffMember>('/admin/staff', { method: 'POST', body: j(d) }),
  adminUpdateStaff: (id: number, d: Partial<StaffMember>) => r<StaffMember>('/admin/staff/' + id, { method: 'PUT', body: j(d) }),
  adminExportBooks: () => fetch('/api/admin/export/books', { credentials: 'include' }).then(res => res.blob()),
  adminExportMembers: () => fetch('/api/admin/export/members', { credentials: 'include' }).then(res => res.blob()),
  adminImportBooks: (csv: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'text/csv' };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    return fetch('/api/admin/import/books', { method: 'POST', headers, credentials: 'include', body: csv }).then(async res => { const d = await res.json(); if (!res.ok) throw d; return d as ApiResponse<{ imported: number; skipped: number; total: number }>; });
  },
  adminAuditLog: (p?: Record<string, string>) => r<PaginatedAuditLog>('/admin/audit-log' + qs(p)),
  adminReports: () => r<ReportsData>('/admin/reports'),
};
