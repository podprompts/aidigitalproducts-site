export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const RESPONSE_WINDOW_MS = 48 * 60 * 60 * 1000;
export const MAX_MESSAGE = 2000;

// Sent to the creator first.
export const GENERAL_REASONS: Record<string, string> = {
  file_problem: "Download or file problem",
  missing_files: "Missing files",
  other: "Something else",
};

// The policy's escalation criteria: these go to our team right away.
export const ESCALATION_REASONS: Record<string, string> = {
  not_as_described: "Materially different from its description",
  defective: "Materially defective",
  fraud: "Suspected fraud or deception",
  ignored: "The creator has repeatedly ignored my messages",
};

export const REASON_LABELS: Record<string, string> = {
  ...GENERAL_REASONS,
  ...ESCALATION_REASONS,
  no_response: "No response from the creator within 48 hours",
  no_vendor: "Platform-sold product (no creator)",
};

export function hasKey(obj: Record<string, string>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export interface RequestTiming {
  status: string;
  first_response_at: string | null;
  created_at: string;
}

// Overdue = still open, no creator response, and past the 48-hour window.
export function isOverdue(r: RequestTiming): boolean {
  return (
    r.status === "open" &&
    !r.first_response_at &&
    Date.now() - new Date(r.created_at).getTime() > RESPONSE_WINDOW_MS
  );
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "the buyer";
}