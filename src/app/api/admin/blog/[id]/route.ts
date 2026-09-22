import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed(req))) return unauthorized();

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });

  let body: { action?: string; title?: string; category?: string; excerpt?: string; postBody?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin.from("blog_posts").select("status").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (body.action === "publish") {
    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Only a draft can be published." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "discard") {
    const { error } = await supabaseAdmin.from("blog_posts").update({ status: "discarded" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "edit") {
    const update: Record<string, string> = {};
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim().slice(0, 200);
    if (typeof body.category === "string" && body.category.trim()) update.category = body.category.trim().slice(0, 60);
    if (typeof body.excerpt === "string" && body.excerpt.trim()) update.excerpt = body.excerpt.trim().slice(0, 300);
    if (typeof body.postBody === "string" && body.postBody.trim()) update.body = body.postBody.trim();
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("blog_posts").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}