import { supabaseAdmin } from "@/lib/supabase/server";
import { mockCategories } from "@/lib/mock-data";

// NOTE ON MODEL CHOICE: this reuses the exact model string already proven
// working in src/app/products/[slug]/page.tsx (generateHowToUseSteps) —
// claude-haiku-4-5-20251001 — rather than guessing at a stronger model ID
// that hasn't been confirmed against this API key. If better prose quality
// is wanted, confirm which models the key has access to and change the
// string below; a wrong ID here fails silently in an unattended cron.
const MODEL = "claude-haiku-4-5-20251001";

export const TOPIC_ORDER = ["pricing_advice", "buyer_seller_tips", "category_deep_dive"] as const;
export type TopicType = (typeof TOPIC_ORDER)[number];

const TOPIC_BLOG_CATEGORY: Record<TopicType, string> = {
  pricing_advice: "Business",
  buyer_seller_tips: "Products",
  category_deep_dive: "Tutorial",
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  for (;;) {
    const { data } = await supabaseAdmin.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n}`;
    n++;
  }
}

// Cycles through TOPIC_ORDER based on the most recent post's topic, so
// consecutive drafts never repeat a topic type back to back.
async function nextTopicType(): Promise<TopicType> {
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("topic_type")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.topic_type) return TOPIC_ORDER[0];
  const idx = TOPIC_ORDER.indexOf(data.topic_type as TopicType);
  return TOPIC_ORDER[(idx + 1) % TOPIC_ORDER.length];
}

// For category_deep_dive posts, rotates through real product categories
// rather than repeating the same one, based on how many deep-dives exist so far.
async function pickProductCategory(): Promise<string> {
  const { count } = await supabaseAdmin
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("topic_type", "category_deep_dive");
  const idx = (count ?? 0) % mockCategories.length;
  return mockCategories[idx].name;
}

function promptFor(topic: TopicType, productCategory: string): string {
  const shared = `You write blog posts for AI Digital Products, a marketplace for AI-made digital products (prompt packs, chatbots, voice agents, automations, content systems, lead generation tools, custom AI apps).

CRITICAL RULES:
- Do NOT invent statistics, customer counts, testimonials, or any specific claims about AI Digital Products as a business (no "our thousands of sellers", no made-up numbers).
- Do NOT reference real named companies, products, or people.
- Write general, genuinely useful advice a reader could act on. No fluff, no filler.
- Return ONLY valid JSON, nothing else, no markdown fences: {"title": "...", "excerpt": "...", "body": "..."}
- "excerpt" is 1-2 sentences, under 160 characters.
- "body" is 4-6 paragraphs of plain text separated by a blank line (\\n\\n between paragraphs). No headers, no markdown, no bullet lists inside body.`;

  if (topic === "pricing_advice") {
    return `${shared}\n\nTopic: practical pricing advice for someone selling an AI-made digital product. Cover how to think about pricing relative to value delivered, common mistakes, and how to test a price.`;
  }
  if (topic === "buyer_seller_tips") {
    return `${shared}\n\nTopic: a practical tip for either buyers or sellers of AI digital products (pick one angle) — e.g. what makes a listing trustworthy, what to check before buying, or how to write a description that converts.`;
  }
  return `${shared}\n\nTopic: a deep dive specifically about the "${productCategory}" category of AI digital products — what makes a good one, what buyers in this category actually want, and a common pitfall to avoid.`;
}

interface GeneratedPost { title: string; excerpt: string; body: string }

async function callClaude(prompt: string): Promise<GeneratedPost> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  const text = (data.content?.[0]?.text ?? "").trim().replace(/^```json\s*|```$/g, "");
  const parsed = JSON.parse(text);
  if (!parsed.title || !parsed.excerpt || !parsed.body) {
    throw new Error("Model response missing required fields");
  }
  return parsed as GeneratedPost;
}

export interface DraftResult { id: string; title: string; slug: string }

// Generates one draft post, inserts it with status='draft', and returns it.
// Never publishes — that's always a separate, explicit admin action.
export async function generateBlogDraft(): Promise<DraftResult> {
  const topic = await nextTopicType();
  const productCategory = topic === "category_deep_dive" ? await pickProductCategory() : "";
  const generated = await callClaude(promptFor(topic, productCategory));
  const slug = await uniqueSlug(slugify(generated.title));

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .insert({
      slug,
      title: generated.title,
      category: TOPIC_BLOG_CATEGORY[topic],
      excerpt: generated.excerpt.slice(0, 300),
      body: generated.body,
      status: "draft",
      topic_type: topic,
    })
    .select("id, title, slug")
    .single();

  if (error || !data) {
    console.error("[blog-generation] insert failed", error);
    throw new Error("Failed to save generated draft");
  }
  return data as DraftResult;
}