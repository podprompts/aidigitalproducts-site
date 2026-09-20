# Adds force-dynamic to prevent Next.js from caching a stale, empty
# response for this route from before any subscribers existed.

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!await isAdminAuthed(req)) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscribers: data ?? [] });
}
'@
Set-Content -LiteralPath "src\app\api\admin\subscribers\route.ts" -Value $content -NoNewline
Write-Host "UPDATED: src\app\api\admin\subscribers\route.ts" -ForegroundColor Green
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan