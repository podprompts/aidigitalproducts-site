# Adds a required rejection-reason field to the Reject flow and sends a
# branded rejection email with that reason, matching the approval email.
# Run from the root of your aidigitalproducts-site repo.

$content = @'
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// aidigitalproducts.com is already a verified sending domain in Resend —
// no further DNS setup needed for this address to work.
const FROM_ADDRESS = "AI Digital Products <orders@aidigitalproducts.com>";

export interface OrderEmailData {
  toEmail: string;
  toName?: string;
  productName: string;
  amountCents: number;
  currency: string;
  downloadUrl?: string;                                        // legacy single-file fallback
  downloadFiles?: { file_name: string; url: string }[];      // multi-file (new)
  orderId: string;
  licenseType?: "personal" | "plr";
  licenseUrl?: string;
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const { toName, productName, amountCents, currency } = data;
  const greeting  = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const amount    = formatCurrency(amountCents, currency);
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year      = new Date().getFullYear();

  const downloadButtons =
    data.downloadFiles && data.downloadFiles.length > 0
      ? data.downloadFiles
          .map(
            (f) =>
              `<a href="${f.url}" class="download-btn" style="display:block; margin-bottom:12px;">${f.file_name}</a>`
          )
          .join("")
      : `<a href="${data.downloadUrl}" class="download-btn">Download Your File</a>`;

  const fileCountNote =
    data.downloadFiles && data.downloadFiles.length > 1
      ? `${data.downloadFiles.length} files included`
      : "1 file included";

  const plrNotice =
    data.licenseType === "plr"
      ? `
        <div style="background:#fdf6e3; border:1px solid #eadfb4; border-radius:4px; padding:16px 20px; margin:24px 0; font-size:13px; color:#6b5d1e; line-height:1.6;">
          <strong>This purchase includes a PLR (resale) license.</strong> You're free to rebrand and resell this product as your own.
          See the <a href="${data.licenseUrl}" style="color:#6b5d1e; text-decoration:underline;">full license terms</a> for what's included and what's restricted.
        </div>
      `
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Order is Ready</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f5f3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1a1a1a; }
    .wrapper { max-width: 580px; margin: 0 auto; padding: 40px 16px; }
    .card { background: #ffffff; border: 1px solid #e5e5e3; }
    .header { padding: 40px 40px 32px; border-bottom: 1px solid #e5e5e3; }
    .logo { font-size: 13px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #1a1a1a; text-decoration: none; }
    .body { padding: 40px; }
    .label { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
    h1 { font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2; margin-bottom: 20px; }
    p { font-size: 15px; color: #555; line-height: 1.65; margin-bottom: 16px; }
    .order-box { background: #f9f9f8; border: 1px solid #e5e5e3; padding: 20px 24px; margin: 28px 0; }
    .order-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
    .order-row + .order-row { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e3; }
    .order-label { color: #888; font-weight: 500; }
    .order-value { color: #1a1a1a; font-weight: 600; }
    .download-section { text-align: center; padding: 32px 0; border-top: 1px solid #e5e5e3; border-bottom: 1px solid #e5e5e3; margin: 32px 0; }
    .download-btn { display: inline-block; background: #1a1a1a; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 16px 36px; }
    .download-note { font-size: 12px; color: #999; margin-top: 16px; margin-bottom: 0; }
    .support { font-size: 13px; color: #888; line-height: 1.6; }
    .support a { color: #1a1a1a; }
    .footer { padding: 24px 40px; border-top: 1px solid #e5e5e3; background: #f9f9f8; }
    .footer p { font-size: 11px; color: #aaa; line-height: 1.7; margin: 0; }
    .footer a { color: #888; text-decoration: none; }
    @media (max-width: 480px) {
      .header, .body, .footer { padding-left: 24px; padding-right: 24px; }
      h1 { font-size: 22px; }
      .order-row { flex-direction: column; align-items: flex-start; gap: 4px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <div class="header">
        <a href="${siteUrl}" class="logo">AI Digital Products</a>
      </div>

      <div class="body">
        <div class="label">Order Confirmed</div>
        <h1>Your download is ready.</h1>
        <p>${greeting} Thank you so much for your purchase — it truly means a lot. We put a lot of care into everything we create, and we hope this gives you exactly what you need. ${data.downloadFiles && data.downloadFiles.length > 1 ? "Your files are ready to download — just click the buttons below." : "Your file is ready to download — just click the button below."}</p>
<p>If you have any questions or feedback, don't hesitate to reach out — we're always happy to help.</p>

        <div class="order-row">
  <span class="order-label">Product</span>
  <span class="order-value" style="margin-left:16px; text-align:right;">${productName}</span>
</div>
<div class="order-row">
  <span class="order-label">Amount paid</span>
  <span class="order-value" style="margin-left:16px;">${amount}</span>
</div>
        </div>

        ${plrNotice}

        <div class="download-section">
          ${downloadButtons}
          <p class="download-note">
            ${fileCountNote} &nbsp;·&nbsp; 15 downloads available &nbsp;·&nbsp; Link expires in 7 days<br />
            Keep this email — it's your permanent receipt.
          </p>
        </div>

        <p class="support">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@aidigitalproducts.com">support@aidigitalproducts.com</a>.
          We typically respond within one business day.
        </p>
      </div>

      <div class="footer">
        <p>
          &copy; ${year} AI Digital Products, LLC &nbsp;·&nbsp;
          <a href="${siteUrl}/privacy">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="${siteUrl}/terms">Terms of Service</a><br />
          You received this because you made a purchase at aidigitalproducts.com.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildOrderConfirmationText(data: OrderEmailData): string {
  const { toName, productName, amountCents, currency } = data;
  const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const amount   = formatCurrency(amountCents, currency);
  const year     = new Date().getFullYear();

  const linksText =
    data.downloadFiles && data.downloadFiles.length > 0
      ? data.downloadFiles
          .map((f, i) => `File ${i + 1} — ${f.file_name}:\n${f.url}`)
          .join("\n\n")
      : data.downloadUrl;

  const plrNoticeText =
    data.licenseType === "plr"
      ? `\nTHIS PURCHASE INCLUDES A PLR (RESALE) LICENSE\nFull terms: ${data.licenseUrl}\n`
      : "";

 return `
${greeting}

Thank you so much for your purchase — it truly means a lot. We put a lot of care into everything we create, and we hope this gives you exactly what you need.

Your order is confirmed and your download is ready below.

ORDER SUMMARY
─────────────
Product: ${productName}
Amount:  ${amount}
${plrNoticeText}
YOUR DOWNLOAD LINKS
───────────────────
${linksText}

You have 15 downloads available per file. Links expire in 7 days.

Questions? Reply to this email or contact support@aidigitalproducts.com.

© ${year} AI Digital Products, LLC
  `.trim();
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const { toEmail, productName, licenseType } = data;

  // Resend returns { data, error } rather than throwing — explicitly throw
  // here so existing callers' .catch() blocks still work exactly as before.
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    replyTo: "support@aidigitalproducts.com",
    subject: `Your order is ready: ${productName}${licenseType === "plr" ? " (PLR License)" : ""}`,
    html: buildOrderConfirmationHtml(data),
    text: buildOrderConfirmationText(data),
  });

  if (error) {
    throw new Error(`Resend failed to send order confirmation: ${error.message}`);
  }
}

export interface VendorRefundEmailData {
  toEmail: string;
  toName?: string;
  productName: string;
  amountCents: number;
  currency: string;
  vendorPayoutCents: number;
  orderId: string;
}

function buildVendorRefundHtml(data: VendorRefundEmailData): string {
  const { toName, productName, amountCents, currency, vendorPayoutCents } = data;
  const greeting     = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const amount       = formatCurrency(amountCents, currency);
  const payoutAmount = formatCurrency(vendorPayoutCents, currency);
  const siteUrl      = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year         = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Refunded</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f5f3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1a1a1a; }
    .wrapper { max-width: 580px; margin: 0 auto; padding: 40px 16px; }
    .card { background: #ffffff; border: 1px solid #e5e5e3; }
    .header { padding: 40px 40px 32px; border-bottom: 1px solid #e5e5e3; }
    .logo { font-size: 13px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #1a1a1a; text-decoration: none; }
    .body { padding: 40px; }
    .label { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
    h1 { font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.2; margin-bottom: 20px; }
    p { font-size: 15px; color: #555; line-height: 1.65; margin-bottom: 16px; }
    .order-box { background: #f9f9f8; border: 1px solid #e5e5e3; padding: 20px 24px; margin: 28px 0; }
    .order-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
    .order-row + .order-row { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e3; }
    .order-label { color: #888; font-weight: 500; }
    .order-value { color: #1a1a1a; font-weight: 600; }
    .support { font-size: 13px; color: #888; line-height: 1.6; }
    .support a { color: #1a1a1a; }
    .footer { padding: 24px 40px; border-top: 1px solid #e5e5e3; background: #f9f9f8; }
    .footer p { font-size: 11px; color: #aaa; line-height: 1.7; margin: 0; }
    .footer a { color: #888; text-decoration: none; }
    @media (max-width: 480px) {
      .header, .body, .footer { padding-left: 24px; padding-right: 24px; }
      h1 { font-size: 22px; }
      .order-row { flex-direction: column; align-items: flex-start; gap: 4px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <div class="header">
        <a href="${siteUrl}" class="logo">AI Digital Products</a>
      </div>

      <div class="body">
        <div class="label">Order Refunded</div>
        <h1>One of your sales was refunded.</h1>
        <p>${greeting} A customer's purchase of one of your products has been refunded. Your payout for this order has been reversed accordingly.</p>

        <div class="order-box">
          <div class="order-row">
            <span class="order-label">Product</span>
            <span class="order-value" style="margin-left:16px; text-align:right;">${productName}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Order total</span>
            <span class="order-value" style="margin-left:16px;">${amount}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Your payout (reversed)</span>
            <span class="order-value" style="margin-left:16px;">${payoutAmount}</span>
          </div>
        </div>

        <p class="support">
          Questions about this refund? Reply to this email or reach us at
          <a href="mailto:support@aidigitalproducts.com">support@aidigitalproducts.com</a>.
        </p>
      </div>

      <div class="footer">
        <p>
          &copy; ${year} AI Digital Products, LLC &nbsp;·&nbsp;
          <a href="${siteUrl}/privacy">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="${siteUrl}/terms">Terms of Service</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildVendorRefundText(data: VendorRefundEmailData): string {
  const { toName, productName, amountCents, currency, vendorPayoutCents, orderId } = data;
  const greeting     = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const amount       = formatCurrency(amountCents, currency);
  const payoutAmount = formatCurrency(vendorPayoutCents, currency);
  const year         = new Date().getFullYear();

  return `
${greeting}

A customer's purchase of one of your products has been refunded. Your payout for this order has been reversed accordingly.

ORDER SUMMARY
─────────────
Product: ${productName}
Order total: ${amount}
Your payout (reversed): ${payoutAmount}
Order ID: ${orderId}

Questions about this refund? Contact support@aidigitalproducts.com.

© ${year} AI Digital Products, LLC
  `.trim();
}

export async function sendVendorRefundNotification(data: VendorRefundEmailData): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.toEmail,
    replyTo: "support@aidigitalproducts.com",
    subject: `Order refunded: ${data.productName}`,
    html: buildVendorRefundHtml(data),
    text: buildVendorRefundText(data),
  });

  if (error) {
    throw new Error(`Resend failed to send vendor refund notification: ${error.message}`);
  }
}

export interface VendorWelcomeEmailData {
  toEmail: string;
  toName?: string;
  setPasswordUrl: string;
}

function buildVendorWelcomeHtml(data: VendorWelcomeEmailData): string {
  const { toName, setPasswordUrl } = data;
  const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year     = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're Approved to Sell</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f5f3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1a1a1a; }
    .wrapper { max-width: 580px; margin: 0 auto; padding: 40px 16px; }
    .card { background: #ffffff; border: 1px solid #e5e5e3; }
    .header { padding: 40px 40px 32px; border-bottom: 1px solid #e5e5e3; }
    .logo { font-size: 13px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #1a1a1a; text-decoration: none; }
    .body { padding: 40px; }
    .label { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
    h1 { font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2; margin-bottom: 20px; }
    p { font-size: 15px; color: #555; line-height: 1.65; margin-bottom: 16px; }
    ol { margin: 0 0 24px 20px; padding: 0; }
    li { font-size: 14px; color: #555; line-height: 1.8; }
    .cta-section { text-align: center; padding: 32px 0; border-top: 1px solid #e5e5e3; border-bottom: 1px solid #e5e5e3; margin: 32px 0; }
    .cta-btn { display: inline-block; background: #1a1a1a; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 16px 36px; }
    .cta-note { font-size: 12px; color: #999; margin-top: 16px; margin-bottom: 0; }
    .support { font-size: 13px; color: #888; line-height: 1.6; }
    .support a { color: #1a1a1a; }
    .footer { padding: 24px 40px; border-top: 1px solid #e5e5e3; background: #f9f9f8; }
    .footer p { font-size: 11px; color: #aaa; line-height: 1.7; margin: 0; }
    .footer a { color: #888; text-decoration: none; }
    @media (max-width: 480px) {
      .header, .body, .footer { padding-left: 24px; padding-right: 24px; }
      h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <a href="${siteUrl}" class="logo">AI Digital Products</a>
      </div>
      <div class="body">
        <div class="label">Application Approved</div>
        <h1>You're approved to sell.</h1>
        <p>${greeting} Great news — your seller application has been approved. Here's how to get set up:</p>
        <ol>
          <li>Click the button below to set your password</li>
          <li>Log in at ${siteUrl}/vendor/login</li>
          <li>Connect a Stripe account so you can actually receive payouts — you'll see a prompt for this right in your dashboard</li>
        </ol>
        <div class="cta-section">
          <a href="${setPasswordUrl}" class="cta-btn">Set Your Password</a>
          <p class="cta-note">This link is unique to you — don't share it.</p>
        </div>
        <p class="support">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@aidigitalproducts.com">support@aidigitalproducts.com</a>.
        </p>
      </div>
      <div class="footer">
        <p>
          &copy; ${year} AI Digital Products, LLC &nbsp;·&nbsp;
          <a href="${siteUrl}/privacy">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="${siteUrl}/terms">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildVendorWelcomeText(data: VendorWelcomeEmailData): string {
  const { toName, setPasswordUrl } = data;
  const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year     = new Date().getFullYear();

  return `
${greeting}

Great news — your seller application has been approved. Here's how to get set up:

1. Set your password: ${setPasswordUrl}
2. Log in at ${siteUrl}/vendor/login
3. Connect a Stripe account so you can receive payouts — you'll see a prompt for this in your dashboard

This link is unique to you — don't share it.

Questions? Contact support@aidigitalproducts.com.

© ${year} AI Digital Products, LLC
  `.trim();
}

export async function sendVendorWelcomeEmail(data: VendorWelcomeEmailData): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.toEmail,
    replyTo: "support@aidigitalproducts.com",
    subject: "You're approved to sell on AI Digital Products",
    html: buildVendorWelcomeHtml(data),
    text: buildVendorWelcomeText(data),
  });

  if (error) {
    throw new Error(`Resend failed to send vendor welcome email: ${error.message}`);
  }
}

export interface ApplicationRejectionEmailData {
  toEmail: string;
  toName?: string;
  reason: string;
}

function buildApplicationRejectionHtml(data: ApplicationRejectionEmailData): string {
  const { toName, reason } = data;
  const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year     = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Update on Your Seller Application</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f5f3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1a1a1a; }
    .wrapper { max-width: 580px; margin: 0 auto; padding: 40px 16px; }
    .card { background: #ffffff; border: 1px solid #e5e5e3; }
    .header { padding: 40px 40px 32px; border-bottom: 1px solid #e5e5e3; }
    .logo { font-size: 13px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #1a1a1a; text-decoration: none; }
    .body { padding: 40px; }
    .label { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
    h1 { font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.25; margin-bottom: 20px; }
    p { font-size: 15px; color: #555; line-height: 1.65; margin-bottom: 16px; }
    .reason-box { background: #f9f9f8; border: 1px solid #e5e5e3; border-left: 3px solid #c0392b; padding: 18px 20px; margin: 24px 0; }
    .reason-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .reason-text { font-size: 14px; color: #333; line-height: 1.6; margin: 0; }
    .cta-section { text-align: center; padding: 28px 0; border-top: 1px solid #e5e5e3; margin-top: 8px; }
    .cta-btn { display: inline-block; background: #1a1a1a; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 16px 36px; }
    .support { font-size: 13px; color: #888; line-height: 1.6; }
    .support a { color: #1a1a1a; }
    .footer { padding: 24px 40px; border-top: 1px solid #e5e5e3; background: #f9f9f8; }
    .footer p { font-size: 11px; color: #aaa; line-height: 1.7; margin: 0; }
    .footer a { color: #888; text-decoration: none; }
    @media (max-width: 480px) {
      .header, .body, .footer { padding-left: 24px; padding-right: 24px; }
      h1 { font-size: 21px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <a href="${siteUrl}" class="logo">AI Digital Products</a>
      </div>
      <div class="body">
        <div class="label">Application Update</div>
        <h1>We're not able to approve your seller application right now.</h1>
        <p>${greeting} Thanks for your interest in selling on AI Digital Products. After review, we can't move forward with your application at this time.</p>
        <div class="reason-box">
          <div class="reason-label">Reason</div>
          <p class="reason-text">${reason}</p>
        </div>
        <p>If you're able to address this, you're welcome to reapply — we review every new submission.</p>
        <div class="cta-section">
          <a href="${siteUrl}/sell/waitlist" class="cta-btn">Reapply</a>
        </div>
        <p class="support">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@aidigitalproducts.com">support@aidigitalproducts.com</a>.
        </p>
      </div>
      <div class="footer">
        <p>
          &copy; ${year} AI Digital Products, LLC &nbsp;·&nbsp;
          <a href="${siteUrl}/privacy">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="${siteUrl}/terms">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildApplicationRejectionText(data: ApplicationRejectionEmailData): string {
  const { toName, reason } = data;
  const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year     = new Date().getFullYear();

  return `
${greeting}

Thanks for your interest in selling on AI Digital Products. After review, we can't move forward with your application at this time.

Reason: ${reason}

If you're able to address this, you're welcome to reapply: ${siteUrl}/sell/waitlist

Questions? Contact support@aidigitalproducts.com.

© ${year} AI Digital Products, LLC
  `.trim();
}

export async function sendApplicationRejectionEmail(data: ApplicationRejectionEmailData): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.toEmail,
    replyTo: "support@aidigitalproducts.com",
    subject: "Update on your seller application",
    html: buildApplicationRejectionHtml(data),
    text: buildApplicationRejectionText(data),
  });

  if (error) {
    throw new Error(`Resend failed to send application rejection email: ${error.message}`);
  }
}
'@
Set-Content -LiteralPath "src\lib\email.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\lib\email.ts" -ForegroundColor Green

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendApplicationRejectionEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const { data: application } = await supabaseAdmin
    .from("seller_waitlist")
    .select("email, name, status")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (application.status === "approved") {
    return NextResponse.json({ error: "This application was already approved" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("seller_waitlist")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await sendApplicationRejectionEmail({
      toEmail: application.email as string,
      toName: (application.name as string | null) ?? undefined,
      reason,
    });
  } catch (err) {
    console.error("[seller-applications/reject] Failed to send rejection email", err);
    return NextResponse.json({
      ok: true,
      warning: "Application rejected, but the notification email failed to send.",
    });
  }

  return NextResponse.json({ ok: true });
}
'@
Set-Content -LiteralPath "src\app\api\admin\seller-applications\[id]\reject\route.ts" -Value $content -NoNewline
Write-Host "REPLACED: src\app\api\admin\seller-applications\[id]\reject\route.ts" -ForegroundColor Green

$content = @'
"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";

interface Application {
  id: string;
  email: string;
  name: string | null;
  business_name: string | null;
  product_types: string[] | null;
  message: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

function SellerApplicationsContent() {
  const { token } = useAdmin();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/seller-applications", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setApplications(d.applications ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleApprove(app: Application) {
    const confirmed = window.confirm(
      `Approve ${app.name ?? app.email}? This creates a real vendor account and emails them a link to set their password.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/approve`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      }
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  function startReject(app: Application) {
    setRejectingId(app.id);
    setRejectReason("");
    setError("");
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectReason("");
  }

  async function submitReject(app: Application) {
    if (!rejectReason.trim()) {
      setError("A rejection reason is required — it's sent directly to the applicant.");
      return;
    }

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/reject`, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      if (data.warning) {
        setNotice(data.warning);
      } else {
        setNotice(`Rejection sent to ${app.email}.`);
      }
      setRejectingId(null);
      setRejectReason("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleResend(app: Application) {
    const confirmed = window.confirm(
      `Send a fresh set-password link to ${app.name ?? app.email}? This replaces any earlier link they may have.`
    );
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/resend-welcome`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resend");
      if (data.warning) {
        setNotice(`${data.warning} ${data.setPasswordUrl}`);
      } else {
        setNotice(`Sent a fresh link to ${app.email}.`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${applications.length} application${applications.length !== 1 ? "s" : ""}`}
      </div>

      {notice && (
        <p style={{ fontSize: "13px", color: "#166534", marginBottom: "16px", wordBreak: "break-all" }}>{notice}</p>
      )}
      {error && <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!loading && applications.length === 0 && (
          <p style={{ fontSize: "14px", color: "var(--ink-faded)" }}>No applications yet.</p>
        )}
        {applications.map((app) => (
          <div key={app.id} style={{ border: "1px solid var(--line)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>
                  {app.name ?? "(no name given)"} {app.business_name && <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>· {app.business_name}</span>}
                </div>
                <div style={{ fontSize: "13px", color: "var(--ink-faded)" }}>{app.email}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)", marginTop: "4px" }}>
                  Applied {new Date(app.created_at).toLocaleString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "4px 10px",
                  color: app.status === "approved" ? "#166534" : app.status === "rejected" ? "#c0392b" : "#8a6d1a",
                  background: app.status === "approved" ? "#eaf6ec" : app.status === "rejected" ? "#fdecea" : "#fff8e1",
                }}
              >
                {app.status}
              </span>
            </div>

            {app.product_types && app.product_types.length > 0 && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "8px" }}>
                <strong style={{ color: "var(--ink)" }}>Sells:</strong> {app.product_types.join(", ")}
              </div>
            )}
            {app.message && (
              <div style={{ fontSize: "13px", color: "var(--ink-faded)", marginBottom: "12px" }}>
                <strong style={{ color: "var(--ink)" }}>Message:</strong> {app.message}
              </div>
            )}
            {app.status === "rejected" && app.rejection_reason && (
              <div style={{ fontSize: "13px", color: "#c0392b", marginBottom: "12px", background: "#fdecea", padding: "10px 14px" }}>
                <strong>Rejection reason sent:</strong> {app.rejection_reason}
              </div>
            )}

            {app.status === "pending" && rejectingId !== app.id && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleApprove(app)}
                  disabled={actingId === app.id}
                  className="btn btn-primary btn-sm"
                >
                  {actingId === app.id ? "Working…" : "Approve"}
                </button>
                <button
                  onClick={() => startReject(app)}
                  disabled={actingId === app.id}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#c0392b" }}
                >
                  Reject
                </button>
              </div>
            )}

            {app.status === "pending" && rejectingId === app.id && (
              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Rejection reason — this is emailed directly to the applicant
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. We're not currently accepting products in this category, or your samples didn't meet our quality guidelines. Be specific about what they'd need to change to reapply successfully."
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit",
                    border: "1px solid var(--ink-mute)", background: "var(--bg)", color: "var(--ink)",
                    resize: "vertical", boxSizing: "border-box", marginBottom: "10px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => submitReject(app)}
                    disabled={actingId === app.id}
                    className="btn btn-primary btn-sm"
                    style={{ background: "#c0392b", borderColor: "#c0392b" }}
                  >
                    {actingId === app.id ? "Sending…" : "Send Rejection"}
                  </button>
                  <button onClick={cancelReject} disabled={actingId === app.id} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {app.status === "approved" && (
              <button
                onClick={() => handleResend(app)}
                disabled={actingId === app.id}
                className="btn btn-ghost btn-sm"
              >
                {actingId === app.id ? "Sending…" : "Resend Welcome Email"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellerApplicationsPage() {
  return (
    <AdminShell title="Seller Applications">
      <SellerApplicationsContent />
    </AdminShell>
  );
}
'@
Set-Content -LiteralPath "src\app\admin\seller-applications\page.tsx" -Value $content -NoNewline
Write-Host "REPLACED: src\app\admin\seller-applications\page.tsx" -ForegroundColor Green

Write-Host "`nAll 3 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan