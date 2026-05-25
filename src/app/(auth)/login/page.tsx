"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-light tracking-widest text-charcoal uppercase">
            Adorned
          </h1>
          <p className="text-sm text-mid">Your wardrobe, curated.</p>
        </div>

        {sent ? (
          <div className="space-y-3 text-center">
            <p className="text-charcoal font-medium">Check your email</p>
            <p className="text-sm text-mid">
              We sent a magic link to{" "}
              <span className="text-charcoal">{email}</span>. Tap it to sign in.
            </p>
            <p className="text-xs text-mid mt-4">
              On iOS, open the link in Safari — then tap{" "}
              <strong>Return to Adorned</strong> on the next screen to open the
              app.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-widest text-mid"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-hairline bg-canvas px-4 py-3 text-charcoal placeholder-mid focus:border-charcoal focus:outline-none transition-colors"
                placeholder="becca@example.com"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-charcoal text-canvas py-3 text-sm uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
