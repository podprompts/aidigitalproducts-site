import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  // ── 1. Validate the token ──────────────────────────────────────────────────
  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from("download_tokens")
    .select("id, product_id, expires_at, download_count, max_downloads")
    .eq("token", token)
    .single();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: "Invalid download link" }, { status: 404 });
  }

  if (new Date(tokenRow.expires_at as string) < new Date()) {
    return NextResponse.json({ error: "Download link has expired" }, { status: 410 });
  }

  if ((tokenRow.download_count as number) >= (tokenRow.max_downloads as number)) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 403 });
  }

  const productId = tokenRow.product_id as string;

  // ── 2. Check for a ?file=index query param ─────────────────────────────────
  // When no ?file param is present → return JSON manifest listing all files.
  // When ?file=0,1,2… → stream that specific file.
  const fileIndexParam = req.nextUrl.searchParams.get("file");

  // ── 3. Fetch all files for this product ────────────────────────────────────
  const { data: productFiles, error: filesError } = await supabaseAdmin
    .from("product_files")
    .select("id, storage_path, file_name, file_size, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (filesError) {
    console.error("[download] failed to fetch product_files", filesError);
    return NextResponse.json({ error: "Could not load files" }, { status: 500 });
  }

  // ── 4. Fallback: legacy single-file products ───────────────────────────────
  // If no product_files rows exist, fall back to the old products.file_path column.
  if (!productFiles || productFiles.length === 0) {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("file_path, name")
      .eq("id", productId)
      .single();

    if (!product?.file_path) {
      return NextResponse.json({ error: "No files found for this product" }, { status: 404 });
    }

    // Increment download count and stream the legacy file
    await supabaseAdmin
      .from("download_tokens")
      .update({ download_count: (tokenRow.download_count as number) + 1 })
      .eq("id", tokenRow.id);

    const { data: fileData, error: storageError } = await supabaseAdmin.storage
      .from("product-files")
      .download(product.file_path as string);

    if (storageError || !fileData) {
      console.error("[download] storage error (legacy)", storageError);
      return NextResponse.json({ error: "File not available" }, { status: 500 });
    }

    const fileName = (product.file_path as string).split("/").pop() ?? "download.zip";
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  }

  // ── 5. No ?file param → return manifest JSON ───────────────────────────────
  if (fileIndexParam === null) {
    return NextResponse.json({
      files: productFiles.map((f, i) => ({
        index:     i,
        file_name: f.file_name,
        file_size: f.file_size ?? null,
        url:       `/api/download/${token}?file=${i}`,
      })),
      expires_at:      tokenRow.expires_at,
      downloads_left:  (tokenRow.max_downloads as number) - (tokenRow.download_count as number),
    });
  }

  // ── 6. Stream the requested file ──────────────────────────────────────────
  const fileIndex = parseInt(fileIndexParam, 10);
  if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= productFiles.length) {
    return NextResponse.json({ error: "Invalid file index" }, { status: 400 });
  }

  const targetFile = productFiles[fileIndex];

  // Increment download count (counts once per individual file download)
  await supabaseAdmin
    .from("download_tokens")
    .update({ download_count: (tokenRow.download_count as number) + 1 })
    .eq("id", tokenRow.id);

  const { data: fileData, error: storageError } = await supabaseAdmin.storage
    .from("product-files")
    .download(targetFile.storage_path as string);

  if (storageError || !fileData) {
    console.error("[download] storage error", storageError);
    return NextResponse.json({ error: "File not available" }, { status: 500 });
  }

  const fileName = (targetFile.file_name as string) || (targetFile.storage_path as string).split("/").pop() || "download.zip";

  return new NextResponse(fileData, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}