import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface OrderEmailData {
  toEmail: string;
  toName?: string;
  productName: string;
  amountCents: number;
  currency: string;
  downloadUrl?: string;                                        // legacy single-file fallback
  downloadFiles?: { file_name: string; url: string }[];      // multi-file (new)
  orderId: string;
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

 return `
${greeting}

Thank you so much for your purchase — it truly means a lot. We put a lot of care into everything we create, and we hope this gives you exactly what you need.

Your order is confirmed and your download is ready below.

ORDER SUMMARY
─────────────
Product: ${productName}
Amount:  ${amount}

YOUR DOWNLOAD LINKS
───────────────────
${linksText}

You have 15 downloads available per file. Links expire in 7 days.

Questions? Reply to this email or contact support@aidigitalproducts.com.

© ${year} AI Digital Products, LLC
  `.trim();
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const { toEmail, productName } = data;

  await transporter.sendMail({
    from: `"AI Digital Products" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your order is ready: ${productName}`,
    html: buildOrderConfirmationHtml(data),
    text: buildOrderConfirmationText(data),
  });
}