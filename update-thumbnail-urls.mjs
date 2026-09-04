// update-thumbnail-urls.mjs
//
// Same fix as update-cdn-urls.mjs, but for the `products.thumbnail_url` column
// instead of `product_images.url`. This is what homepage/browse cards use.
//
// USAGE:
//   Dry run:    node update-thumbnail-urls.mjs
//   Apply:      node update-thumbnail-urls.mjs --apply

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) process.env[match[1]] = process.env[match[1]] ?? match[2].trim();
}

const OLD_DOMAIN = "cdn.allnaturalbox.com";
const NEW_DOMAIN = "cdn.hireaireceptionist.com";
const APPLY = process.argv.includes("--apply");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log(APPLY ? "APPLY MODE — rows will be updated.\n" : "DRY RUN — no changes will be made.\n");

  const { data: rows, error } = await supabase
    .from("products")
    .select("id, thumbnail_url")
    .ilike("thumbnail_url", `%${OLD_DOMAIN}%`);

  if (error) {
    console.error("Error fetching rows:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log(`No rows found containing "${OLD_DOMAIN}" in thumbnail_url. Nothing to do.`);
    return;
  }

  console.log(`Found ${rows.length} row(s) to update:\n`);

  for (const row of rows) {
    const newUrl = row.thumbnail_url.replace(OLD_DOMAIN, NEW_DOMAIN);
    console.log(`  id=${row.id}`);
    console.log(`    old: ${row.thumbnail_url}`);
    console.log(`    new: ${newUrl}`);

    if (APPLY) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ thumbnail_url: newUrl })
        .eq("id", row.id);

      if (updateError) {
        console.error(`    FAILED: ${updateError.message}`);
      } else {
        console.log(`    updated.`);
      }
    }
  }

  console.log(
    APPLY
      ? "\nDone. All matching rows updated."
      : "\nDry run complete. Re-run with --apply to actually update these rows."
  );
}

main();
