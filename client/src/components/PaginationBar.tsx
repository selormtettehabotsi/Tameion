import type { Pagination } from '../types';

interface Props {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({ pagination, onPageChange }: Props) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-container-highest">
      <span className="text-sm text-on-surface-variant">
        Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
      </span>
      <div className="flex gap-2">
        <button
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="px-3 py-1 text-sm rounded-lg border border-outline-variant text-on-surface disabled:opacity-40 hover:bg-surface-container-low transition-colors"
        >Previous</button>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="px-3 py-1 text-sm rounded-lg border border-outline-variant text-on-surface disabled:opacity-40 hover:bg-surface-container-low transition-colors"
        >Next</button>
      </div>
    </div>
  );
}
