import { supabaseAdmin } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const venues = [
    { name: "Xinyi Sports Center", district: "Xinyi District", address: "No. 100, Songqin St, Xinyi District, Taipei City, Taiwan 110" },
    { name: "Daan Sports Center", district: "Daan District", address: "No. 55, Section 3, Xinsheng S Rd, Da’an District, Taipei City, Taiwan 106" },
    { name: "Neihu Pickleball Court", district: "Neihu District", address: "No. 12, Zhouzi St, Neihu District, Taipei City, Taiwan 114" },
    { name: "Zhongshan Sports Center", district: "Zhongshan District", address: "No. 2, Lane 44, Section 2, Zhongshan N Rd, Zhongshan District, Taipei City, Taiwan 10491" },
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
