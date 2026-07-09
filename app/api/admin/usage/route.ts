import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "avielabed3@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

async function requireAdminUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  if (data.user.email !== ADMIN_EMAIL) {
    return null;
  }

  return data.user;
}

function getTodayStartIso() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function GET(req: Request) {
  try {
    const adminUser = await requireAdminUser(req);

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const todayStartIso = getTodayStartIso();

    const { data: logs, error: logsError } = await supabaseAdmin
      .from("analysis_logs")
      .select("id, user_id, user_email, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (logsError) {
      throw new Error(logsError.message);
    }

    const { count: todayCount, error: todayCountError } = await supabaseAdmin
      .from("analysis_logs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .gte("created_at", todayStartIso);

    if (todayCountError) {
      throw new Error(todayCountError.message);
    }

    const { count: totalCount, error: totalCountError } = await supabaseAdmin
      .from("analysis_logs")
      .select("id", {
        count: "exact",
        head: true,
      });

    if (totalCountError) {
      throw new Error(totalCountError.message);
    }

    const usageByEmail = new Map<
      string,
      {
        email: string;
        total: number;
        today: number;
        latest: string;
      }
    >();

    for (const log of logs || []) {
      const email = log.user_email || "unknown";
      const existing = usageByEmail.get(email);

      const isToday = log.created_at >= todayStartIso;

      if (!existing) {
        usageByEmail.set(email, {
          email,
          total: 1,
          today: isToday ? 1 : 0,
          latest: log.created_at,
        });
      } else {
        existing.total += 1;

        if (isToday) {
          existing.today += 1;
        }

        if (log.created_at > existing.latest) {
          existing.latest = log.created_at;
        }
      }
    }

    return NextResponse.json({
      totalCount: totalCount || 0,
      todayCount: todayCount || 0,
      dailyLimit: Number(process.env.DAILY_ANALYSIS_LIMIT || "10"),
      logs: logs || [],
      users: Array.from(usageByEmail.values()).sort(
        (a, b) => b.total - a.total
      ),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load usage data." },
      { status: 500 }
    );
  }
}