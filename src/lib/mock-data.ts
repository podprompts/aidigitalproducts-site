export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  seller: string;
  description: string;
  /** Stripe Price ID — present means the product is purchasable */
  priceId?: string;
  /** Feature bullet list shown in the "What's included" section */
  features?: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export type TrendingSearch = string;

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
}

// ─── Real products (live in Supabase + Stripe) ───────────────────────────────

export const mockProducts: Product[] = [
  {
    id: "4fbcfb3a-2324-4fc7-aaa1-a2263bd45338",
    slug: "ultimate-prompt-pack-bundle",
    title: "Ultimate All 3 Prompt Packs Bundle",
    category: "Prompt Packs",
    price: 24.95,
    seller: "AI Digital Products",
    description:
      "Get the complete collection: Outdoors & Adventure, Blue Collar Trades, and Pet & Animal Lovers — all 150 prompts in one bundle. The ultimate starter kit for print-on-demand sellers who want to dominate multiple niches.",
    priceId: "price_1TJYCnEU074NZnN8EbBXZw7s",
    features: [
      "150 AI prompts (all 3 packs)",
      "3 profitable niches covered",
      "Works with Midjourney, DALL-E, Ideogram",
      "Commercial use license",
      "Instant download",
      "Save $5 vs buying separately",
    ],
  },
  {
    id: "df07e7f7-8bde-4b74-9206-b03a16a31351",
    slug: "outdoors-adventure-prompt-pack",
    title: "Outdoors & Adventure Prompt Pack 50",
    category: "Prompt Packs",
    price: 9.99,
    seller: "AI Digital Products",
    description:
      "Unlock 50 expertly crafted AI prompts designed specifically for the outdoor and adventure niche. Perfect for creating stunning print-on-demand designs for hikers, campers, mountain lovers, and nature enthusiasts. Just paste into your favourite AI image generator and start creating.",
    priceId: "price_1TJYBlEU074NZnN830sEZ3MJ",
    features: [
      "50 ready-to-use AI prompts",
      "Outdoor & adventure niche",
      "Works with Midjourney, DALL-E, Ideogram",
      "Commercial use license",
      "Instant download",
    ],
  },
  {
    id: "de505480-e1c7-460c-8a10-ea19f92fd73e",
    slug: "blue-collar-trades-prompt-pack",
    title: "Blue Collar Trades Prompt Pack 50",
    category: "Prompt Packs",
    price: 9.99,
    seller: "AI Digital Products",
    description:
      "Get 50 powerful AI prompts crafted for the blue collar market. Create designs that resonate with electricians, plumbers, welders, carpenters, mechanics, and hardworking tradespeople. High-demand niche with loyal customers.",
    priceId: "price_1TJYC7EU074NZnN8wDCCz4Cv",
    features: [
      "50 ready-to-use AI prompts",
      "Blue collar & trades niche",
      "Works with Midjourney, DALL-E, Ideogram",
      "Commercial use license",
      "Instant download",
    ],
  },
  {
    id: "0c524422-e728-44a8-a9d0-db5466f8e843",
    slug: "pet-animal-lovers-prompt-pack",
    title: "Pet & Animal Lovers Prompt Pack 50",
    category: "Prompt Packs",
    price: 9.99,
    seller: "AI Digital Products",
    description:
      "Tap into the massive pet lover market with 50 AI prompts designed for dog moms, cat dads, and animal enthusiasts. Create heartwarming, funny, and emotional designs that pet owners can not resist buying.",
    priceId: "price_1TJYCQEU074NZnN8ZNCqEl5H",
    features: [
      "50 ready-to-use AI prompts",
      "Pet & animal lover niche",
      "Works with Midjourney, DALL-E, Ideogram",
      "Commercial use license",
      "Instant download",
    ],
  },

  // ─── Coming-soon mock products (no priceId) ────────────────────────────────

  {
    id: "5",
    slug: "support-chatbot-starter",
    title: "Support Chatbot Starter",
    category: "Chatbots",
    price: 97,
    seller: "Studio Meridian",
    description:
      "A pre-built customer support chatbot trained on common support patterns. Deploy to your website in an afternoon. Includes full configuration documentation and a walkthrough.",
  },
  {
    id: "6",
    slug: "faq-chatbot-kit",
    title: "FAQ Chatbot Kit",
    category: "Chatbots",
    price: 47,
    seller: "The Prompt Lab",
    description:
      "A lightweight FAQ bot designed for documentation sites and knowledge bases. Configured for accuracy over flair. Works out of the box with minimal setup.",
  },
  {
    id: "7",
    slug: "outbound-voice-agent",
    title: "Outbound Voice Agent",
    category: "Voice Agents",
    price: 297,
    seller: "Meridian Voice",
    description:
      "An outbound calling agent that handles appointment confirmations, follow-ups, and reminders at scale. Sounds natural. Logs every call automatically.",
  },
  {
    id: "8",
    slug: "receptionist-agent-pack",
    title: "Receptionist Agent Pack",
    category: "Voice Agents",
    price: 197,
    seller: "Studio Meridian",
    description:
      "An inbound voice agent built for small businesses. Answers calls, captures leads, qualifies inquiries, and routes to the right person. No hold music required.",
  },
  {
    id: "9",
    slug: "invoice-automation-flow",
    title: "Invoice Automation Flow",
    category: "Automations",
    price: 147,
    seller: "Workflow Works",
    description:
      "Generates and delivers invoices automatically from your existing CRM data. Handles formatting, delivery, and follow-up reminders without manual input.",
  },
  {
    id: "10",
    slug: "crm-sync-workflow",
    title: "CRM Sync Workflow",
    category: "Automations",
    price: 97,
    seller: "Workflow Works",
    description:
      "Keeps two CRM systems in sync without manual exports or double entry. Built for teams running parallel tools during a migration or integration period.",
  },
  {
    id: "11",
    slug: "blog-engine-pro",
    title: "Blog Engine Pro",
    category: "Content Systems",
    price: 127,
    seller: "Content Stack",
    description:
      "A full blog production system: briefing, drafting, editing, and publishing on a consistent schedule. Configured for brand voice consistency across all output.",
  },
  {
    id: "12",
    slug: "social-media-scheduler",
    title: "Social Media Scheduler",
    category: "Content Systems",
    price: 87,
    seller: "Content Stack",
    description:
      "Generates and schedules posts across platforms from a single content brief. Handles format variations per platform. Built for teams running lean.",
  },
  {
    id: "13",
    slug: "lead-qualifier-pipeline",
    title: "Lead Qualifier Pipeline",
    category: "Lead Generation",
    price: 177,
    seller: "Growth Systems",
    description:
      "Scores and routes inbound leads based on fit criteria you define. Connects to your CRM. Removes the manual review step from early-stage qualification.",
  },
  {
    id: "14",
    slug: "cold-outreach-system",
    title: "Cold Outreach System",
    category: "Lead Generation",
    price: 97,
    seller: "Growth Systems",
    description:
      "A sequenced outreach system built for high reply rates. Handles research, personalization, and follow-up. Configured to stay out of spam folders.",
  },
  {
    id: "15",
    slug: "custom-gpt-starter-kit",
    title: "Custom GPT Starter Kit",
    category: "Custom AI Apps",
    price: 497,
    seller: "The Prompt Lab",
    description:
      "A structured starting point for building production-ready custom AI applications. Includes architecture patterns, prompt engineering guides, and deployment checklists.",
  },
  {
    id: "16",
    slug: "ai-saas-template",
    title: "AI SaaS Template",
    category: "Custom AI Apps",
    price: 297,
    seller: "Studio Meridian",
    description:
      "A full-stack template for launching an AI-powered SaaS product. Covers auth, usage metering, and the core AI integration layer. Documented and ready to extend.",
  },
];

export const mockCategories: Category[] = [
  { id: "1", slug: "prompt-packs",    name: "Prompt Packs"    },
  { id: "2", slug: "chatbots",        name: "Chatbots"        },
  { id: "3", slug: "voice-agents",    name: "Voice Agents"    },
  { id: "4", slug: "automations",     name: "Automations"     },
  { id: "5", slug: "content-systems", name: "Content Systems" },
  { id: "6", slug: "lead-generation", name: "Lead Generation" },
  { id: "7", slug: "custom-ai-apps",  name: "Custom AI Apps"  },
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "how-to-price-ai-digital-products",
    title: "How to price your AI digital products",
    category: "Business",
    excerpt:
      "Pricing AI work is different from pricing software. Output is fast. Value is real. Here is a practical framework for finding the right number.",
    date: "2026-03-15",
  },
  {
    id: "2",
    slug: "what-buyers-look-for-in-a-chatbot-listing",
    title: "What buyers look for in a chatbot listing",
    category: "Products",
    excerpt:
      "After reviewing hundreds of listings, patterns emerge. Here is what makes buyers click — and what makes them move on.",
    date: "2026-03-08",
  },
  {
    id: "3",
    slug: "voice-agents-replacing-phone-trees",
    title: "Voice agents are replacing phone trees",
    category: "Products",
    excerpt:
      "The shift is quiet and fast. Voice agents are entering real business workflows at a pace most people have not noticed yet.",
    date: "2026-02-28",
  },
  {
    id: "4",
    slug: "anatomy-of-a-well-built-automation",
    title: "The anatomy of a well-built automation",
    category: "Products",
    excerpt:
      "Not all automations are equal. The difference between a brittle workflow and a robust one comes down to a few design decisions.",
    date: "2026-02-14",
  },
  {
    id: "5",
    slug: "building-a-content-engine-you-can-trust",
    title: "Building a content engine you can trust",
    category: "Tutorial",
    excerpt:
      "A content system should run without you. This is how to build one that does — and how to know when it is actually working.",
    date: "2026-02-01",
  },
  {
    id: "6",
    slug: "from-concept-to-listing-in-a-weekend",
    title: "From concept to listing in a weekend",
    category: "Business",
    excerpt:
      "A walkthrough of turning a working AI tool into a polished marketplace listing. The steps, the decisions, and what to skip.",
    date: "2026-01-20",
  },
];

export const mockTrendingSearches: TrendingSearch[] = [
  "prompt packs",
  "print on demand",
  "voice agents",
  "chatbot templates",
  "content automation",
  "lead gen scripts",
  "AI receptionists",
  "email workflows",
];
