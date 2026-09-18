"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ImageCarousel, { type CarouselSlide } from "./ImageCarousel";
import DevQuickLogin from "./DevQuickLogin";
import { authenticate } from "@/lib/auth/authenticate";
import { useAuth } from "@/lib/auth/session";
import { DASHBOARD_PATHS } from "@/lib/auth/role-routes";

const SLIDES: CarouselSlide[] = [
  {
    src: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1600&auto=format&fit=crop",
    alt: "Nurse smiling while caring for a patient in a hospital bed",
  },
  {
    src: "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1600&auto=format&fit=crop",
    alt: "Doctor consulting with a patient",
  },
  {
    src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1600&auto=format&fit=crop",
    alt: "Medical team reviewing a chart together",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Enter your email/username and password to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authenticate(identifier, password);

      if ("error" in result) {
        setError(result.error);
      } else {
        login(result.user);
        router.push(DASHBOARD_PATHS[result.user.role]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-brand-mist">
      {/* Left: form panel */}
      <div className="relative flex w-full flex-col justify-between px-8 py-10 sm:px-16 lg:w-[42%] lg:px-20">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-xl font-bold text-brand-navy">CarePlus</p>
              <p className="text-sm text-slate-500">
                Hospital Management System
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-16">
            <h1 className="text-4xl font-bold text-brand-navy">
              Welcome <span className="text-brand-blue">Back</span>
            </h1>
            <p className="mt-3 text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email or Username
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue">
                <UserIcon className="h-5 w-5 text-slate-400" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Email or Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="ml-3 w-full bg-transparent text-brand-navy placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue">
                <LockIcon className="h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ml-3 w-full bg-transparent text-brand-navy placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <EyeIcon open={showPassword} className="h-5 w-5" />
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-sm font-medium text-brand-blue hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 font-semibold text-white shadow-lg shadow-brand-blue/30 transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
              {!isSubmitting && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-sm text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Need help?{" "}
            <a
              href="/support"
              className="font-medium text-brand-blue hover:underline"
            >
              Contact support
            </a>
          </p>

          <DevQuickLogin onSelect={(email, pw) => {
            setIdentifier(email);
            setPassword(pw);
          }} />
        </div>

        {/* Footer */}
        <div className="relative mt-16">
          <p className="text-sm text-slate-400">
            Better Care &nbsp;•&nbsp; Healthier Communities
          </p>
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-20 -z-10 h-40 w-72 rounded-full bg-brand-blue/10 blur-2xl"
          />
        </div>
      </div>

      {/* Right: image carousel */}
      <div className="hidden lg:block lg:w-[58%]">
        <ImageCarousel slides={SLIDES} intervalMs={5000} transitionMs={900} />
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue-dark shadow-md">
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
        <path
          d="M12 21s-7-4.35-9.5-8.5C.7 9 2 5.5 5.5 5c2-.3 3.5.8 4.5 2 1-1.2 2.5-2.3 4.5-2 3.5.5 4.8 4 3 7.5C19 16.65 12 21 12 21Z"
          fill="currentColor"
        />
        <path
          d="M9 12h1.5l1-2 1.5 4 1-2H16"
          stroke="#2F7BF6"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 20c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="9.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ open, className }: { open: boolean; className?: string }) {
  if (!open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M3 12s3.5-6.5 9-6.5S21 12 21 12s-3.5 6.5-9 6.5S3 12 3 12Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 3l18 18M10.6 10.7a2.5 2.5 0 0 0 3.5 3.5M6.6 6.8C4.6 8.1 3 12 3 12s3.5 6.5 9 6.5c1.8 0 3.3-.5 4.6-1.3M17.4 15.2C19.4 13.8 21 12 21 12s-1.4-2.6-3.9-4.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
