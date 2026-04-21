import { supabaseAdmin } from "@/lib/db";
import { guardDevRoute } from "@/lib/utils/dev-route";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const guarded = guardDevRoute(request);
  if (guarded) return guarded;

  const { searchParams } = new URL(request.url);
  const reset = searchParams.get("reset") === "true";

  try {
    if (reset) {
      console.log("Resetting database...");
      // Delete in reverse order of dependencies
      await supabaseAdmin.from("venue_reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("peer_reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("session_registrations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("club_memberships").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("clubs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("profiles").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // Note: We don't delete auth.users here as it's more complex and requires listing.
      // We'll handle auth users by checking existence during seeding.
    }

    // 1. Seed Users
    const usersToSeed = [
      { email: "player1@example.com", name: "王大明", skill: "pro", avatar: "/images/avatars/user-1.png" },
      { email: "player2@example.com", name: "李小華", skill: "advanced", avatar: "/images/avatars/user-2.png" },
      { email: "player3@example.com", name: "陳志遠", skill: "intermediate", avatar: "/images/avatars/user-3.png" },
      { email: "player4@example.com", name: "林美珍", skill: "beginner", avatar: "/images/avatars/user-4.png" },
      { email: "player5@example.com", name: "張家豪", skill: "intermediate", avatar: "/images/avatars/user-5.png" },
      { email: "player6@example.com", name: "黃雅婷", skill: "advanced", avatar: "/images/avatars/user-6.png" },
      { email: "player7@example.com", name: "吳建宏", skill: "pro", avatar: "/images/avatars/user-7.png" },
      { email: "player8@example.com", name: "劉怡君", skill: "intermediate", avatar: "/images/avatars/user-8.png" },
      { email: "player9@example.com", name: "許志偉", skill: "beginner", avatar: "/images/avatars/user-9.png" },
      { email: "player10@example.com", name: "蔡淑芬", skill: "pro", avatar: "/images/avatars/user-10.png" },
    ];

    const seededUsers = [];
    const password = "PickleTest123!";

    for (const u of usersToSeed) {
      // Check if auth user exists
      let authUser;
      const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers();
      authUser = existingAuth?.users.find((au) => au.email === u.email);

      if (!authUser) {
        const { data: newAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password,
          email_confirm: true,
        });
        if (authError) throw authError;
        authUser = newAuth.user;
      }

      // Sync to public.users
      let { data: appUser } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("auth_provider_user_id", authUser.id)
        .single();

      if (!appUser) {
        const { data: newUser, error: userError } = await supabaseAdmin
          .from("users")
          .insert({
            auth_provider_user_id: authUser.id,
            email: u.email,
          })
          .select("*")
          .single();
        if (userError) throw userError;
        appUser = newUser;
      }

      // Update/Create Profile
      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        user_id: appUser.id,
        display_name: u.name,
        skill_level: u.skill,
        photo_url: u.avatar,
        bio: `來自台北的${u.skill}球員，特別喜歡近網短球！`,
      }, { onConflict: "user_id" });

      if (profileError) throw profileError;
      seededUsers.push(appUser);
    }

    // 2. Seed Venues
    const venuesToSeed = [
      { name: "信義區球場", district: "信義區", address: "台北市信義區松勤街100號" },
      { name: "大安室內場館", district: "大安區", address: "台北市大安區新生南路三段55號" },
      { name: "內湖匹克球中心", district: "內湖區", address: "台北市內湖區洲子街12號" },
      { name: "中山綠地場", district: "中山區", address: "台北市中山區中山北路二段44巷2號" },
      { name: "松山空中球場", district: "松山區", address: "台北市松山區南京東路五段50號" },
    ];

    const seededVenues = [];
    for (const v of venuesToSeed) {
      let { data: venue } = await supabaseAdmin.from("venues").select("*").eq("name", v.name).single();
      if (!venue) {
        const { data: newVenue, error: vError } = await supabaseAdmin
          .from("venues")
          .insert(v)
          .select("*")
          .single();
        if (vError) throw vError;
        venue = newVenue;
      }
      seededVenues.push(venue);
    }

    // 3. Seed Clubs
    const clubsToSeed = [
      { name: "台北匹克球菁英隊", slug: "taipei-pros", owner: seededUsers[0] },
      { name: "信義休閒匹克球社", slug: "xinyi-social", owner: seededUsers[1] },
      { name: "週末戰士球隊", slug: "weekend-warriors", owner: seededUsers[2] },
    ];

    const seededClubs = [];
    for (const c of clubsToSeed) {
      let { data: club } = await supabaseAdmin.from("clubs").select("*").eq("slug", c.slug).single();
      if (!club) {
        const { data: newClub, error: cError } = await supabaseAdmin
          .from("clubs")
          .insert({
            name: c.name,
            slug: c.slug,
            owner_user_id: c.owner.id,
            description: `${c.name}是城市中最棒的匹克球社團，快來加入我們！`,
          })
          .select("*")
          .single();
        if (cError) throw cError;
        club = newClub;
      }
      seededClubs.push(club);
    }

    // 4. Seed Memberships (Assign everyone to at least 2 clubs)
    for (const user of seededUsers) {
      for (const club of seededClubs) {
        // Skip owners (they are members by default in logic but let's add them for safety in DB if needed)
        const { data: existing } = await supabaseAdmin
          .from("club_memberships")
          .select("*")
          .eq("club_id", club.id)
          .eq("user_id", user.id)
          .single();

        if (!existing) {
          // If they own it, make them leader, otherwise random member/leader
          const role = club.owner_user_id === user.id ? "leader" : (Math.random() > 0.8 ? "leader" : "member");
          await supabaseAdmin.from("club_memberships").insert({
            club_id: club.id,
            user_id: user.id,
            role,
            status: "active",
          });
        }
      }
    }

    // 5. Seed Sessions
    const seededSessions = [];
    for (const club of seededClubs) {
      const sessionPlans = [
        { title: "週間早晨練習", deltaDays: -2, status: "completed" },
        { title: "週間晚間聯誼賽", deltaDays: -1, status: "completed" },
        { title: "週末對戰賽", deltaDays: 2, status: "published" },
        { title: "新手入門工作坊", deltaDays: 5, status: "published" },
      ];

      for (const plan of sessionPlans) {
        const start = new Date();
        start.setDate(start.getDate() + plan.deltaDays);
        start.setHours(plan.deltaDays < 0 ? 10 : 18, 0, 0, 0);
        const end = new Date(start);
        end.setHours(end.getHours() + 2);

        const { data: session, error: sError } = await supabaseAdmin
          .from("sessions")
          .insert({
            club_id: club.id,
            title: plan.title,
            scheduled_start_at: start.toISOString(),
            scheduled_end_at: end.toISOString(),
            duration_minutes: 120,
            location_name: seededVenues[Math.floor(Math.random() * seededVenues.length)].name,
            venue_id: seededVenues[Math.floor(Math.random() * seededVenues.length)].id,
            capacity: 12,
            fee_twd: 150,
            status: plan.status,
            created_by: club.owner_user_id,
          })
          .select("*")
          .single();

        if (sError) throw sError;
        seededSessions.push(session);
      }
    }

    // 6. Registrations & Reviews
    for (const session of seededSessions) {
      // Register 6 random users
      const shuffled = [...seededUsers].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 6);

      for (const user of selected) {
        const { data: reg } = await supabaseAdmin
          .from("session_registrations")
          .upsert({
            session_id: session.id,
            user_id: user.id,
            status: "confirmed",
          }, { onConflict: "session_id,user_id" })
          .select("*")
          .single();

        // If session is completed, add reviews
        if (session.status === "completed") {
          // Venue Review
          await supabaseAdmin.from("venue_reviews").upsert({
            venue_id: session.venue_id,
            session_id: session.id,
            reviewer_user_id: user.id,
            facilities_rating: 4 + Math.floor(Math.random() * 2), // 4 or 5
            lighting_rating: 4 + Math.floor(Math.random() * 2),
            floor_rating: 4 + Math.floor(Math.random() * 2),
            transport_rating: 4 + Math.floor(Math.random() * 2),
            comment: "場地很棒！球場非常乾淨整潔。",
          }, { onConflict: "session_id,reviewer_user_id" });

          // Peer Reviews for others in the session
          const others = selected.filter((o) => o.id !== user.id).slice(0, 2);
          for (const other of others) {
            await supabaseAdmin.from("peer_reviews").upsert({
              session_id: session.id,
              reviewer_user_id: user.id,
              reviewee_user_id: other.id,
              rating: 5,
              badges: ["準時王", "神對手"],
            }, { onConflict: "session_id,reviewer_user_id,reviewee_user_id" });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        users: seededUsers.length,
        venues: seededVenues.length,
        clubs: seededClubs.length,
        sessions: seededSessions.length,
      },
    });
  } catch (err: any) {
    console.error("Seeding error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
