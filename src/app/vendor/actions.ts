"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server-session";

export async function signOutAction() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/vendor/login");
}