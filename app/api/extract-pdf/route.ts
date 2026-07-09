import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_EXTRACTED_TEXT_CHARS = 15000;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServer =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

async function requireLoggedInUser(req: Request) {
  if (!supabaseServer) {
    return null;
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const { data, error } = await supabaseServer.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function POST(req: Request) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 500 }
      );
    }

    const user = await requireLoggedInUser(req);

    if (!user) {
      return NextResponse.json(
        {
          error: "Log in before extracting PDF text.",
        },
        { status: 401 }
      );
    }

    const demoAcknowledged = req.headers.get("x-demo-acknowledged");

    if (demoAcknowledged !== "true") {
      return NextResponse.json(
        {
          error:
            "Confirm this is fake, sample, or de-identified demo data before extracting PDF text.",
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No PDF file uploaded.",
        },
        { status: 400 }
      );
    }

    const fileName = file.name || "uploaded-file.pdf";
    const isPdf =
      file.type === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          error: "Only PDF files are supported.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `PDF must be smaller than ${MAX_FILE_SIZE_MB}MB.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    const rawText = result.text?.trim() || "";

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "No readable text found. This PDF may be scanned, image-only, locked, or not text-based.",
        },
        { status: 400 }
      );
    }

    const text =
      rawText.length > MAX_EXTRACTED_TEXT_CHARS
        ? rawText.slice(0, MAX_EXTRACTED_TEXT_CHARS)
        : rawText;

    return NextResponse.json({
      text,
      wasTruncated: rawText.length > MAX_EXTRACTED_TEXT_CHARS,
      fileName,
      warning:
        "Use only fake, sample, or de-identified demo information. Human review is required.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to extract PDF text. Make sure the PDF is text-based and does not contain real patient information.",
      },
      { status: 500 }
    );
  }
}