import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/wardrobe";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // iOS PWA deep-link helper page
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth failed — forward Supabase's error details to /login so it can show a useful message.
  const errorCode = searchParams.get("error_code") || searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const params = new URLSearchParams();
  params.set("error", errorCode || "auth-callback-failed");
  if (errorDescription) params.set("error_description", errorDescription);
  return NextResponse.redirect(`${origin}/login?${params.toString()}`);
}
