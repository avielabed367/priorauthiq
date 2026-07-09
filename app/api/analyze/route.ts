import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "avielabed3@gmail.com";
const DAILY_ANALYSIS_LIMIT = Number(process.env.DAILY_ANALYSIS_LIMIT || "10");
const MAX_CASE_CHARS = 15000;
const MAX_NOTES_CHARS = 10000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        auth: {
          persistSession: false,
        },
      })
    : null;

async function getLoggedInUser(req: Request) {
  if (!supabaseAuth) {
    return null;
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

function getTodayStartIso() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

async function getTodayAnalysisCount(userId: string) {
  if (!supabaseAdmin) {
    return 0;
  }

  const todayStartIso = getTodayStartIso();

  const { count, error } = await supabaseAdmin
    .from("analysis_logs")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .gte("created_at", todayStartIso);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

async function logAnalysis(userId: string, userEmail: string) {
  if (!supabaseAdmin) {
    return;
  }

  const { error } = await supabaseAdmin.from("analysis_logs").insert({
    user_id: userId,
    user_email: userEmail,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function getSafeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const patientLabel = getSafeString(body.patientLabel) || "Sample Patient";
    const practiceName = getSafeString(body.practiceName) || "Sample Practice";
    const payer = getSafeString(body.payer) || "Unknown payer";
    const service = getSafeString(body.service) || "Unknown service";
    const notesText = getSafeString(body.notesText);

    const sourceCaseText =
      getSafeString(body.sourceCaseText) ||
      getSafeString(body.caseText) ||
      getSafeString(body.denialText);

    const demoAcknowledged = body.demoAcknowledged === true;

    if (demoAcknowledged !== true) {
      return NextResponse.json(
        {
          error:
            "Confirm this is fake, sample, or de-identified demo data before running analysis.",
        },
        { status: 400 }
      );
    }

    if (!sourceCaseText) {
      return NextResponse.json(
        {
          error: "sourceCaseText is required.",
        },
        { status: 400 }
      );
    }

    if (sourceCaseText.length > MAX_CASE_CHARS) {
      return NextResponse.json(
        {
          error: `Case text is too long. Keep it under ${MAX_CASE_CHARS.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }

    if (notesText.length > MAX_NOTES_CHARS) {
      return NextResponse.json(
        {
          error: `Notes text is too long. Keep it under ${MAX_NOTES_CHARS.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }

    const user = await getLoggedInUser(req);

    if (user) {
      const userEmail = user.email || "";
      const isAdmin = userEmail === ADMIN_EMAIL;

      if (!isAdmin) {
        const todayCount = await getTodayAnalysisCount(user.id);

        if (todayCount >= DAILY_ANALYSIS_LIMIT) {
          return NextResponse.json(
            {
              error:
                "Daily AI analysis limit reached. Try again tomorrow or contact the demo owner.",
            },
            { status: 429 }
          );
        }
      }
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a healthcare revenue cycle workflow assistant for fake/sample case review. Your job is to help billing and admin teams flag potential front-end denial-risk issues before claim submission or continued service. Focus on eligibility, benefits, prior authorization, missing documentation, medical necessity support, coding risk, coverage/network risk, and follow-up workflow gaps. Be specific and realistic. Do not be generic. Do not make final billing, medical, legal, or coverage decisions. Do not claim that a denial will definitely happen or that payment will be guaranteed. Do not say the tool replaces billers. Always require human review.",
        },
        {
          role: "user",
          content: `
Create a structured Front-End Risk Review for this fake/sample case.

Important rules:
- Use only the provided fake, sample, or de-identified information.
- Do not invent patient facts, payer rules, diagnoses, coverage rules, or medical details.
- You may identify what is unclear or missing.
- Do not give medical advice.
- Do not make final billing, medical, legal, or coverage decisions.
- Do not say anything is guaranteed.
- The analysis must be specific to this case.
- The output must be valid JSON only.
- Human review must be required.

Patient label:
${patientLabel}

Practice:
${practiceName}

Payer:
${payer}

Service:
${service}

Sample case text:
${sourceCaseText}

Additional notes:
${notesText}
          `,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "front_end_denial_risk_review",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              patientLabel: {
                type: "string",
              },
              practiceName: {
                type: "string",
              },
              payer: {
                type: "string",
              },
              service: {
                type: "string",
              },
              overallRiskLevel: {
                type: "string",
                enum: ["Low", "Medium", "High"],
              },
              riskReason: {
                type: "string",
              },
              issuesFound: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    category: {
                      type: "string",
                      enum: [
                        "Eligibility / Benefits",
                        "Prior Authorization",
                        "Documentation",
                        "Medical Necessity",
                        "Coding",
                        "Coverage / Network",
                        "Follow-Up / Workflow",
                      ],
                    },
                    title: {
                      type: "string",
                    },
                    riskLevel: {
                      type: "string",
                      enum: ["Low", "Medium", "High"],
                    },
                    finding: {
                      type: "string",
                    },
                    whyItMatters: {
                      type: "string",
                    },
                    recommendedAction: {
                      type: "string",
                    },
                    owner: {
                      type: "string",
                      enum: [
                        "Billing/Admin",
                        "Front Desk",
                        "Provider",
                        "Payer",
                        "Human Reviewer",
                      ],
                    },
                  },
                  required: [
                    "category",
                    "title",
                    "riskLevel",
                    "finding",
                    "whyItMatters",
                    "recommendedAction",
                    "owner",
                  ],
                },
              },
              missingItems: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              recommendedNextSteps: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              summary: {
                type: "string",
              },
              followUpMessage: {
                type: "string",
              },
              humanReviewRequired: {
                type: "boolean",
              },
            },
            required: [
              "patientLabel",
              "practiceName",
              "payer",
              "service",
              "overallRiskLevel",
              "riskReason",
              "issuesFound",
              "missingItems",
              "recommendedNextSteps",
              "summary",
              "followUpMessage",
              "humanReviewRequired",
            ],
          },
          strict: true,
        },
      },
    });

    if (user) {
      await logAnalysis(user.id, user.email || "");
    }

    const outputText = response.output_text;
    const parsed = JSON.parse(outputText);

    return NextResponse.json({
      ...parsed,
      humanReviewRequired: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to analyze case.",
      },
      { status: 500 }
    );
  }
}