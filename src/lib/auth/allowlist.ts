// Reads ALLOWED_EMAILS from env (comma-separated). If unset, all authenticated
// users are allowed. Use this on routes that cost real money (Claude API).

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw || raw.trim() === "") return true; // no allowlist configured
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
