"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "../../hooks/redux";
import {
  useEmployeesQuery,
  useDeactivateEmployeeMutation,
  useReactivateEmployeeMutation,
} from "../../hooks/queries/useEmployees";
import { Employee, UserRole } from "../../types/employee.types";
import { User } from "../../types/auth.types";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { EditEmployeeModal } from "./EditEmployeeModal";
import { DeactivateConfirmationModal } from "./DeactivateConfirmationModal";
import { Pagination } from "../common/Pagination";
import { HighlightText } from "../common/HighlightText";
import { useDebounce } from "../../hooks/useDebounce";
import {
  AddIcon,
  SearchIcon,
  FilterListIcon,
  GroupIcon,
  PhoneIcon,
  WorkIcon,
  PaymentsIcon,
  CalendarIcon,
  CheckCircleIcon,
  CancelIcon,
  BlockIcon,
  RestartAltIcon,
  EditIcon,
} from "../icons";

const DEPARTMENTS: string[] = [
  "All Departments",
  "Engineering",
  "Product",
  "Design",
  "Human Resources",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Customer Support",
];

const ROLES: string[] = ["All Roles", "ADMIN", "HR", "EMPLOYEE"];

export interface EmployeesViewProps {
  initialEmployees?: Employee[];
  isLoading?: boolean;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  initialEmployees,
  isLoading: propsIsLoading,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All Departments");
  const [selectedRole, setSelectedRole] = useState<string>("All Roles");

  const deptParam = selectedDepartment === "All Departments" ? undefined : selectedDepartment;
  const roleParam = selectedRole === "All Roles" ? undefined : selectedRole;
  const searchParam = debouncedSearch.trim() || undefined;

  const { data: response, isLoading: queryIsLoading, isError, refetch } = useEmployeesQuery(
    currentPage,
    pageSize,
    searchParam,
    deptParam,
    roleParam
  );

  const employees = initialEmployees ?? response?.data ?? [];
  const pagination = response?.pagination ?? {
    currentPage,
    pageSize,
    totalRecords: employees.length,
    totalPages: Math.ceil(employees.length / pageSize) || 1,
  };
  const isLoading = propsIsLoading ?? queryIsLoading;

  const currentUser: User | null = useAppSelector((state) => state.auth.user);
  const currentUserRole: UserRole = currentUser?.role ?? "EMPLOYEE";
  const currentUserId: string | undefined = currentUser?.id;

  const deactivateMutation = useDeactivateEmployeeMutation();
  const reactivateMutation = useReactivateEmployeeMutation();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedDepartment, selectedRole]);

  // If initialEmployees was provided via SSR props, filter client-side; otherwise use server-filtered results
  const displayedEmployees: Employee[] = useMemo(() => {
    if (!initialEmployees) return employees;
    return initialEmployees.filter((emp: Employee) => {
      const query: string = debouncedSearch.toLowerCase().trim();
      const canSeePhone = currentUserRole !== "EMPLOYEE" || emp.id === currentUserId;
      const matchesSearch: boolean =
        !query ||
        emp.username.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        (canSeePhone && (emp.phone || "").toLowerCase().includes(query)) ||
        emp.designation.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query);

      const matchesDept: boolean =
        selectedDepartment === "All Departments" ||
        emp.department.toLowerCase() === selectedDepartment.toLowerCase();

      const matchesRole: boolean =
        selectedRole === "All Roles" || emp.role === selectedRole;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [initialEmployees, employees, debouncedSearch, selectedDepartment, selectedRole, currentUserRole, currentUserId]);

  const getDaysRemaining = (deactivatedAt?: string | null): number => {
    if (!deactivatedAt) return 30;
    try {
      const deactTime = new Date(deactivatedAt).getTime();
      const now = Date.now();
      const daysElapsed = Math.floor((now - deactTime) / (1000 * 60 * 60 * 24));
      return Math.max(0, 30 - daysElapsed);
    } catch {
      return 30;
    }
  };

  const getRoleBadge = (role: UserRole): React.ReactNode => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            ADMIN
          </span>
        );
      case "HR":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            HR
          </span>
        );
      case "EMPLOYEE":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            EMPLOYEE
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, deactivatedAt?: string | null): React.ReactNode => {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    const daysLeft = getDaysRemaining(deactivatedAt);
    return (
      <span
        title={
          deactivatedAt
            ? `Deactivated: ${formatDate(deactivatedAt)}. Scheduled for permanent hard deletion in ${daysLeft} days.`
            : "Inactive account"
        }
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Inactive ({daysLeft}d left)
      </span>
    );
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatSalary = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employees
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
              {pagination.totalRecords} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your organization&apos;s personnel, designations, and role-based access.
          </p>
        </div>

        {/* Primary Action Button (Only ADMIN and HR can provision employees) */}
        {currentUserRole !== "EMPLOYEE" && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-teal-700/20 active:scale-[0.98] transition cursor-pointer shrink-0"
          >
            <AddIcon className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Action Bar (Search & Filters) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Department Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedDepartment}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedDepartment(e.target.value)
              }
              className="w-full sm:w-auto pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition cursor-pointer"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedRole}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedRole(e.target.value)
              }
              className="w-full sm:w-auto pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            <p className="mt-3 text-xs sm:text-sm font-medium text-slate-500">
              Loading employee roster...
            </p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <CancelIcon className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="mt-2 text-sm font-semibold text-slate-800">
              Failed to load employees
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Could not retrieve the employee records from the server.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 px-3 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition"
            >
              Retry
            </button>
          </div>
        ) : displayedEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <GroupIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="mt-3 text-sm font-semibold text-slate-800">
              No employees found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedDepartment !== "All Departments" || selectedRole !== "All Roles"
                ? "No employee records match your active filters. Try adjusting your search query."
                : "No employee accounts have been created yet. Click '+ Add Employee' to provision your first staff member."}
            </p>
            {employees.length === 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <AddIcon className="w-4 h-4" />
                <span>Add First Employee</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="px-5 py-3.5">
                    Employee
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Department
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Designation
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Monthly Salary
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Joined
                  </th>
                  {currentUserRole !== "EMPLOYEE" && (
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {displayedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Employee Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {getInitials(emp.username)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            <HighlightText text={emp.username} query={debouncedSearch} />
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            <HighlightText text={emp.email} query={debouncedSearch} />
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getRoleBadge(emp.role)}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                      <HighlightText text={emp.department || "—"} query={debouncedSearch} />
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      <HighlightText text={emp.designation || "—"} query={debouncedSearch} />
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-mono text-xs">
                      {currentUserRole === "EMPLOYEE" && emp.id !== currentUserId ? (
                        <span className="text-slate-400 italic text-xs font-sans">
                          Confidential
                        </span>
                      ) : (
                        <HighlightText text={emp.phone || "—"} query={debouncedSearch} />
                      )}
                    </td>

                    {/* Monthly Salary */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-800">
                      {currentUserRole === "EMPLOYEE" && emp.id !== currentUserId ? (
                        <span className="text-slate-400 italic text-xs font-normal">
                          Confidential
                        </span>
                      ) : (
                        formatSalary(emp.monthlySalary)
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(emp.status, emp.deactivatedAt)}
                    </td>

                    {/* Joined Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs text-slate-500">
                      {formatDate(emp.joiningDate)}
                    </td>

                    {/* RBAC Actions (ADMIN / HR only) */}
                    {currentUserRole !== "EMPLOYEE" && (
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {emp.id === currentUserId ? (
                          <span className="text-[11px] font-medium text-slate-400 italic">
                            Current User
                          </span>
                        ) : currentUserRole === "HR" && emp.role !== "EMPLOYEE" ? (
                          <span
                            className="text-[11px] font-medium text-slate-400 italic"
                            title="HR users cannot modify HR or Admin accounts"
                          >
                            Restricted
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingEmployee(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                              title="Edit Employee Details"
                            >
                              <EditIcon className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit</span>
                            </button>

                            {emp.status === "ACTIVE" ? (
                              <button
                                type="button"
                                onClick={() => setDeactivatingEmployee(emp)}
                                disabled={deactivateMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Deactivate Employee"
                              >
                                <BlockIcon className="w-3.5 h-3.5 text-rose-500" />
                                <span>Deactivate</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => reactivateMutation.mutate(emp.id)}
                                disabled={reactivateMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 border border-teal-200/80 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Reactivate Employee"
                              >
                                <RestartAltIcon className="w-3.5 h-3.5 text-teal-600" />
                                <span>Reactivate</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalRecords={pagination.totalRecords}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
      />

      {/* Deactivate Confirmation Modal */}
      <DeactivateConfirmationModal
        isOpen={Boolean(deactivatingEmployee)}
        employee={deactivatingEmployee}
        isPending={deactivateMutation.isPending}
        onConfirm={() => {
          if (deactivatingEmployee) {
            deactivateMutation.mutate(deactivatingEmployee.id, {
              onSuccess: () => setDeactivatingEmployee(null),
            });
          }
        }}
        onClose={() => setDeactivatingEmployee(null)}
      />
    </div>
  );
};
