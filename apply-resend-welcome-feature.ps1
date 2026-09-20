# Adds a Resend Welcome Email action for already-approved vendors whose
# original link may be broken/expired from earlier bugs now fixed.
# Run from the root of your aidigitalproducts-site repo.

New-Item -ItemType Directory -Force -Path "src\app\api\admin\seller-applications\[id]\resend-welcome" | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendVendorWelcomeEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthed(req))) return unauthorized();
  const { id } = await params;

  const { data: application, error: fetchError } = await supabaseAdmin
    .from("seller_waitlist")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "approved" || !application.vendor_id) {
    return NextResponse.json(
      { error: "This application hasn't been approved yet — nothing to resend" },
      { status: 400 }
    );
  }

  const email = application.email as string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aidigitalproducts.com";

  // A fresh link — the original one may have already been used, expired,
  // or (for anyone approved before the localhost/race-condition fixes)
  // never actually worked in the first place.
  const { data: linkResult, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/vendor/set-password` },
  });

  if (linkError || !linkResult?.properties?.action_link) {
    return NextResponse.json(
      { error: `Failed to generate a new link: ${linkError?.message ?? "Unknown error"}` },
      { status: 502 }
    );
  }

  try {
    await sendVendorWelcomeEmail({
      toEmail: email,
      toName: (application.name as string | null) ?? undefined,
      setPasswordUrl: linkResult.properties.action_link,
    });
  } catch (err) {
    console.error("[seller-applications/resend-welcome] Failed to send email", err);
    return NextResponse.json({
      ok: true,
      warning: "Link generated, but the email failed to send. Share this link with them manually:",
      setPasswordUrl: linkResult.properties.action_link,
    });
  }

  return NextResponse.json({ ok: true });
}
'@
Set-Content -LiteralPath "src\app\api\admin\seller-applications\[id]\resend-welcome\route.ts" -Value $content -NoNewline
Write-Host "NEW: src\app\api\admin\seller-applications\[id]\resend-welcome\route.ts" -ForegroundColor Green

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
  created_at: string;
}

function SellerApplicationsContent() {
  const { token } = useAdmin();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
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

  async function handleReject(app: Application) {
    const confirmed = window.confirm(`Reject ${app.name ?? app.email}? No account will be created.`);
    if (!confirmed) return;

    setActingId(app.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/seller-applications/${app.id}/reject`, {
        method: "POST",
        headers: adminHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
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

            {app.status === "pending" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleApprove(app)}
                  disabled={actingId === app.id}
                  className="btn btn-primary btn-sm"
                >
                  {actingId === app.id ? "Working…" : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(app)}
                  disabled={actingId === app.id}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#c0392b" }}
                >
                  Reject
                </button>
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

Write-Host "`nAll 2 files written." -ForegroundColor Cyan
Write-Host "Now run: npx tsc --noEmit" -ForegroundColor Cyan