"use client";

import React, { useState, useEffect } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useAppSelector } from "../../hooks/redux";
import { useCreateEmployeeMutation } from "../../hooks/queries/useEmployees";
import { UserRole, USER_ROLES } from "../../types/employee.types";
import {
  CloseIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  PersonIcon,
  EmailIcon,
  LockIcon,
  PhoneIcon,
  WorkIcon,
  PaymentsIcon,
  CalendarIcon,
  CancelIcon,
  InfoIcon,
} from "../icons";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPARTMENTS: string[] = [
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

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isHRUser: boolean = currentUser?.role === "HR";

  const createMutation = useCreateEmployeeMutation();

  // Form Field States
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>("+91");
  const [role, setRole] = useState<UserRole>("EMPLOYEE");
  const [department, setDepartment] = useState<string>("Engineering");
  const [designation, setDesignation] = useState<string>("");
  const [monthlySalary, setMonthlySalary] = useState<string>("50000");
  const [joiningDate, setJoiningDate] = useState<string>(
    new Date().toISOString().split("T")[0] ?? ""
  );

  // Field Touched / Blur State for Inline Validation
  const [designationTouched, setDesignationTouched] = useState<boolean>(false);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setUsername("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setPhone("+91");
      setRole("EMPLOYEE");
      setDepartment("Engineering");
      setDesignation("");
      setMonthlySalary("50000");
      setJoiningDate(new Date().toISOString().split("T")[0] ?? "");
      setDesignationTouched(false);
      setPhoneTouched(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Strict Real-Time Inline HR Validation Rule:
  // If HR user inputs 'hr', 'human resource', or 'admin' in Designation/Role:
  const isDesignationRestricted: boolean =
    /^(hr|human resource|admin)/i.test(designation.trim());
  const isRoleRestricted: boolean = role === "HR" || role === "ADMIN";
  const isHrViolation: boolean =
    isHRUser && (isDesignationRestricted || isRoleRestricted);

  // Joining Date No-Past-Date Validation
  const todayString: string = new Date().toISOString().split("T")[0] ?? "";
  const isPastDate: boolean = Boolean(joiningDate && joiningDate < todayString);

  // International & Country-Specific Phone Validation using libphonenumber-js
  const isPhoneValid: boolean = Boolean(
    phone && phone.trim().length > 4 && isValidPhoneNumber(phone.trim())
  );
  const showPhoneError: boolean = Boolean(
    phoneTouched && (!phone || !isValidPhoneNumber(phone.trim()))
  );

  const isSubmitDisabled: boolean =
    isHrViolation ||
    isPastDate ||
    !isPhoneValid ||
    createMutation.isPending ||
    !username.trim() ||
    !email.trim() ||
    !password.trim() ||
    !phone.trim() ||
    !designation.trim() ||
    !monthlySalary.trim();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);

    if (isHrViolation) {
      setErrorMessage("HR users are not authorized to create HR or Admin roles.");
      return;
    }

    if (isPastDate) {
      setErrorMessage("Joining date cannot be in the past.");
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage(
        phone.startsWith("+91")
          ? "Please enter a valid 10-digit Indian mobile number."
          : "Please enter a valid mobile number for the selected country."
      );
      return;
    }

    const numericSalary: number = parseFloat(monthlySalary);
    if (isNaN(numericSalary) || numericSalary <= 0) {
      setErrorMessage("Monthly salary must be a positive number.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        phone: phone.trim(),
        department: department.trim(),
        designation: designation.trim(),
        monthlySalary: numericSalary,
        joiningDate,
      });

      onClose();
    } catch (error: unknown) {
      interface ErrorResponseData {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      }
      const err = error as ErrorResponseData;
      const message: string =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to create employee. Please try again.";
      setErrorMessage(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/80 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50/50 border-b border-slate-200">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-800">
              Add New Employee
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create and provision a new workforce member in the HRMS system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs sm:text-sm">
            <CancelIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="employee-username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <PersonIcon className="w-4 h-4" />
                </span>
                <input
                  id="employee-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value)
                  }
                  placeholder="e.g. Parth Sojitra"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="employee-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <EmailIcon className="w-4 h-4" />
                </span>
                <input
                  id="employee-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label
                htmlFor="employee-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Initial Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  id="employee-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <VisibilityOffIcon className="w-4 h-4" />
                  ) : (
                    <VisibilityIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Number with Country Code Dropdown (Default: India +91) */}
            <div>
              <label
                htmlFor="employee-phone"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <PhoneInput
                  defaultCountry="in"
                  value={phone}
                  onChange={(phoneValue) => {
                    setPhone(phoneValue);
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  className="w-full flex"
                  inputClassName={`!w-full !h-10 !px-3 !py-2 !bg-white !border !rounded-r-lg !text-xs sm:!text-sm !text-slate-900 focus:!outline-none !transition ${
                    showPhoneError
                      ? "!border-red-500 focus:!ring-2 focus:!ring-red-500/20 focus:!border-red-500 !bg-red-50/20"
                      : "!border-slate-300 focus:!ring-2 focus:!ring-teal-600 focus:!border-teal-600"
                  }`}
                  countrySelectorStyleProps={{
                    buttonClassName: `!h-10 !px-2.5 !bg-slate-50 hover:!bg-slate-100 !border !border-r-0 !rounded-l-lg !transition ${
                      showPhoneError ? "!border-red-500" : "!border-slate-300"
                    }`,
                  }}
                />
              </div>

              {/* Country-Specific Mobile Number Validation Error */}
              {showPhoneError && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <CancelIcon className="w-4 h-4 text-red-500 shrink-0" />
                  {phone.startsWith("+91")
                    ? "Please enter a valid 10-digit Indian mobile number."
                    : "Please enter a valid mobile number for the selected country."}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label
                htmlFor="employee-role"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="employee-role"
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setRole(e.target.value as UserRole);
                }}
                className={`w-full px-3 py-2 bg-white border rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none transition ${
                  isHRUser && isRoleRestricted
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                }`}
              >
                {USER_ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                    disabled={isHRUser && (r === "HR" || r === "ADMIN")}
                  >
                    {r} {isHRUser && (r === "HR" || r === "ADMIN") ? "(Restricted)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="employee-department"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <WorkIcon className="w-4 h-4" />
                </span>
                <select
                  id="employee-department"
                  value={department}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDepartment(e.target.value)
                  }
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Designation with Strict Real-Time Inline HR Validation */}
            <div className="sm:col-span-2">
              <label
                htmlFor="employee-designation"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Designation / Job Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="employee-designation"
                  type="text"
                  required
                  value={designation}
                  onBlur={() => setDesignationTouched(true)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDesignation(e.target.value);
                  }}
                  placeholder="e.g. Senior Software Engineer"
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                    isHrViolation
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-red-50/20"
                      : "border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  }`}
                />
              </div>

              {/* Inline Red Validation Alert */}
              {isHrViolation && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <CancelIcon className="w-4 h-4 text-red-500 shrink-0" />
                  HR users are not authorized to create HR or Admin roles.
                </p>
              )}
            </div>

            {/* Monthly Salary */}
            <div>
              <label
                htmlFor="employee-salary"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Monthly Salary (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <PaymentsIcon className="w-4 h-4" />
                </span>
                <input
                  id="employee-salary"
                  type="number"
                  min="1"
                  required
                  value={monthlySalary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMonthlySalary(e.target.value)
                  }
                  placeholder="50000"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>

            {/* Joining Date */}
            <div>
              <label
                htmlFor="employee-joining-date"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Joining Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <CalendarIcon className="w-4 h-4" />
                </span>
                <input
                  id="employee-joining-date"
                  type="date"
                  min={todayString}
                  required
                  value={joiningDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJoiningDate(e.target.value)
                  }
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none transition ${
                    isPastDate
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-red-50/20"
                      : "border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  }`}
                />
              </div>

              {/* Inline Past Date Error Alert */}
              {isPastDate && (
                <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <CancelIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  Joining date cannot be in the past.
                </p>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer ${
                isSubmitDisabled
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20 active:scale-[0.98]"
              }`}
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Employee...</span>
                </>
              ) : (
                <span>Save Employee</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
