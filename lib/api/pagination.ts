import type { useApiClient } from "@/lib/api/client";

type ApiRequestFn = ReturnType<typeof useApiClient>;

export function extractList<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (
    response &&
    typeof response === "object" &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: T[] }).data;
  }

  return [];
}

export function extractPageInfo(response: unknown): {
  nextCursor: string | null;
  hasMore: boolean;
} {
  if (response && typeof response === "object") {
    const root = response as Record<string, unknown>;

    const source = (
      root.pagination && typeof root.pagination === "object"
        ? root.pagination
        : root
    ) as Record<string, unknown>;

    const nextCursor =
      typeof source.nextCursor === "string" ? source.nextCursor : null;

    return {
      nextCursor,
      hasMore: source.hasMore === true && nextCursor !== null,
    };
  }

  return { nextCursor: null, hasMore: false };
}

export async function fetchAllPages<T>(
  apiRequest: ApiRequestFn,
  path: string,
  options?: { limit?: number; maxPages?: number },
): Promise<T[]> {
  const limit = options?.limit ?? 100;
  const maxPages = options?.maxPages ?? 20;

  const all: T[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const separator = path.includes("?") ? "&" : "?";

    const query = `limit=${limit}${
      cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
    }`;

    const response: unknown = await apiRequest<unknown>(
      `${path}${separator}${query}`,
    );

    all.push(...extractList<T>(response));

    const info = extractPageInfo(response);

    if (!info.hasMore || !info.nextCursor) {
      break;
    }

    cursor = info.nextCursor;
  }

  return all;
}