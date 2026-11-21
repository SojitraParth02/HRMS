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

export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemName?: string;
  pageSizeOptions?: number[];
  className?: string;
}
