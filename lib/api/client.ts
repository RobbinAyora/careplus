"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth/session";

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  /**
   * Retry this write automatically after network failures or temporary
   * server errors. Only use on endpoints protected by @Idempotent() or
   * that are state-based, otherwise a retry could create a duplicate.
   */
  retryWrites?: boolean;
  timeoutMs?: number;
}

interface ApiErrorDetails {
  code?: string;
  retryable?: boolean;
  requestId?: string;
}

export class ApiError extends Error {
  public readonly code?: string;
  public readonly retryable: boolean;
  public readonly requestId?: string;

  constructor(
    message: string,
    public readonly status: number,
    details: ApiErrorDetails = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = details.code;
    this.retryable = details.retryable ?? false;
    this.requestId = details.requestId;
  }
}

const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 45_000;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

async function readResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

function getErrorMessage(
  responseData: unknown,
  status: number,
): string {
  let message = `Request failed (${status}).`;

  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "message" in responseData
  ) {
    const apiMessage = responseData.message;

    if (Array.isArray(apiMessage)) {
      message = apiMessage.join(", ");
    } else if (typeof apiMessage === "string") {
      message = apiMessage;
    }
  } else if (typeof responseData === "string") {
    message = responseData;
  }

  return message;
}

function getErrorDetails(
  responseData: unknown,
  response: Response,
): ApiErrorDetails {
  const details: ApiErrorDetails = {
    requestId: response.headers.get("X-Request-Id") ?? undefined,
  };

  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>;

    if (typeof data.code === "string") {
      details.code = data.code;
    }

    if (typeof data.retryable === "boolean") {
      details.retryable = data.retryable;
    }

    if (typeof data.requestId === "string") {
      details.requestId = data.requestId;
    }
  }

  return details;
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getRetryDelay(attempt: number, response?: Response): number {
  const retryAfter = response?.headers.get("Retry-After");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 10_000);
    }
  }

  return Math.min(1000 * 2 ** attempt, 8000) + Math.floor(Math.random() * 500);
}

function shouldRetryResponse(response: Response): boolean {
  if (RETRYABLE_STATUSES.has(response.status)) {
    return true;
  }

  // The backend answers 409 + Retry-After when the same
  // Idempotency-Key is still being processed.
  return response.status === 409 && response.headers.has("Retry-After");
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { canRetry: boolean; timeoutMs: number },
): Promise<Response> {
  let attempt = 0;

  for (;;) {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      options.timeoutMs,
    );

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (
        options.canRetry &&
        attempt < MAX_RETRIES &&
        shouldRetryResponse(response)
      ) {
        await sleep(getRetryDelay(attempt, response));
        attempt += 1;
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timer);

      if (options.canRetry && attempt < MAX_RETRIES) {
        await sleep(getRetryDelay(attempt));
        attempt += 1;
        continue;
      }

      const timedOut =
        error instanceof DOMException && error.name === "AbortError";

      throw new ApiError(
        timedOut
          ? "The server is taking too long to respond. Please try again."
          : "Unable to reach the server. Check your internet connection and try again.",
        timedOut ? 504 : 0,
        {
          code: timedOut ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
          retryable: true,
        },
      );
    }
  }
}

export function useApiClient() {
  const {
    accessToken,
    refreshAccessToken,
    logout,
  } = useAuth();

  const apiRequest = useCallback(
    async <T,>(
      path: string,
      options?: ApiRequestOptions,
    ): Promise<T> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      }

      if (!accessToken) {
        throw new ApiError(
          "Your session has expired. Please log in again.",
          401,
        );
      }

      const url = `${baseUrl.replace(/\/+$/, "")}${path}`;

      const method = (options?.method ?? "GET").toUpperCase();

      const isMutation = [
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
      ].includes(method);

      const canRetry = !isMutation || options?.retryWrites === true;

      const isFormData =
        typeof FormData !== "undefined" &&
        options?.body instanceof FormData;

      const requestBody =
        options?.body === undefined
          ? undefined
          : isFormData
            ? options.body as FormData
            : JSON.stringify(options.body);

      // Created once per call, so the same ids are reused on every retry
      // and after a 401 refresh. Pages that need one key per user action
      // pass their own Idempotency-Key header (see useIdempotencyKey).
      const requestHeaders = new Headers(options?.headers);

      if (
        isMutation &&
        !requestHeaders.has("Idempotency-Key")
      ) {
        requestHeaders.set("Idempotency-Key", createId());
      }

      if (!requestHeaders.has("X-Request-Id")) {
        requestHeaders.set("X-Request-Id", createId());
      }

      const sendRequest = (token: string) => {
        const headers = new Headers(requestHeaders);

        headers.set("Authorization", `Bearer ${token}`);

        if (options?.body !== undefined && !isFormData) {
          headers.set("Content-Type", "application/json");
        }

        return fetchWithRetry(
          url,
          {
            method,
            headers,
            body: requestBody,
            credentials: "include",
            cache: "no-store",
          },
          {
            canRetry,
            timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
          },
        );
      };

      let response = await sendRequest(accessToken);

      // Only attempt refresh when the API specifically reports 401.
      if (response.status === 401) {
        const refreshResult = await refreshAccessToken();

        if (refreshResult.status === "invalid") {
          await logout();

          throw new ApiError(
            "Your session has expired. Please log in again.",
            401,
          );
        }

        if (refreshResult.status === "unavailable") {
          throw new ApiError(
            "Unable to refresh your session right now. Please try again.",
            503,
            { code: "REFRESH_UNAVAILABLE", retryable: true },
          );
        }

        if (refreshResult.status === "superseded") {
          throw new ApiError(
            "Your session changed. Please retry the request.",
            401,
          );
        }

        // Retry the original request once with the new access token.
        response = await sendRequest(
          refreshResult.session.accessToken,
        );

        if (response.status === 401) {
          await logout();

          throw new ApiError(
            "Your session could not be verified. Please log in again.",
            401,
          );
        }
      }

      const responseData = await readResponse(response);

      if (!response.ok) {
        throw new ApiError(
          getErrorMessage(responseData, response.status),
          response.status,
          getErrorDetails(responseData, response),
        );
      }

      return responseData as T;
    },
    [accessToken, refreshAccessToken, logout],
  );

  return apiRequest;
}
