import { supabaseAdmin } from "./src/lib/db";

async function check() {
  const { count: users } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true });
  const { count: clubs } = await supabaseAdmin.from("clubs").select("*", { count: "exact", head: true });
  const { count: sessions } = await supabaseAdmin.from("sessions").select("*", { count: "exact", head: true });
  const { count: reviews } = await supabaseAdmin.from("peer_reviews").select("*", { count: "exact", head: true });

  console.log({ users, clubs, sessions, reviews });
}

check();
