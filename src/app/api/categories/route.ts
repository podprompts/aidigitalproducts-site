import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60; // ISR: re-fetch at most once per minute

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[categories API]', error.message);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}