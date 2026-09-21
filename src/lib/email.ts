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
  orderNumber?: string;
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

        ${data.orderNumber ? `<p style="font-size:13px; color:#555; text-align:center; margin-bottom:8px;">Order number: <strong>${data.orderNumber}</strong> &nbsp;&middot;&nbsp; <a href="${siteUrl}/support/order?order=${data.orderNumber}" style="color:#1a1a1a;">Need help with this order?</a></p>` : ""}
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
${data.orderNumber ? `ORDER NUMBER: ${data.orderNumber}\nNeed help with this order? ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com"}/support/order?order=${data.orderNumber}\n` : ""}
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

export interface ReviewRequestEmailData {
  toEmail: string;
  toName?: string;
  productName: string;
  reviewUrl: string;
}

function buildReviewRequestHtml(data: ReviewRequestEmailData): string {
  const { toName, productName, reviewUrl } = data;
  const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year     = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>How was your purchase?</title>
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
    .cta-section { text-align: center; padding: 28px 0; border-top: 1px solid #e5e5e3; border-bottom: 1px solid #e5e5e3; margin: 28px 0; }
    .cta-btn { display: inline-block; background: #1a1a1a; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 16px 36px; }
    .cta-note { font-size: 12px; color: #999; margin-top: 16px; margin-bottom: 0; }
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
        <div class="label">Quick Question</div>
        <h1>How was ${productName}?</h1>
        <p>${greeting} you picked up ${productName} a few days ago — we'd love to hear what you thought. It only takes a minute, and it genuinely helps other buyers (and the seller) know what's working.</p>
        <div class="cta-section">
          <a href="${reviewUrl}" class="cta-btn">Leave a Quick Review</a>
          <p class="cta-note">This link is unique to your order.</p>
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

function buildReviewRequestText(data: ReviewRequestEmailData): string {
  const { toName, productName, reviewUrl } = data;
  const greeting = toName ? `Hi ${toName.split(" ")[0]},` : "Hi there,";
  const year     = new Date().getFullYear();

  return `
${greeting}

You picked up ${productName} a few days ago — we'd love to hear what you thought. It only takes a minute, and it genuinely helps other buyers (and the seller) know what's working.

Leave a quick review: ${reviewUrl}

This link is unique to your order.

Questions? Contact support@aidigitalproducts.com.

© ${year} AI Digital Products, LLC
  `.trim();
}

export async function sendReviewRequestEmail(data: ReviewRequestEmailData): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.toEmail,
    replyTo: "support@aidigitalproducts.com",
    subject: `How was ${data.productName}?`,
    html: buildReviewRequestHtml(data),
    text: buildReviewRequestText(data),
  });

  if (error) {
    throw new Error(`Resend failed to send review request email: ${error.message}`);
  }
}


// ---------------------------------------------------------------------------
// Review moderation notifications (admin hid/unhid a review, removed a reply)
// ---------------------------------------------------------------------------

export type ReviewModerationAction = "hidden" | "unhidden" | "reply_removed";

export interface ReviewModerationEmailData {
  toEmail: string;
  toName?: string;
  action: ReviewModerationAction;
  productName: string;
  rating: number;
  commentExcerpt?: string | null;
  reason?: string | null;
  reviewsUrl: string;
}

function escapeReviewEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function moderationCopy(action: ReviewModerationAction, productName: string) {
  if (action === "hidden") {
    return {
      label: "Review Hidden",
      heading: "A review on your product was hidden.",
      intro: `A review on ${productName} has been hidden by our team. It is no longer visible to the public and no longer counts toward the product's rating. You can still see it, greyed out, on your Reviews page.`,
      showReason: true,
      subject: `A review on ${productName} was hidden`,
    };
  }
  if (action === "unhidden") {
    return {
      label: "Review Restored",
      heading: "A hidden review was restored.",
      intro: `A review on ${productName} that was previously hidden is public again and counts toward the product's rating. You can reply to it from your Reviews page.`,
      showReason: false,
      subject: `A review on ${productName} was restored`,
    };
  }
  return {
    label: "Reply Removed",
    heading: "One of your review replies was removed.",
    intro: `Our team removed your reply to a review on ${productName}. The review and its rating are unchanged, and you are welcome to write a new reply.`,
    showReason: true,
    subject: `Your reply on ${productName} was removed`,
  };
}

function buildReviewModerationHtml(data: ReviewModerationEmailData): string {
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year     = new Date().getFullYear();
  const copy     = moderationCopy(data.action, escapeReviewEmailHtml(data.productName));
  const greeting = data.toName ? `Hi ${escapeReviewEmailHtml(data.toName.split(" ")[0])},` : "Hi there,";
  const rating   = Math.max(0, Math.min(5, Math.round(data.rating)));
  const stars    = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
  const excerpt  = data.commentExcerpt
    ? `<p style="font-size:14px; color:#333; line-height:1.6; margin:8px 0 0;">${escapeReviewEmailHtml(data.commentExcerpt)}</p>`
    : "";
  const reasonBlock =
    copy.showReason && data.reason
      ? `<div class="reason-box"><div class="reason-label">Reason from our team</div><p class="reason-text">${escapeReviewEmailHtml(data.reason)}</p></div>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${copy.label}</title>
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
    .review-box { background: #f9f9f8; border: 1px solid #e5e5e3; padding: 18px 20px; margin: 24px 0; }
    .review-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .stars { font-size: 16px; color: #c7a24c; letter-spacing: 2px; }
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
        <div class="label">${copy.label}</div>
        <h1>${copy.heading}</h1>
        <p>${greeting} ${copy.intro}</p>
        <div class="review-box">
          <div class="review-label">The review</div>
          <div class="stars">${stars}</div>
          ${excerpt}
        </div>
        ${reasonBlock}
        <div class="cta-section">
          <a href="${data.reviewsUrl}" class="cta-btn">View Your Reviews</a>
        </div>
        <p class="support">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@aidigitalproducts.com">support@aidigitalproducts.com</a>.
        </p>
      </div>
      <div class="footer">
        <p>
          &copy; ${year} AI Digital Products, LLC &nbsp;&middot;&nbsp;
          <a href="${siteUrl}/privacy">Privacy Policy</a> &nbsp;&middot;&nbsp;
          <a href="${siteUrl}/terms">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildReviewModerationText(data: ReviewModerationEmailData): string {
  const year     = new Date().getFullYear();
  const copy     = moderationCopy(data.action, data.productName);
  const greeting = data.toName ? `Hi ${data.toName.split(" ")[0]},` : "Hi there,";
  const rating   = Math.max(0, Math.min(5, Math.round(data.rating)));
  const reasonLine = copy.showReason && data.reason ? `\nReason from our team: ${data.reason}\n` : "";
  const excerptLine = data.commentExcerpt ? `\nComment: ${data.commentExcerpt}` : "";

  return `
${greeting}

${copy.intro}

Review rating: ${rating}/5${excerptLine}
${reasonLine}
View your reviews: ${data.reviewsUrl}

Questions? Contact support@aidigitalproducts.com.

(c) ${year} AI Digital Products, LLC
  `.trim();
}

export async function sendReviewModerationEmail(data: ReviewModerationEmailData): Promise<void> {
  const copy = moderationCopy(data.action, data.productName);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.toEmail,
    replyTo: "support@aidigitalproducts.com",
    subject: copy.subject,
    html: buildReviewModerationHtml(data),
    text: buildReviewModerationText(data),
  });

  if (error) {
    throw new Error(`Resend failed to send review moderation email: ${error.message}`);
  }
}


// ---------------------------------------------------------------------------
// Admin alert for Stripe disputes (chargebacks)
// ---------------------------------------------------------------------------

export interface AdminDisputeAlertData {
  kind: "opened" | "won" | "lost";
  orderNumber?: string | null;
  amountCents: number;
  currency: string;
  reason?: string | null;
  evidenceDueBy?: number | null; // unix seconds
  disputeId: string;
}

function escapeDisputeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendAdminDisputeAlert(data: AdminDisputeAlertData): Promise<void> {
  const to = process.env.ADMIN_ALERT_EMAIL ?? "support@aidigitalproducts.com";
  const amount = formatCurrency(data.amountCents, data.currency);
  const link = `https://dashboard.stripe.com/disputes/${data.disputeId}`;
  const due = data.evidenceDueBy
    ? new Date(data.evidenceDueBy * 1000).toUTCString()
    : "not provided";

  const headline =
    data.kind === "opened"
      ? "A customer opened a dispute"
      : data.kind === "won"
      ? "You won a dispute"
      : "You lost a dispute";

  const note =
    data.kind === "opened"
      ? `Evidence is due by: ${due}. Respond in the Stripe dashboard before then.`
      : data.kind === "won"
      ? "No further action needed. The order counts normally again."
      : "The disputed amount and any dispute fee are debited from the platform. The vendor payout is NOT reversed automatically - decide manually. The order is now marked as a chargeback and excluded from vendor totals.";

  const lines = [
    `Amount: ${amount}`,
    data.orderNumber ? `Order: ${data.orderNumber}` : null,
    data.reason ? `Reason: ${data.reason}` : null,
    note,
    `Stripe: ${link}`,
  ].filter(Boolean) as string[];

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;max-width:560px">
<h2 style="font-size:18px;margin:0 0 12px">${escapeDisputeHtml(headline)}</h2>
${lines.map((l) => `<p style="margin:0 0 8px">${escapeDisputeHtml(l)}</p>`).join("")}
</div>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `[Dispute ${data.kind}] ${amount} - AI Digital Products`,
    html,
    text: `${headline}\n\n${lines.join("\n")}`,
  });

  if (error) {
    throw new Error(`Resend failed to send admin dispute alert: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Support request emails (buyer, seller and admin notifications)
// ---------------------------------------------------------------------------

export interface SupportEmailData {
  toEmail: string;
  subject: string;
  label: string;
  heading: string;
  paragraphs: string[];
  quote?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
}

function escapeSupportHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendSupportNotification(data: SupportEmailData): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";
  const year = new Date().getFullYear();
  const paras = data.paragraphs.map((p) => `<p>${escapeSupportHtml(p)}</p>`).join("");
  const quote = data.quote
    ? `<div class="quote-box"><p class="quote-text">${escapeSupportHtml(data.quote).replace(/\n/g, "<br />")}</p></div>`
    : "";
  const cta =
    data.ctaUrl && data.ctaLabel
      ? `<div class="cta-section"><a href="${escapeSupportHtml(data.ctaUrl)}" class="cta-btn">${escapeSupportHtml(data.ctaLabel)}</a></div>`
      : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeSupportHtml(data.label)}</title>
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
    .quote-box { background: #f9f9f8; border: 1px solid #e5e5e3; border-left: 3px solid #1a1a1a; padding: 18px 20px; margin: 24px 0; }
    .quote-text { font-size: 14px; color: #333; line-height: 1.6; margin: 0; }
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
        <div class="label">${escapeSupportHtml(data.label)}</div>
        <h1>${escapeSupportHtml(data.heading)}</h1>
        ${paras}
        ${quote}
        ${cta}
        <p class="support">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@aidigitalproducts.com">support@aidigitalproducts.com</a>.
        </p>
      </div>
      <div class="footer">
        <p>
          &copy; ${year} AI Digital Products, LLC &nbsp;&middot;&nbsp;
          <a href="${siteUrl}/privacy">Privacy Policy</a> &nbsp;&middot;&nbsp;
          <a href="${siteUrl}/terms">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = [
    data.heading,
    "",
    ...data.paragraphs,
    data.quote ? `\n"${data.quote}"\n` : "",
    data.ctaUrl ? `${data.ctaLabel ?? "Open"}: ${data.ctaUrl}` : "",
    "",
    "Questions? Contact support@aidigitalproducts.com.",
    "",
    `(c) ${year} AI Digital Products, LLC`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.toEmail,
    replyTo: "support@aidigitalproducts.com",
    subject: data.subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend failed to send support email: ${error.message}`);
  }
}
