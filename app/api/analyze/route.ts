import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeReadiness } from "@/lib/readinessEngine";
import { AnalyzeCaseRequest } from "@/lib/types";

const ADMIN_EMAIL = "avielabed3@gmail.com";
const DAILY_ANALYSIS_LIMIT = Number(process.env.DAILY_ANALYSIS_LIMIT || "50");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAuth =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

async function getLoggedInUser(req: Request) {
  if (!supabaseAuth) return null;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user;
}

function getTodayStartIso() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

async function getTodayAnalysisCount(userId: string) {
  if (!supabaseAdmin) return 0;

  const { count, error } = await supabaseAdmin
    .from("analysis_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", getTodayStartIso());

  if (error) throw new Error(error.message);
  return count || 0;
}

async function logAnalysis(userId: string, userEmail: string) {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin.from("analysis_logs").insert({
    user_id: userId,
    user_email: userEmail,
  });

  if (error) throw new Error(error.message);
}

function isAnalyzeRequest(value: unknown): value is AnalyzeCaseRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AnalyzeCaseRequest>;

  return Boolean(
    candidate.demoAcknowledged === true &&
      candidate.caseIdentifier &&
      candidate.patientLabel &&
      candidate.practiceName &&
      candidate.appointmentAt &&
      candidate.dateOfService &&
      candidate.insurance &&
      Array.isArray(candidate.services) &&
      Array.isArray(candidate.diagnoses) &&
      candidate.authorization &&
      candidate.referral &&
      Array.isArray(candidate.documents) &&
      Array.isArray(candidate.evidence)
  );
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!isAnalyzeRequest(body)) {
      return NextResponse.json(
        {
          error:
            "The case is incomplete. Confirm this is fake/sample data and complete the required case, insurance, service, and workflow sections.",
        },
        { status: 400 }
      );
    }

    const user = await getLoggedInUser(req);

    if (user && user.email !== ADMIN_EMAIL) {
      const todayCount = await getTodayAnalysisCount(user.id);

      if (todayCount >= DAILY_ANALYSIS_LIMIT) {
        return NextResponse.json(
          {
            error:
              "Daily demo analysis limit reached. Try again tomorrow or contact the demo owner.",
          },
          { status: 429 }
        );
      }
    }

    const result = analyzeReadiness(body);

    if (user) {
      await logAnalysis(user.id, user.email || "");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run the readiness review.",
      },
      { status: 500 }
    );
  }
}
