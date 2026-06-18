"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export function useTablePagination<T>(
  items: T[],
  resetDeps: unknown[] = [],
  initialPageSize: number = DEFAULT_PAGE_SIZE_OPTIONS[0],
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize, ...resetDeps]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems,
  };
}

interface TablePaginationProps {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

export function TablePagination({
  totalItems,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs opacity-60 sm:text-sm">
        <span>
          Showing {start}–{end} of {totalItems}
        </span>
        <label className="inline-flex items-center gap-2">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="min-h-9 rounded-md border bg-transparent px-2 py-1 text-xs sm:text-sm"
            style={{ borderColor: "var(--color-border)" }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="min-h-9 gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="min-w-24 text-center text-xs opacity-60 sm:text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="min-h-9 gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
