import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateBlogDraft } from "@/lib/blog-generation";
import { adminAlertAddress, safeSend, siteUrl } from "@/lib/support";

const REMINDER_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// Intended to run weekly via cron-job.org. Logic:
// - An unreviewed draft younger than 3 days -> do nothing, still in grace period.
// - An unreviewed draft 3+ days old -> send a reminder, don't create a second one.
// - No pending draft -> generate a new one and alert the admin.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: pending } = await supabaseAdmin
      .from("blog_posts")
      .select("id, title, created_at")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pending) {
      const age = Date.now() - new Date(pending.created_at).getTime();
      if (age < REMINDER_AFTER_MS) {
        return NextResponse.json({ ok: true, action: "waiting", draftId: pending.id });
      }
      await safeSend({
        toEmail: adminAlertAddress(),
        subject: `Reminder: a blog draft is still waiting for review`,
        label: "Blog Draft Reminder",
        heading: "A draft has been waiting a few days.",
        paragraphs: [
          `"${pending.title}" has been sitting unreviewed since ${new Date(pending.created_at).toLocaleDateString()}.`,
          "Review, edit, publish, or discard it from the blog admin page.",
        ],
        ctaLabel: "Open Blog Admin",
        ctaUrl: `${siteUrl()}/admin/blog`,
      });
      return NextResponse.json({ ok: true, action: "reminded", draftId: pending.id });
    }

    const draft = await generateBlogDraft();
    await safeSend({
      toEmail: adminAlertAddress(),
      subject: `New blog draft ready: ${draft.title}`,
      label: "Blog Draft Ready",
      heading: "A new blog draft is ready for review.",
      paragraphs: [`"${draft.title}" was generated and is waiting for your review before it publishes.`],
      ctaLabel: "Review Draft",
      ctaUrl: `${siteUrl()}/admin/blog`,
    });
    return NextResponse.json({ ok: true, action: "generated", draftId: draft.id });
  } catch (err) {
    console.error("[cron/generate-blog-draft] failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}