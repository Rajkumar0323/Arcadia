"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import useSWR, { type SWRConfiguration } from "swr";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

/** Authenticated fetch helpers. Attaches the Clerk session token as a Bearer token. */
export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      let res: Response;
      try {
        res = await fetch(`${API_URL}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init.headers ?? {}),
          },
        });
      } catch {
        throw new ApiError("Can't reach the server. Check your connection.", 0);
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new ApiError(data?.error ?? res.statusText ?? "Request failed", res.status);
      return data as T;
    },
    [getToken],
  );

  return useMemo(
    () => ({
      request,
      get: <T,>(path: string) => request<T>(path),
      post: <T,>(path: string, body?: unknown) =>
        request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
      patch: <T,>(path: string, body?: unknown) =>
        request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
      del: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
    }),
    [request],
  );
}

/** SWR query bound to the API. Pass null to skip. */
export function useApiQuery<T>(path: string | null, config?: SWRConfiguration<T>) {
  const { isLoaded, isSignedIn } = useAuth();
  const { get } = useApi();
  return useSWR<T>(isLoaded && isSignedIn && path ? path : null, (p: string) => get<T>(p), {
    keepPreviousData: true,
    ...config,
  });
}
