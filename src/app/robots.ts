import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/vendor", "/api/", "/checkout", "/support", "/review"],
      },
    ],
    sitemap: "https://www.aidigitalproducts.com/sitemap.xml",
  };
}