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
  { num: "7",   label: "Categories"   },
  { num: "3",   label: "Tiers"        },
  { num: "$9",  label: "Starting At"  },
  { num: "0%",  label: "Listing Fee"  },
];

export const pricingTiers: PricingTier[] = [
  {
    tier: "Starter",
    amount: "$9",
    period: "/once",
    desc: "Entry-level templates and lightweight automations.",
    features: [
      "Prompt libraries",
      "Starter templates",
      "Basic automations",
      "Instant download",
    ],
    btnLabel: "Browse Starter",
  },
  {
    tier: "Professional",
    amount: "$97",
    period: "/once",
    desc: "Full-stack systems built for real business results.",
    features: [
      "Plug-and-play systems",
      "Documentation included",
      "Setup walkthroughs",
      "Email support",
    ],
    btnLabel: "Browse Pro",
  },
  {
    tier: "Enterprise",
    amount: "$497",
    period: "/once",
    desc: "Premium, done-for-you AI systems. White-glove quality.",
    features: [
      "Complete deployments",
      "Custom configuration",
      "Priority support",
      "Lifetime updates",
    ],
    btnLabel: "Browse Enterprise",
  },
];

export const footerLinks: FooterLink[] = [
  { label: "Terms",   href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Support", href: "#" },
  { label: "Contact", href: "#" },
];
