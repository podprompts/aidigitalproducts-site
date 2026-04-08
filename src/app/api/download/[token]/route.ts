import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: tokenRow, error } = await supabaseAdmin
    .from("download_tokens")
    .select("id, product_id, download_count, max_downloads, expires_at")
    .eq("token", token)
    .single();

  if (error || !tokenRow) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px">
        <h2>Invalid or expired download link.</h2>
        <p>This link is no longer valid. Please check your email or contact support.</p>
        <a href="/">Return home</a>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px">
        <h2>Download link expired.</h2>
        <p>This link expired 7 days after purchase. Please contact support if you need access.</p>
        <a href="/">Return home</a>
      </body></html>`,
      { status: 410, headers: { "Content-Type": "text/html" } }
    );
  }

  if (tokenRow.download_count >= tokenRow.max_downloads) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px">
        <h2>Download limit reached.</h2>
        <p>This link has been used the maximum number of times. Please contact support.</p>
        <a href="/">Return home</a>
      </body></html>`,
      { status: 403, headers: { "Content-Type": "text/html" } }
    );
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("download_file_url")
    .eq("id", tokenRow.product_id)
    .single();

  if (!product?.download_file_url) {
    return NextResponse.json({ error: "No file available for this product." }, { status: 404 });
  }

  // Increment download count
  await supabaseAdmin
    .from("download_tokens")
    .update({ download_count: tokenRow.download_count + 1 })
    .eq("id", tokenRow.id);

  // Generate a short-lived signed URL (60 seconds)
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from("product-files")
    .createSignedUrl(product.download_file_url, 60);

  if (signedError || !signedData?.signedUrl) {
    console.error("[download] signed URL error", signedError);
    return NextResponse.json({ error: "Could not generate download link." }, { status: 500 });
  }

  return NextResponse.redirect(signedData.signedUrl);
}
