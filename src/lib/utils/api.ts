import { NextResponse } from "next/server";

export type ApiError = {
  error: string;
  code: string;
  details?: unknown;
};

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(
  error: string,
  code: string,
  status: number,
  details?: unknown
): NextResponse {
  const body: ApiError = { error, code };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}
