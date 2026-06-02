import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { PaletteSwatch } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "palette_swatches, style_description, style_summary, body_photo_url, onboarded_at"
    )
    .eq("id", user.id)
    .single();

  const swatches = (profile?.palette_swatches ?? []) as PaletteSwatch[];

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <header className="px-5 pt-[54px] pb-3">
        <h1 className="text-[30px] font-semibold tracking-[-0.7px] leading-none">
          Profile
        </h1>
        <p className="text-[13px] text-mid mt-2">{user.email}</p>
      </header>

      <div className="flex-1 px-5 py-3 space-y-3">
        <Section title="Palette" editHref="/onboarding/palette">
          {swatches.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {swatches.slice(0, 12).map((s, i) => (
                <span
                  key={`${s.hex}-${i}`}
                  className="w-5 h-5 rounded-full"
                  style={{
                    background: s.hex,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                  }}
                  title={s.name}
                />
              ))}
              {swatches.length > 12 && (
                <span className="text-[11px] text-mid font-mono tabular-nums self-center">
                  +{swatches.length - 12}
                </span>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-mid">Not set yet.</p>
          )}
        </Section>

        <Section title="Style" editHref="/onboarding/style">
          {profile?.style_summary ? (
            <p className="text-[13px] leading-[1.55] text-charcoal whitespace-pre-line">
              {profile.style_summary}
            </p>
          ) : (
            <p className="text-[13px] text-mid">Not set yet.</p>
          )}
        </Section>

        <Section title="Body reference" editHref="/onboarding/body">
          {profile?.body_photo_url ? (
            <div className="relative w-[120px] aspect-[3/4] bg-surface-alt rounded overflow-hidden">
              <Image
                src={profile.body_photo_url}
                alt="Body reference"
                fill
                className="object-contain"
                sizes="120px"
              />
            </div>
          ) : (
            <p className="text-[13px] text-mid">No photo yet.</p>
          )}
        </Section>

        <div className="pt-6 space-y-3">
          <Link
            href="/install"
            className="block text-[13px] text-charcoal underline underline-offset-2"
          >
            Install Adorned on your iPhone
          </Link>
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/login");
            }}
          >
            <button
              type="submit"
              className="text-[13px] text-mid underline underline-offset-2"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-surface border border-hairline rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
          {title}
        </span>
        <Link
          href={editHref}
          className="text-[12px] text-charcoal underline underline-offset-2"
        >
          Edit
        </Link>
      </div>
      {children}
    </div>
  );
}
