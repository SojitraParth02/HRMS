export interface IPaginationMeta {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface IPaginatedResponse<T> {
  status: "success";
  data: T[];
  pagination: IPaginationMeta;
}

export function formatPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalRecords: number
): IPaginatedResponse<T> {
  const pageSize = Number(limit) > 0 ? Number(limit) : 10;
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const total = Number(totalRecords) >= 0 ? Number(totalRecords) : 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    status: "success",
    data,
    pagination: {
      currentPage,
      pageSize,
      totalRecords: total,
      totalPages,
    },
  };
}
