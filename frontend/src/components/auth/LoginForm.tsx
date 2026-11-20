"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "../../hooks/queries/useAuth";

const LOGO_URL: string =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDATGA6yBzz_51wVfA5QzZh2eJ7oZPMr7mMn4wcSRug1EkBGZ0luT29lZkShR-tGvfCZGSZ0cXD54xFTfO_922bNqNKp8i6kdVR9fN1VAzWic6pakZEK0okN_eee0yH-fxJoSK2G3m71JDjW26Wgag-QJ_gxHpFvtDm7NKvds5FaqS8t8o7gy4emv882feWPOfKvdvW9FWHZtH6AP9i-8QHaUfIkaOk6iCH0cvobUJdErrB9Yk1eh8M";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loginMutation = useLoginMutation();
  const isLoggingIn: boolean = isSubmitting || loginMutation.isPending;

  // Prefetch dashboard so navigation after login is instantaneous
  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/employees");
  }, [router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!email || !password || isLoggingIn) {
      return;
    }

    // Set submitting immediately on the synchronous click event for 0ms instant UI feedback
    setIsSubmitting(true);

    loginMutation.mutate(
      {
        email: email.trim(),
        password,
      },
      {
        onError: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const errorMessage: string =
    loginMutation.error?.response?.data?.message ??
    loginMutation.error?.message ??
    "Invalid email or password. Please try again.";

  return (
    <main
      className="w-full min-h-screen lg:h-screen lg:overflow-hidden select-none bg-white flex flex-col lg:grid lg:grid-cols-12"
      data-purpose="login-card-container"
    >
      {/* BEGIN: LeftBrandingPanel (Hidden on mobile screens, shown only on desktop) */}
      <section
        className="hidden lg:flex lg:col-span-6 relative flex-col justify-between p-5 sm:p-7 xl:p-10 h-full overflow-hidden bg-[#eefaf7]"
        data-purpose="marketing-showcase"
      >
        {/* Background Ambient Shapes */}
        <div aria-hidden="true" className="bg-shape-2" />
        <div aria-hidden="true" className="bg-shape-1" />

        {/* Top Section: Brand Identity & Feature Pitch */}
        <div className="relative z-10">
          {/* Logo Header */}
          <header className="flex items-center gap-3 mb-3 xl:mb-5">
            <Image
              alt="HRMS Logo"
              className="h-8 sm:h-9 xl:h-10 w-auto object-contain"
              src={LOGO_URL}
              width={140}
              height={40}
              priority
              unoptimized
            />
            <div className="border-l border-teal-200/80 pl-2.5">
              <p className="text-xs xl:text-[13px] font-medium text-slate-600 tracking-tight leading-snug">
                Human Resource
                <br />
                Management System
              </p>
            </div>
          </header>

          {/* Main Pitch Heading */}
          <div className="mb-2 xl:mb-4">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-[#0f2a27] tracking-tight leading-[1.2]">
              Manage Your Workforce
              <br />
              <span className="text-[#0d9488] custom-underline font-extrabold">
                Smarter &amp; Easier
              </span>
            </h1>
            <p className="mt-2 text-xs sm:text-[13px] xl:text-sm text-slate-600 leading-relaxed max-w-[420px]">
              Streamline attendance, manage employees, and simplify HR processes — all in one place.
            </p>
          </div>

          {/* Key Feature Badges - Compact 2-column Grid */}
          <ul
            aria-label="Platform Highlights"
            className="grid grid-cols-2 gap-2 xl:gap-2.5 mt-3 max-w-[440px]"
          >
            <li className="flex items-center gap-2 xl:gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 xl:w-7 xl:h-7 rounded-md bg-[#38b2ac] text-white shrink-0 shadow-xs shadow-teal-500/20">
                {/* Calendar Icon */}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span className="text-xs xl:text-[13px] font-medium text-slate-700 truncate">
                Track Attendance
              </span>
            </li>
            <li className="flex items-center gap-2 xl:gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 xl:w-7 xl:h-7 rounded-md bg-[#38b2ac] text-white shrink-0 shadow-xs shadow-teal-500/20">
                {/* Users Icon */}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span className="text-xs xl:text-[13px] font-medium text-slate-700 truncate">
                Manage Employees
              </span>
            </li>
            <li className="flex items-center gap-2 xl:gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 xl:w-7 xl:h-7 rounded-md bg-[#38b2ac] text-white shrink-0 shadow-xs shadow-teal-500/20">
                {/* Payroll Icon */}
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-1.1c-1.34-.23-2.4-1.22-2.45-2.65h1.7c.05.65.55 1.15 1.45 1.15.8 0 1.3-.4 1.3-1 0-.6-.4-.85-1.45-1.15-1.55-.45-2.55-1-2.55-2.25 0-1.2 1-2.1 2-2.35V6h2v1.1c1.1.2 2 1.05 2.1 2.25h-1.65c-.1-.55-.5-1-1.15-1-.7 0-1.15.35-1.15.9 0 .5.35.75 1.35 1.05 1.65.5 2.65 1.05 2.65 2.35 0 1.25-.95 2.25-2.2 2.45v1.4z" />
                </svg>
              </span>
              <span className="text-xs xl:text-[13px] font-medium text-slate-700 truncate">
                Calculate Payroll
              </span>
            </li>
            <li className="flex items-center gap-2 xl:gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 xl:w-7 xl:h-7 rounded-md bg-[#38b2ac] text-white shrink-0 shadow-xs shadow-teal-500/20">
                {/* Bar Chart Icon */}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                </svg>
              </span>
              <span className="text-xs xl:text-[13px] font-medium text-slate-700 truncate">
                Generate Reports
              </span>
            </li>
          </ul>
        </div>

        {/* Vector Office Illustration Scene (SVG Recreation) - Responsive Max Height */}
        <div
          className="relative z-10 my-auto flex flex-col justify-center items-center py-1"
          data-purpose="vector-illustration"
        >
          <svg
            className="w-auto h-auto max-h-[140px] xl:max-h-[190px] drop-shadow-xs select-none object-contain mx-auto"
            fill="none"
            viewBox="0 0 540 280"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft City Skyline Silhouettes */}
            <g opacity="0.3">
              <rect fill="#9bdcd2" height="90" width="30" x="220" y="90" />
              <rect fill="#aee6dc" height="120" width="40" x="255" y="60" />
              <rect fill="#9bdcd2" height="80" width="35" x="298" y="100" />
              {/* Skyline Windows */}
              <rect fill="#fff" height="5" width="5" x="262" y="70" />
              <rect fill="#fff" height="5" width="5" x="272" y="70" />
              <rect fill="#fff" height="5" width="5" x="282" y="70" />
              <rect fill="#fff" height="5" width="5" x="262" y="82" />
              <rect fill="#fff" height="5" width="5" x="272" y="82" />
              <rect fill="#fff" height="5" width="5" x="282" y="82" />
            </g>

            {/* Potted Plant on Left */}
            <ellipse cx="98" cy="245" fill="#cbd5e1" rx="14" ry="4" />
            <path d="M88 215 L108 215 L103 245 L93 245 Z" fill="#2a9d8f" />
            {/* Plant Leaves */}
            <path d="M98 215 Q80 180 65 185 Q82 170 95 205" fill="#52b788" />
            <path d="M98 210 Q98 160 110 160 Q106 185 101 210" fill="#74c69d" />
            <path d="M99 215 Q120 185 135 195 Q115 180 102 215" fill="#40916c" />
            <path d="M94 212 Q70 200 68 215 Q82 208 96 215" fill="#52b788" />

            {/* Wall Clock */}
            <circle cx="440" cy="115" fill="#eafdf8" r="45" stroke="#107a6f" strokeWidth="4" />
            {/* Clock Hour Marks */}
            <line stroke="#107a6f" strokeLinecap="round" strokeWidth="3" x1="440" x2="440" y1="74" y2="82" />
            <line stroke="#107a6f" strokeLinecap="round" strokeWidth="3" x1="440" x2="440" y1="148" y2="156" />
            <line stroke="#107a6f" strokeLinecap="round" strokeWidth="3" x1="400" x2="407" y1="115" y2="115" />
            <line stroke="#107a6f" strokeLinecap="round" strokeWidth="3" x1="473" x2="480" y1="115" y2="115" />
            {/* Clock Hands */}
            <circle cx="440" cy="115" fill="#107a6f" r="3.5" />
            <line stroke="#004c44" strokeLinecap="round" strokeWidth="4" x1="440" x2="440" y1="115" y2="88" />
            <line stroke="#004c44" strokeLinecap="round" strokeWidth="3.5" x1="440" x2="460" y1="115" y2="122" />

            {/* Attendance Calendar Board */}
            <rect fill="#ffffff" height="85" rx="8" stroke="#107a6f" strokeWidth="2" width="95" x="135" y="100" />
            <rect fill="#159b87" height="20" rx="6" width="95" x="135" y="100" />
            {/* Calendar Rings */}
            <rect fill="#004d40" height="10" rx="2" width="4" x="150" y="94" />
            <rect fill="#004d40" height="10" rx="2" width="4" x="165" y="94" />
            <rect fill="#004d40" height="10" rx="2" width="4" x="180" y="94" />
            <rect fill="#004d40" height="10" rx="2" width="4" x="195" y="94" />
            <rect fill="#004d40" height="10" rx="2" width="4" x="210" y="94" />
            {/* Calendar Grid Squares */}
            <rect fill="#e8f5f3" height="10" rx="2" width="12" x="145" y="130" />
            <rect fill="#e8f5f3" height="10" rx="2" width="12" x="163" y="130" />
            <rect fill="#e8f5f3" height="10" rx="2" width="12" x="181" y="130" />
            <rect fill="#e8f5f3" height="10" rx="2" width="12" x="199" y="130" />
            <rect fill="#e8f5f3" height="10" rx="2" width="12" x="145" y="146" />
            <rect fill="#e8f5f3" height="10" rx="2" width="12" x="163" y="146" />
            {/* Approved Badge Checkmark on Calendar */}
            <circle cx="198" cy="155" fill="#159b87" r="14" stroke="#ffffff" strokeWidth="2.5" />
            <path
              d="M192 155 L196 159 L204 151"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />

            {/* Meeting Table */}
            <rect fill="#097969" height="7" rx="3.5" width="250" x="160" y="200" />
            {/* Table Legs */}
            <rect fill="#097969" height="50" width="6" x="220" y="207" />
            <rect fill="#097969" height="50" width="6" x="340" y="207" />
            <ellipse cx="285" cy="258" fill="#a7d9ce" opacity="0.5" rx="140" ry="4" />

            {/* Laptop 1 (Left Woman) */}
            <polygon fill="#0e7490" points="210,185 235,185 240,200 205,200" />
            <polygon fill="#38bdf8" points="212,187 233,187 230,172 215,172" />

            {/* Laptop 2 (Right Man) */}
            <polygon fill="#0e7490" points="310,185 335,185 340,200 305,200" />
            <polygon fill="#38bdf8" points="312,187 333,187 330,172 315,172" />

            {/* Person 1 (Left Woman Seated) */}
            <path d="M150 175 L165 175 L160 215 L145 215 Z" fill="#044e45" />
            <path d="M145 160 Q145 145 155 145 L160 145 L160 190 Z" fill="#044e45" />
            <line stroke="#044e45" strokeLinecap="round" strokeWidth="4" x1="150" x2="140" y1="215" y2="252" />
            <line stroke="#044e45" strokeLinecap="round" strokeWidth="4" x1="160" x2="170" y1="215" y2="252" />
            {/* Woman Figure */}
            <ellipse cx="178" cy="148" fill="#fecaca" rx="8" ry="9" />
            <path d="M170 142 Q176 130 186 140 Q188 155 176 160 Q168 155 170 142" fill="#0f172a" />
            <path d="M165 162 L188 162 L192 195 L163 195 Z" fill="#ffffff" stroke="#e2e8f0" />
            <path d="M164 195 L195 195 L200 230 L185 245 L175 235 L180 205 L165 205 Z" fill="#094a40" />

            {/* Person 2 (Center Manager Standing) */}
            <ellipse cx="272" cy="120" fill="#fecaca" rx="8.5" ry="9.5" />
            <path d="M263 116 Q271 106 280 112 Q282 122 263 122" fill="#0f172a" />
            <path d="M260 132 L284 132 L288 185 L258 185 Z" fill="#ffffff" stroke="#e2e8f0" />
            <polygon fill="#0d9488" points="271,135 274,135 275,160 272,165 270,160" />
            <path d="M260 135 L252 165 L272 170" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
            <rect fill="#0f766e" height="30" rx="2" transform="rotate(10 272 155)" width="22" x="272" y="155" />
            <rect fill="#064e3b" height="60" width="11" x="261" y="185" />
            <rect fill="#064e3b" height="60" width="11" x="274" y="185" />
            <ellipse cx="264" cy="245" fill="#0f172a" rx="8" ry="4" />
            <ellipse cx="282" cy="245" fill="#0f172a" rx="8" ry="4" />

            {/* Person 3 (Right Man Seated) */}
            <path d="M420 175 L405 175 L410 215 L425 215 Z" fill="#044e45" />
            <path d="M425 160 Q425 145 415 145 L410 145 L410 190 Z" fill="#044e45" />
            <line stroke="#044e45" strokeLinecap="round" strokeWidth="4" x1="420" x2="430" y1="215" y2="252" />
            <line stroke="#044e45" strokeLinecap="round" strokeWidth="4" x1="410" x2="400" y1="215" y2="252" />
            <ellipse cx="395" cy="148" fill="#fecaca" rx="8.5" ry="9" />
            <path d="M386 144 Q394 134 404 140 Q405 148 388 148" fill="#1e293b" />
            <path d="M382 162 L406 162 L402 195 L378 195 Z" fill="#ffffff" stroke="#e2e8f0" />
            <polygon fill="#0d9488" points="392,163 395,163 396,180 393,184 391,180" />
            <path d="M405 195 L375 195 L370 230 L385 245 L395 235 L390 205 L405 205 Z" fill="#094a40" />
          </svg>
        </div>

        {/* Left Panel Footer Copyright */}
        <footer className="relative z-10 pt-1 text-[11px] xl:text-[12px] text-slate-500 font-medium">
          © 2026 HRMS. All rights reserved.
        </footer>
      </section>
      {/* END: LeftBrandingPanel */}

      {/* BEGIN: RightAuthPanel */}
      <section
        className="w-full flex-1 lg:col-span-6 bg-white px-5 sm:px-10 xl:px-14 py-6 sm:py-8 h-full flex flex-col justify-between overflow-y-auto"
        data-purpose="login-form-container"
      >
        {/* Centered Content Container */}
        <div className="w-full max-w-[420px] mx-auto my-auto flex flex-col justify-center">
          {/* Logo and Heading Header */}
          <header className="text-center pt-0">
            <div className="inline-flex justify-center mb-1">
              <Image
                alt="HRMS Logo"
                className="h-10 xl:h-12 w-auto object-contain"
                src={LOGO_URL}
                width={160}
                height={48}
                priority
                unoptimized
              />
            </div>
            <h2 className="text-lg xl:text-[21px] font-bold text-slate-800 tracking-tight">
              Sign In to Your Account
            </h2>

            {/* Subtle Lock Decorative Divider Badge */}
            <div className="relative my-2 xl:my-3 text-center">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative inline-flex items-center justify-center">
                <span className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
                  {/* Tiny Lock Icon */}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </header>

          {/* Error Alert Banner */}
          {loginMutation.isError && (
            <div
              role="alert"
              className="p-2.5 mb-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-fadeIn"
            >
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form
            className="space-y-2.5 xl:space-y-3"
            data-purpose="auth-credentials-form"
            method="POST"
            onSubmit={handleSubmit}
          >
            {/* Email Input */}
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-slate-800 mb-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative rounded-lg xl:rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {/* Mail Icon */}
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="block w-full pl-10 pr-3.5 py-2 xl:py-2.5 bg-white border border-slate-300 rounded-lg xl:rounded-xl text-xs sm:text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-slate-800 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative rounded-lg xl:rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {/* Lock Icon */}
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-10 py-2 xl:py-2.5 bg-white border border-slate-300 rounded-lg xl:rounded-xl text-xs sm:text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                />
                {/* Password Toggle Visibility Button */}
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    /* Eye Open Icon */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    /* Eye Crossed/Slash Icon */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-0.5 text-xs sm:text-[13px]">
              <label className="flex items-center cursor-pointer text-slate-700 select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 text-teal-700 focus:ring-teal-600 border-slate-300 rounded cursor-pointer transition"
                />
                <span className="ml-2">Remember Me</span>
              </label>
              <a
                href="#forgot"
                className="font-semibold text-[#00665c] hover:text-[#004d40] hover:underline transition"
              >
                Forgot Password?
              </a>
            </div>

            {/* Login Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-2.5 xl:py-3 px-4 bg-[#005a52] hover:bg-[#004942] active:bg-[#003d37] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg xl:rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-teal-900/10 hover:shadow-md transition duration-150 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  {/* Log In Box Arrow Icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Divider with Text */}
          <div className="relative my-2 xl:my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] xl:text-xs">
              <span className="px-3 bg-white text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Continue With Google Button */}
          <button
            type="button"
            className="w-full py-2 xl:py-2.5 px-4 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg xl:rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer"
          >
            {/* Authentic Google G Icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Bottom HR Help Desk Callout Banner */}
        <div className="w-full max-w-[420px] mx-auto mt-2 xl:mt-3" data-purpose="hr-support-banner">
          <aside className="flex items-center justify-center gap-2 py-2 px-3 bg-[#e6f4f2] text-teal-900 border border-teal-100 rounded-lg text-[11px] sm:text-xs font-medium text-center">
            <svg className="w-3.5 h-3.5 text-teal-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>Need help? Contact your HR department.</span>
          </aside>
        </div>
      </section>
      {/* END: RightAuthPanel */}
    </main>
  );
};

export default LoginForm;
