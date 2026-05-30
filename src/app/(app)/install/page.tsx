import Link from "next/link";

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex items-center justify-between px-4 pt-[54px] h-[98px] border-b border-hairline">
        <Link
          href="/profile"
          className="w-10 h-10 flex items-center justify-center text-charcoal"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">Install on iPhone</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-5 py-6 space-y-6 pb-32">
        <p className="text-[14px] leading-[1.55] text-charcoal">
          Adorned works best as a home-screen app. It opens full-screen, behaves
          like a native app, and stays signed in.
        </p>

        <section className="p-4 bg-surface border border-hairline rounded-lg">
          <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-1.5">
            Before you start
          </p>
          <p className="text-[13px] text-charcoal">
            You must open this site in <strong>Safari</strong> — Chrome and other
            browsers on iOS can&apos;t add web apps to the home screen.
          </p>
        </section>

        <ol className="space-y-4">
          <Step
            n={1}
            title="Open Adorned in Safari"
            body="If you got here from an email link in another app, copy the URL and paste it into Safari."
          />
          <Step
            n={2}
            title="Tap the Share button"
            body="The square icon with an arrow pointing up, in the bottom toolbar of Safari."
            iconLabel="Share"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v13M8 7l4-4 4 4" />
                <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
              </svg>
            }
          />
          <Step
            n={3}
            title="Scroll down · tap 'Add to Home Screen'"
            body="It may be a few rows down in the share sheet."
            iconLabel="Add"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            }
          />
          <Step
            n={4}
            title="Tap 'Add' in the top-right"
            body="The Adorned icon will appear on your home screen — open it from there next time."
          />
        </ol>

        <section className="p-4 bg-surface-alt border border-hairline rounded-lg">
          <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2">
            Magic-link tip
          </p>
          <p className="text-[13px] leading-[1.55] text-charcoal">
            When signing in from the app, the magic link will open in Safari (not
            in-app). After signing in, you&apos;ll see a &ldquo;Return to Adorned&rdquo;
            prompt — tap it to come back to the home-screen app.
          </p>
        </section>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  icon,
  iconLabel,
}: {
  n: number;
  title: string;
  body: string;
  icon?: React.ReactNode;
  iconLabel?: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="w-7 h-7 shrink-0 rounded-full bg-charcoal text-canvas text-[13px] font-semibold flex items-center justify-center">
        {n}
      </span>
      <div className="flex-1 pt-0.5">
        <p className="text-[14px] font-medium text-charcoal">{title}</p>
        <p className="text-[13px] text-mid mt-1 leading-[1.5]">{body}</p>
        {icon && (
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1.5 rounded border border-hairline bg-surface text-charcoal">
            {icon}
            {iconLabel && <span className="text-[12px]">{iconLabel}</span>}
          </div>
        )}
      </div>
    </li>
  );
}
