import { NextResponse } from "next/server";

export function guardDevRoute(request: Request): NextResponse | null {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const secret = process.env.DEV_ROUTE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  return null;
}
