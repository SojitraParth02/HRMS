import { apiClient } from "./apiClient";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  Employee,
  EmployeesResponse,
  CreateEmployeeResponse,
  UpdateEmployeeResponse,
} from "../types/employee.types";

/**
 * Fetches the entire list of registered employees.
 */
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get<EmployeesResponse>("/api/employees");
  return response.data.data.employees;
};

/**
 * Registers a new employee or staff user with backend Zod validation and RBAC checks.
 */
export const createEmployee = async (
  payload: CreateEmployeeInput
): Promise<Employee> => {
  const response = await apiClient.post<CreateEmployeeResponse>(
    "/api/employees",
    payload
  );
  return response.data.data.employee;
};

/**
 * Deactivates (soft deletes) an employee account.
 */
export const deactivateEmployee = async (id: string): Promise<Employee> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { employee: Employee };
  }>(`/api/employees/${id}/deactivate`);
  return response.data.data.employee;
};

/**
 * Reactivates a previously deactivated employee account.
 */
export const reactivateEmployee = async (id: string): Promise<Employee> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { employee: Employee };
  }>(`/api/employees/${id}/reactivate`);
  return response.data.data.employee;
};

/**
 * Updates an existing employee with backend Zod validation and RBAC checks.
 */
export const updateEmployee = async (
  id: string,
  payload: UpdateEmployeeInput
): Promise<Employee> => {
  const response = await apiClient.put<UpdateEmployeeResponse>(
    `/api/employees/${id}`,
    payload
  );
  return response.data.data.employee;
};

export const employeeService = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
};
