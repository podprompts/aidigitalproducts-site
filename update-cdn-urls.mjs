// update-cdn-urls.mjs
//
// Bulk-replaces the old CDN domain in your Supabase `product_images` table
// with the new one, since env vars only affect NEW uploads.
//
// SETUP:
//   1. Place this file in your AiDigitalProducts-Site repo root.
//   2. Make sure @supabase/supabase-js is installed (it should already be, since you use Supabase):
//        npm install @supabase/supabase-js
//   3. You need your Supabase SERVICE ROLE key (not the anon key) — find it in
//      Supabase dashboard > Project Settings > API > service_role secret.
//      Add it to .env.local if it's not already there:
//        SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
//      (Your NEXT_PUBLIC_SUPABASE_URL should already be in .env.local.)
//
// USAGE:
//   Dry run first (shows what WOULD change, changes nothing):
//     node update-cdn-urls.mjs
//
//   Once the dry run output looks right, actually apply the update:
//     node update-cdn-urls.mjs --apply

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// --- Load .env.local manually (no dotenv dependency needed) ---
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
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log(APPLY ? "APPLY MODE — rows will be updated.\n" : "DRY RUN — no changes will be made.\n");

  const { data: rows, error } = await supabase
    .from("product_images")
    .select("id, url")
    .ilike("url", `%${OLD_DOMAIN}%`);

  if (error) {
    console.error("Error fetching rows:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log(`No rows found containing "${OLD_DOMAIN}". Nothing to do.`);
    return;
  }

  console.log(`Found ${rows.length} row(s) to update:\n`);

  for (const row of rows) {
    const newUrl = row.url.replace(OLD_DOMAIN, NEW_DOMAIN);
    console.log(`  id=${row.id}`);
    console.log(`    old: ${row.url}`);
    console.log(`    new: ${newUrl}`);

    if (APPLY) {
      const { error: updateError } = await supabase
        .from("product_images")
        .update({ url: newUrl })
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
