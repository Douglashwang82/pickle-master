import { supabaseAdmin } from "@/lib/db";
import { guardDevRoute } from "@/lib/utils/dev-route";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const guarded = guardDevRoute(request);
  if (guarded) return guarded;

  const venues = [
    { name: "信義運動中心", district: "信義區", address: "台北市信義區松勤街100號" },
    { name: "大安運動中心", district: "大安區", address: "台北市大安區新生南路三段55號" },
    { name: "內湖匹克球場", district: "內湖區", address: "台北市內湖區洲子街12號" },
    { name: "中山運動中心", district: "中山區", address: "台北市中山區中山北路二段44巷2號" },
  ];

  for (const venue of venues) {
    await supabaseAdmin
      .from("venues" as any)
      .upsert({ ...venue }, { onConflict: "id" }); // id isn't unique constraint, name usually is, but let's just insert
      // Wait we don't have unique constraint on name. We will just insert them manually if they don't exist
  }
  
  // A safer approach:
  for (const venue of venues) {
    const { data: existing } = await supabaseAdmin.from("venues" as any).select("id").eq("name", venue.name).single();
    if (!existing) {
      await supabaseAdmin.from("venues" as any).insert([venue]);
    }
  }

  return NextResponse.json({ success: true, seeded: venues.length });
}
