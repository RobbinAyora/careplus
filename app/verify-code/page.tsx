
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerifyCodePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Email address is missing. Please start again.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setError("The API URL is not configured.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/verify-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data: unknown = await response.json();

      if (
        typeof data !== "object" ||
        data === null ||
        !("resetToken" in data) ||
        typeof data.resetToken !== "string"
      ) {
        const serverMessage =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof data.message === "string"
            ? data.message
            : "Verification failed. Please check your code.";

        setError(serverMessage);
        return;
      }

      sessionStorage.setItem(
        "careplusPasswordResetToken",
        data.resetToken
      );

      setMessage("Code verified successfully. Redirecting...");

      router.push("/reset-password");
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-mist px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
              <path d="M8 3v4" />
              <path d="M16 3v4" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-brand-navy">
            Verify your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Enter the six-digit verification code sent to your email address.
          </p>

          {email && (
            <p className="mt-2 break-all text-sm font-medium text-brand-blue">
              {email}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold text-brand-navy"
            >
              Verification code
            </label>

            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-brand-navy outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !email}
            className="w-full rounded-xl bg-brand-blue px-4 py-3.5 font-semibold text-white transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify code"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-blue transition hover:underline"
          >
            Request another code
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-500 transition hover:text-brand-navy"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
