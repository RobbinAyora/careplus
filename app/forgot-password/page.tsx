
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setError("The API address is not configured.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const serverMessage =
          typeof data === "object" &&
          data !== null &&
          "message" in data
            ? data.message
            : null;

        setError(
          typeof serverMessage === "string"
            ? serverMessage
            : "Unable to process your request. Please try again.",
        );
        return;
      }

      setMessage(
        "If an active account exists with that email, a verification code will be sent.",
      );

      router.push(
        `/verify-code?email=${encodeURIComponent(normalizedEmail)}`,
      );
    } catch {
      setError(
        "Cannot connect to the server. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-mist px-5 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue-dark shadow-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-white"
            >
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

          <div>
            <p className="text-xl font-bold text-brand-navy">CarePlus</p>
            <p className="text-sm text-slate-500">
              Hospital Management System
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="m4 7 8 6 8-6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-brand-navy">
            Forgot Password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Don't worry. Enter the email address associated with your
            CarePlus account and we'll send you a six-digit verification
            code to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-brand-navy"
              >
                Email Address
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 shrink-0 text-slate-400"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4.5 20c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="ml-3 w-full bg-transparent text-brand-navy placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="text-sm text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-brand-blue py-3.5 font-semibold text-white shadow-lg shadow-brand-blue/30 transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Sending code..." : "Send Verification Code"}
            </button>
          </form>

          <div className="mt-7 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-blue hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Better Care • Healthier Communities
        </p>
      </div>
    </main>
  );
}
