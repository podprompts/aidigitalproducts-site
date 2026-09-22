import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { generateBlogDraft } from "@/lib/blog-generation";

// Manual "generate now" for the admin UI — same generation logic the
// weekly cron uses, without waiting for the schedule. Still only ever
// creates a draft; publishing remains a separate explicit action.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  try {
    const draft = await generateBlogDraft();
    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    console.error("[admin/blog/generate] failed", err);
    return NextResponse.json({ error: "Generation failed. Check server logs." }, { status: 500 });
  }
}