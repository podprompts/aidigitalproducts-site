export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  /** "Sold by" name — resolved from the real vendor relationship at query time; falls back to a default if unset */
  seller?: string;
  /** Vendor's profile picture URL — resolved alongside seller at query time */
  sellerAvatarUrl?: string;
  description: string;
  /** Stripe Price ID — present means the product is purchasable (sale price when on sale) */
  priceId?: string;
  /** Regular (full) price in dollars — present means product is on sale */
  regularPrice?: number;
  /** Stripe Price ID used after the countdown timer expires */
  regularPriceId?: string;
  /** PLR license price in dollars — present means this product offers a PLR license */
  plrPrice?: number;
  /** Stripe Price ID for the PLR license tier */
  plrPriceId?: string;
  /** Whether this product currently offers a PLR license option at all */
  isPlrAvailable?: boolean;
  /** Thumbnail image URL — Supabase Storage or any allowed remote */
  thumbnailUrl?: string;
  /** Preview video URL — mp4, plays silently on card hover */
  videoUrl?: string;
  /** Feature bullet list shown in the "What's included" section */
  features?: string[];
  /** ISO timestamp — when the product was first created */
  createdAt?: string;
  /** ISO timestamp — when the product was last updated */
  updatedAt?: string;
  /** Admin-marked favorite — renders a thicker border on product cards */
  isFavorite?: boolean;
  /** Admin-marked as featured — highlights the product card with an outline */
  isFeatured?: boolean;
  /** Admin-marked as not an AI product */
  isNotAi?: boolean;
  /** Aggregate star rating (1–5) from approved reviews */
  rating?: number;
  /** Total number of approved reviews */
  reviewCount?: number;
  /** Total confirmed purchases (from products.purchases column) */
  purchases?: number;
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
    id: "e2681b44-077c-4b2e-b531-4b206bf37bcd",
    slug: "beacons-ai-playbook-monetization-guide-with-mrr-plr-71-page-editable-ebook",
    title: "Beacons AI Playbook: Monetization Guide with MRR & PLR (71-Page Editable eBook)",
    category: "Content Systems",
    price: 9.99,
    description:
      "A 71-page editable eBook and step-by-step guide to monetizing your content on the Beacons platform. Includes 2 bonus MRR & PLR products.",
    priceId: "price_1TMoq4Rv2p2YlsIVgyBmLVcL",
    regularPrice: 12.99,
    regularPriceId: "price_1TMor8Rv2p2YlsIVWRXLp7p4",
    isFavorite: false,
    isFeatured: false,
    isNotAi: false,
    features: [
      "71-page editable eBook",
      "Step-by-step Beacons monetization guide",
      "2 bonus MRR & PLR products",
      "Instant download",
      "Commercial use license",
    ],
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
