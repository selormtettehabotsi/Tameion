export interface User {
  id: number;
  name: string;
  role: string;
  knust_id: string;
  isStaff: boolean;
  hasAvatar?: boolean;
  emailVerified?: boolean;
  csrfToken?: string;
}

export interface Loan {
  id: number;
  title: string;
  book_isbn: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: 'active' | 'returned' | 'overdue';
  days_remaining?: number | null;
}

export interface Reservation {
  id: number;
  title: string;
  book_isbn: string;
  request_date: string;
  expiry_date: string;
  status: 'pending' | 'fulfilled' | 'expired';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedLoans {
  loans: Loan[];
  pagination: Pagination;
}

export interface DashboardStats {
  totalBorrowed: number;
  currentlyOnLoan: number;
  overdueCount: number;
}

export interface DashboardData {
  activeLoans: Loan[];
  fineBalance: number;
  pendingReservations: Reservation[];
  stats: DashboardStats;
}

export interface FineTransaction {
  id: number;
  title: string;
  days_overdue: number;
  rate_per_day: string;
  amount: string;
  settled: boolean;
}

export interface FinesData {
  balance: number;
  transactions: FineTransaction[];
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  genre: string | null;
  copies_total: number;
  copies_available: number;
  shelf_location: string | null;
  cover_url: string | null;
  branch_id: number | null;
  branch_name: string | null;
}

export interface BookDetail extends Book {
  college: string | null;
  branch_location: string | null;
}

export interface Branch {
  id: number;
  branch_name: string;
}

export interface BooksResponse {
  books: Book[];
  pagination: Pagination;
  filters: {
    genres: string[];
    branches: Branch[];
  };
}

export interface PaginatedMembers {
  members: Member[];
  pagination: Pagination;
}

export interface PaginatedAdminLoans {
  loans: AdminLoan[];
  pagination: Pagination;
}

export interface PaginatedAdminFines {
  fines: AdminFine[];
  pagination: Pagination;
}

export interface AdminDashboardData {
  totalMembers: number;
  activeMembers: number;
  totalBooks: number;
  totalCopies: number;
  activeLoans: number;
  overdueLoans: number;
  pendingReservations: number;
  totalFinesOutstanding: number;
  booksByBranch: { branch_name: string; book_count: string; total_copies: string }[];
  recentLoans: AdminLoan[];
}

export interface AdminLoan {
  id: number;
  title: string;
  book_isbn: string;
  member_name: string;
  knust_id: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  days_remaining?: number;
}

export interface Member {
  id: number;
  knust_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  user_type: string;
  programme: string | null;
  account_status: string;
  avatar_url: string | null;
  has_avatar?: boolean;
  created_at: string;
  fine_balance: string;
  loans?: Loan[];
}

export interface AdminFine {
  id: number;
  title: string;
  member_name: string;
  knust_id: string;
  days_overdue: number;
  rate_per_day: string;
  amount: string;
  settled: boolean;
  settlement_date: string | null;
}

export interface AdminReservation {
  id: number;
  title: string;
  book_isbn: string;
  copies_available: number;
  member_name: string;
  knust_id: string;
  request_date: string;
  expiry_date: string;
  status: 'pending' | 'fulfilled' | 'expired';
}

export interface PaginatedAdminReservations {
  reservations: AdminReservation[];
  pagination: Pagination;
}

export interface StaffMember {
  id: number;
  knust_staff_id: string;
  full_name: string;
  email: string;
  role: 'librarian' | 'admin';
  branch_id: number | null;
  branch_name: string | null;
  created_at: string;
}

export interface PaginatedStaff {
  staff: StaffMember[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuditEntry {
  id: number;
  actor_type: string;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PaginatedAuditLog {
  entries: AuditEntry[];
  pagination: Pagination;
}

export interface ReportsData {
  loansByMonth: { month: string; checkouts: string; returns: string }[];
  topBooks: { title: string; isbn: string; borrow_count: string }[];
  genreDistribution: { genre: string; count: string }[];
  membersByMonth: { month: string; count: string }[];
  fineStats: { total_fines: string; collected: string; outstanding: string };
  overdueRate: { total: string; overdue_count: string };
}
