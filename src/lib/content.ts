export interface Product {
  num: string;
  title: string;
  desc: string;
}

export interface Stat {
  num: string;
  label: string;
}

export interface PricingTier {
  tier: string;
  amount: string;
  period: string;
  desc: string;
  features: string[];
  btnLabel: string;
  btnHref: string;
  /** Override the default 56px amount font size for longer price strings */
  amountSize?: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export const products: Product[] = [
  {
    num: "01",
    title: "Chatbots",
    desc: "Conversational agents trained on your business, ready to deploy on web or messaging.",
  },
  {
    num: "02",
    title: "Voice Agents",
    desc: "AI receptionists and outbound callers that sound human and never sleep.",
  },
  {
    num: "03",
    title: "Automations",
    desc: "End-to-end workflows that run your back office while you focus on growth.",
  },
  {
    num: "04",
    title: "Content Systems",
    desc: "Production engines for blogs, social, and email — on brand, on schedule.",
  },
  {
    num: "05",
    title: "Lead Generation",
    desc: "Pipelines that find, qualify, and warm up prospects without the busywork.",
  },
  {
    num: "06",
    title: "Custom AI Apps",
    desc: "Bespoke builds, scoped and shipped. Your problem. Our engineering.",
  },
];

export const stats: Stat[] = [
  { num: "20",       label: "Categories"      },
  { num: "3",        label: "Tiers"           },
  { num: "$1249",      label: "Most Popular"    },
  { num: "Instant",  label: "Download"        },
];

export const pricingTiers: PricingTier[] = [
  {
    tier: "Starter",
    amount: "	$49–$249",
    period: "/once",
    desc: "Entry-level templates and lightweight automations.",
    features: [
      "Prompt systems",
      "Premium templates",
      "Automation recipes",
      "SOP & workflow docs",
      "Instant delivery",
      "Lifetime updates",
      "Ready-to-use AI assets",
    ],
    btnLabel: "Browse Starter",
    btnHref: "/products",
    amountSize: "36px",
  },
  {
    tier: "Professional",
    amount: "$499–$1,499",
    period: "/+retainer",
    desc: "Full-stack systems built for real business results.",
    features: [
      "	Done-for-you AI systems",
      "	Custom AI workflows",
      "API & tool integrations",
      "	Workflow automation",
      "	AI Operating Systems",
      "	Knowledge-base setup",
      "	Implementation support",
      "	30-day optimization support",
    ],
    btnLabel: "Contact Us",
    btnHref: "/contact",
    amountSize: "36px",
  },
  {
    tier: "Enterprise",
    amount: "$2,500+ / custom",
    period: "",
    desc: "Premium, done-for-you AI systems. White-glove quality.",
    features: [
      "Fully managed AI infrastructure",
      "End-to-end deployment",
      "	Custom AI agents",
      "CRM / business integrations",
      "Custom Operating Systems",
      "	Advanced automations",
      "	Dedicated support",
      "	Ongoing optimization",
    ],
    btnLabel: "Contact Us",
    btnHref: "/contact",
    amountSize: "36px",
  },
];

export const footerLinks: FooterLink[] = [
  { label: "Terms",   href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Support", href: "#" },
  { label: "Contact", href: "#" },
];