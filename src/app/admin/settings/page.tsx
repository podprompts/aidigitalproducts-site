"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import { useAdmin, adminHeaders } from "../AdminContext";
import AvatarUploader from "@/components/AvatarUploader";

function SettingsContent() {
  const { token } = useAdmin();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/me", { headers: adminHeaders(token) })
      .then((r) => r.json())
      .then((d) => setAvatarUrl(d.avatar_url ?? null))
      .catch(() => setAvatarUrl(null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p style={{ color: "var(--ink-faded)", fontSize: "14px" }}>Loading…</p>;

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>
        Profile Picture
      </div>
      <AvatarUploader currentAvatarUrl={avatarUrl} role="admin" onUploaded={setAvatarUrl} extraHeaders={adminHeaders(token)} />
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Settings">
      <SettingsContent />
    </AdminShell>
  );
}
