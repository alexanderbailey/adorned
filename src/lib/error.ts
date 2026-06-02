// Pulls a human-readable string out of a response body, regardless of shape.
// Handles:
//   - Plain text body                 -> the body
//   - { error: "msg" }                -> "msg"
//   - { error: { message: "msg" } }   -> "msg"  (Google APIs / Vercel infra)
//   - { message: "msg" }              -> "msg"
//   - Anything else                   -> empty string (caller picks fallback)

export function extractErrorMessage(body: string | null | undefined): string {
  if (!body) return "";
  const trimmed = body.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    // Not JSON — return as-is (e.g. plain text from a gateway).
    return trimmed;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      if (typeof p.error === "string") return p.error;
      if (p.error && typeof p.error === "object") {
        const e = p.error as Record<string, unknown>;
        if (typeof e.message === "string") return e.message;
      }
      if (typeof p.message === "string") return p.message;
    }
  } catch {
    // Not parseable JSON — fall through.
  }
  return trimmed;
}
