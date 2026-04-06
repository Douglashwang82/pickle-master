import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: session, error } = await supabaseAdmin
    .from("sessions")
    .select("*, clubs(id, slug, name, owner_user_id), venues(id, name)")
    .eq("id", "cbd4100b-5599-42c2-88ad-bb13ca61a08c")
    .maybeSingle();

  console.log("SESSION:", session);
  console.log("ERROR:", error);
}

test().catch(console.error);
