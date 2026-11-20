"use client";

import React, { useState, useEffect } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useAppSelector } from "../../hooks/redux";
import { useUpdateEmployeeMutation } from "../../hooks/queries/useEmployees";
import { Employee, UserRole, USER_ROLES, PASSWORD_REGEX } from "../../types/employee.types";
import {
  CloseIcon,
  PersonIcon,
  EmailIcon,
  PhoneIcon,
  WorkIcon,
  PaymentsIcon,
  CalendarIcon,
  CancelIcon,
  InfoIcon,
  EditIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  LockIcon,
} from "../icons";

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
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

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  employee,
  onClose,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isHRUser: boolean = currentUser?.role === "HR";

  const updateMutation = useUpdateEmployeeMutation();

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
  const [joiningDate, setJoiningDate] = useState<string>("");

  // Validation States
  const [designationTouched, setDesignationTouched] = useState<boolean>(false);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-populate fields whenever employee prop changes or modal opens
  useEffect(() => {
    if (isOpen && employee) {
      setUsername(employee.username ?? "");
      setEmail(employee.email ?? "");
      setPassword(""); // Empty by default
      setShowPassword(false);
      setPhone(employee.phone && employee.phone.trim() ? employee.phone : "+91");
      setRole(employee.role ?? "EMPLOYEE");
      setDepartment(employee.department ?? "Engineering");
      setDesignation(employee.designation ?? "");
      setMonthlySalary(String(employee.monthlySalary ?? 50000));

      const parsedDate = employee.joiningDate
        ? employee.joiningDate.split("T")[0]
        : new Date().toISOString().split("T")[0];
      setJoiningDate(parsedDate ?? "");

      setDesignationTouched(false);
      setPhoneTouched(false);
      setPasswordTouched(false);
      setErrorMessage(null);
    }
  }, [isOpen, employee]);

  // Strict Real-Time Inline HR Validation Rule:
  // If HR user inputs 'hr', 'human resource', or 'admin' in Designation/Role:
  const isDesignationRestricted: boolean =
    /^(hr|human resource|admin)/i.test(designation.trim());
  const isRoleRestricted: boolean = role === "HR" || role === "ADMIN";
  const isHrViolation: boolean =
    isHRUser && (isDesignationRestricted || isRoleRestricted);

  // Password Validation: If provided, must match PASSWORD_REGEX
  const isPasswordValid: boolean = !password || PASSWORD_REGEX.test(password);
  const showPasswordError: boolean = Boolean(
    passwordTouched && password && !PASSWORD_REGEX.test(password)
  );

  // International & Country-Specific Phone Validation using libphonenumber-js
  const isPhoneValid: boolean = Boolean(
    phone && phone.trim().length > 4 && isValidPhoneNumber(phone.trim())
  );
  const showPhoneError: boolean = Boolean(
    phoneTouched && (!phone || !isValidPhoneNumber(phone.trim()))
  );

  const isSubmitDisabled: boolean =
    isHrViolation ||
    !isPhoneValid ||
    !isPasswordValid ||
    updateMutation.isPending ||
    !username.trim() ||
    !email.trim() ||
    !phone.trim() ||
    !designation.trim() ||
    !monthlySalary.trim();

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);

    if (isHrViolation) {
      setErrorMessage("HR users are not authorized to assign HR or Admin roles.");
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage(
        phone.startsWith("+91")
          ? "Please enter a valid 10-digit Indian mobile number."
          : "Please enter a valid international mobile number."
      );
      return;
    }

    if (password && !PASSWORD_REGEX.test(password)) {
      setErrorMessage(
        "New password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&#)."
      );
      return;
    }

    const numericSalary = Number(monthlySalary);
    if (isNaN(numericSalary) || numericSalary <= 0) {
      setErrorMessage("Monthly salary must be a positive number.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: employee.id,
        payload: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          role,
          phone: phone.trim(),
          department: department.trim(),
          designation: designation.trim(),
          monthlySalary: numericSalary,
          joiningDate,
          ...(password.trim() ? { password: password.trim() } : {}),
        },
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
        "Failed to update employee. Please try again.";
      setErrorMessage(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/80 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50/50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center">
              <EditIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 id="edit-modal-title" className="text-lg font-bold text-slate-800">
                Edit Employee Details
              </h2>
              <p className="text-xs text-slate-500">
                Update records for <span className="font-semibold text-slate-700">{employee.username}</span>
              </p>
            </div>
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
                htmlFor="edit-employee-username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <PersonIcon className="w-4 h-4" />
                </span>
                <input
                  id="edit-employee-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value)
                  }
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>

            {/* Email Address (Editable by HR and Admin) */}
            <div>
              <label
                htmlFor="edit-employee-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <EmailIcon className="w-4 h-4" />
                </span>
                <input
                  id="edit-employee-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="employee@hrms.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>

            {/* Mobile Phone Number with Country Dropdown */}
            <div>
              <label
                htmlFor="edit-employee-phone"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Mobile Phone <span className="text-red-500">*</span>
              </label>
              <div
                className={`phone-input-custom-container rounded-xl transition ${showPhoneError
                  ? "ring-2 ring-red-500 border-red-500"
                  : isPhoneValid
                    ? "focus-within:ring-2 focus-within:ring-teal-600"
                    : ""
                  }`}
                onBlur={() => setPhoneTouched(true)}
              >
                <PhoneInput
                  defaultCountry="in"
                  value={phone}
                  onChange={(phoneValue) => setPhone(phoneValue)}
                  placeholder="Enter phone number"
                  inputProps={{
                    id: "edit-employee-phone",
                    name: "phone",
                    required: true,
                    className:
                      "w-full bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-2 px-3 border border-slate-200 rounded-r-xl",
                  }}
                  countrySelectorStyleProps={{
                    buttonClassName:
                      "bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl px-2.5 py-2 hover:bg-slate-100 transition",
                  }}
                />
              </div>
              {showPhoneError && (
                <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                  <CancelIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {phone.startsWith("+91")
                      ? "Indian mobile numbers must be exactly 10 digits starting with 6-9."
                      : "Please enter a valid mobile number for the selected country."}
                  </span>
                </p>
              )}
            </div>

            {/* New Password (Optional: empty to keep unchanged) */}
            <div>
              <label
                htmlFor="edit-employee-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                New Password{" "}
                <span className="text-slate-400 text-[10px] font-normal">
                  (Leave empty to keep unchanged)
                </span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  id="edit-employee-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onBlur={() => setPasswordTouched(true)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter new password..."
                  className={`w-full pl-9 pr-10 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition ${showPasswordError
                    ? "border-red-500 ring-2 ring-red-500 bg-red-50/30"
                    : "border-slate-200 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <VisibilityOffIcon className="w-4 h-4" />
                  ) : (
                    <VisibilityIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {showPasswordError && (
                <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                  <CancelIcon className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>
                    Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
                  </span>
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label
                htmlFor="edit-employee-role"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="edit-employee-role"
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setRole(e.target.value as UserRole)
                }
                disabled={isHRUser}
                className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition cursor-pointer ${isHRUser ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
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
                htmlFor="edit-employee-dept"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="edit-employee-dept"
                value={department}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setDepartment(e.target.value)
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation with Inline HR Validation */}
            <div>
              <label
                htmlFor="edit-employee-designation"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <WorkIcon className="w-4 h-4" />
                </span>
                <input
                  id="edit-employee-designation"
                  type="text"
                  required
                  value={designation}
                  onBlur={() => setDesignationTouched(true)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDesignation(e.target.value)
                  }
                  placeholder="e.g. Frontend Engineer"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition ${isHrViolation && designationTouched
                    ? "border-red-500 ring-2 ring-red-500 bg-red-50/30"
                    : "border-slate-200 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    }`}
                />
              </div>

              {/* Inline HR Warning Indicator */}
              {isHrViolation && (
                <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1 animate-in fade-in duration-150">
                  <CancelIcon className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>HR users are not authorized to assign HR or Admin roles.</span>
                </p>
              )}
            </div>

            {/* Monthly Salary */}
            <div>
              <label
                htmlFor="edit-employee-salary"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Monthly Salary (₹ INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <PaymentsIcon className="w-4 h-4" />
                </span>
                <input
                  id="edit-employee-salary"
                  type="number"
                  min="1"
                  required
                  value={monthlySalary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMonthlySalary(e.target.value)
                  }
                  placeholder="50000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>

            {/* Joining Date */}
            <div>
              <label
                htmlFor="edit-employee-joining"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Joining Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <CalendarIcon className="w-4 h-4" />
                </span>
                <input
                  id="edit-employee-joining"
                  type="date"
                  value={joiningDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJoiningDate(e.target.value)
                  }
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:scale-[0.98] rounded-xl transition shadow-sm shadow-teal-700/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
