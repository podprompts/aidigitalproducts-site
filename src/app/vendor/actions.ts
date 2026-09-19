"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server-session";

export async function signOutAction() {
  const cookieStore = await cookies();
  const supabase = createSessionClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/vendor/login");
}