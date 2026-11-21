"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeService } from "../../services/employee.service";
import { CreateEmployeeInput, UpdateEmployeeInput, Employee } from "../../types/employee.types";
import { IPaginatedResponse } from "../../types/pagination.types";

export const EMPLOYEES_QUERY_KEY = ["employees"] as const;

/**
 * React Query hook to fetch the paginated employee roster with automatic caching and background refresh.
 */
export const useEmployeesQuery = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  department?: string,
  role?: string
) => {
  return useQuery<IPaginatedResponse<Employee>, Error>({
    queryKey: ["employees", { page, limit, search, department, role }],
    queryFn: () => employeeService.getEmployees(page, limit, search, department, role),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
};

/**
 * React Query mutation hook to create a new employee, automatically invalidating
 * the 'employees' cache on success to trigger immediate reactive table updates.
 */
export const useCreateEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, CreateEmployeeInput>({
    mutationFn: (newEmployee: CreateEmployeeInput) =>
      employeeService.createEmployee(newEmployee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
};

/**
 * Mutation hook to update an existing employee record.
 * Automatically invalidates the employee cache on success.
 */
export const useUpdateEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, { id: string; payload: UpdateEmployeeInput }>({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeInput }) =>
      employeeService.updateEmployee(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
};

/**
 * Mutation hook to deactivate (soft delete) an employee.
 * Immediately invalidates the employee cache on success.
 */
export const useDeactivateEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, string>({
    mutationFn: (id: string) => employeeService.deactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
};

/**
 * Mutation hook to reactivate an employee.
 * Immediately invalidates the employee cache on success.
 */
export const useReactivateEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Employee, Error, string>({
    mutationFn: (id: string) => employeeService.reactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
};
