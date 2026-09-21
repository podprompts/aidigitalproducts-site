import { supabaseAdmin } from "@/lib/supabase/server";
import ReviewSubmissionForm from "./ReviewSubmissionForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function ReviewTokenPage({ params }: Props) {
  const { token } = await params;

  const { data: reviewToken } = await supabaseAdmin
    .from("review_tokens")
    .select("product_id, customer_name, used, expires_at")
    .eq("token", token)
    .single();

  if (!reviewToken) {
    return <ReviewSubmissionForm token={token} state="invalid" />;
  }

  if (reviewToken.used) {
    return <ReviewSubmissionForm token={token} state="used" />;
  }

  if (new Date(reviewToken.expires_at) < new Date()) {
    return <ReviewSubmissionForm token={token} state="expired" />;
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("name, thumbnail_url")
    .eq("id", reviewToken.product_id)
    .single();

  return (
    <ReviewSubmissionForm
      token={token}
      state="valid"
      productName={product?.name ?? "your purchase"}
      productThumbnailUrl={product?.thumbnail_url ?? null}
      customerFirstName={reviewToken.customer_name?.split(" ")[0] ?? null}
    />
  );
}
