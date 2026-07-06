"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "./useDebounce";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";

/**
 * Manages server-side table state (pagination, sorting, search, filters)
 * and produces the query params object expected by the API.
 *
 * const t = useTableState();
 * const { data } = useCustomers(t.queryParams);
 * <DataTable {...t.tableProps} data={data?.items} … />
 */
export function useTableState({ pageSize = DEFAULT_PAGE_SIZE, initialFilters = {} } = {}) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFiltersState] = useState(initialFilters);
  const [rowSelection, setRowSelection] = useState({});

  const debouncedSearch = useDebounce(search);

  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(sorting[0] ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" } : {}),
      ...filters,
    }),
    [pagination, sorting, debouncedSearch, filters]
  );

  const setFilter = (key, value) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return {
    queryParams,
    search,
    filters,
    setFilter,
    rowSelection,
    setRowSelection,
    /** Spread directly into <DataTable /> */
    tableProps: {
      pagination,
      onPaginationChange: setPagination,
      sorting,
      onSortingChange: setSorting,
      searchValue: search,
      onSearchChange: handleSearch,
      rowSelection,
      onRowSelectionChange: setRowSelection,
    },
  };
}
