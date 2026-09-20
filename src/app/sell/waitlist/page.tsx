import { redirect } from "next/navigation";

export default function SellerWaitlistRedirect() {
  redirect("/sell/apply");
}