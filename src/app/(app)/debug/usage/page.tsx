import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { Icon } from "@/components/Icon";

interface UsageRow {
  id: string;
  user_id: string | null;
  created_at: string;
  provider: string;
  model: string;
  operation: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cached_input_tokens: number | null;
  input_bytes: number | null;
  output_bytes: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  status: "success" | "error";
  error_message: string | null;
  metadata: Record<string, unknown>;
}

const LIMIT = 100;

export default async function DebugUsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isEmailAllowed(user.email)) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-[14px] text-mid">Not authorised.</p>
        <Link href="/profile" className="text-[13px] text-charcoal underline underline-offset-2">
          Back to profile
        </Link>
      </div>
    );
  }

  // Use admin client so we see usage across all users (the developer's view).
  const admin = createAdminClient();
  const [{ data: rowsRaw }, { data: usersList }] = await Promise.all([
    admin
      .from("ai_usage")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    // Build a uid -> email map so the table shows who actually called.
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);
  const rows = (rowsRaw ?? []) as UsageRow[];
  const emailById = new Map<string, string>();
  for (const u of usersList?.users ?? []) {
    if (u.id && u.email) emailById.set(u.id, u.email);
  }

  // Aggregates over the loaded window.
  const totalCost = rows.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.length - successCount;

  const byOp = new Map<string, { count: number; cost: number }>();
  for (const r of rows) {
    const cur = byOp.get(r.operation) ?? { count: 0, cost: 0 };
    cur.count += 1;
    cur.cost += r.cost_usd ?? 0;
    byOp.set(r.operation, cur);
  }
  const opSummary = Array.from(byOp, ([operation, v]) => ({ operation, ...v })).sort(
    (a, b) => b.cost - a.cost
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex items-center justify-between px-4 pt-[54px] h-[88px] border-b border-hairline">
        <Link
          href="/profile"
          className="w-10 h-10 flex items-center justify-center text-charcoal"
        >
          <Icon name="close" size={22} />
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">AI usage</span>
        <div className="w-10" />
      </div>

      <div className="px-5 py-5 space-y-5 pb-20">
        {/* Totals */}
        <section className="grid grid-cols-3 gap-2">
          <Stat label="Calls" value={rows.length.toString()} />
          <Stat label="Cost (est)" value={`$${totalCost.toFixed(3)}`} />
          <Stat
            label="Status"
            value={`${successCount} ok · ${errorCount} err`}
          />
        </section>

        {/* By operation */}
        <section className="space-y-2">
          <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
            By operation (last {LIMIT})
          </p>
          <div className="border border-hairline rounded-lg overflow-hidden">
            {opSummary.length === 0 ? (
              <p className="px-3 py-2.5 text-[13px] text-mid">No usage yet.</p>
            ) : (
              opSummary.map((o) => (
                <div
                  key={o.operation}
                  className="flex items-center justify-between px-3 py-2 border-b border-hairline last:border-b-0"
                >
                  <span className="text-[13px] text-charcoal font-mono">{o.operation}</span>
                  <span className="text-[12px] text-mid font-mono tabular-nums">
                    {o.count}× · ${o.cost.toFixed(3)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent calls */}
        <section className="space-y-2">
          <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
            Recent calls (newest first)
          </p>
          {rows.length === 0 ? (
            <p className="text-[13px] text-mid">No calls logged yet.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <UsageCard
                  key={r.id}
                  row={r}
                  email={r.user_id ? emailById.get(r.user_id) : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-surface border border-hairline rounded-lg">
      <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
        {label}
      </p>
      <p className="text-[15px] font-medium text-charcoal mt-1 font-mono tabular-nums">
        {value}
      </p>
    </div>
  );
}

function UsageCard({ row, email }: { row: UsageRow; email?: string }) {
  const when = new Date(row.created_at);
  const meta = row.metadata && Object.keys(row.metadata).length > 0
    ? JSON.stringify(row.metadata)
    : null;
  return (
    <div className="p-3 bg-surface border border-hairline rounded-lg space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-mono text-charcoal">
          {row.operation}
        </span>
        <span className="text-[11px] text-mid font-mono tabular-nums whitespace-nowrap">
          {when.toLocaleString("en-GB", {
            timeZone: "Europe/London",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-mid">
        <span className="px-1.5 py-0.5 bg-canvas border border-hairline rounded">
          {row.provider}
        </span>
        <span>{row.model}</span>
        <span
          className={
            row.status === "success"
              ? "text-accent"
              : "text-danger"
          }
        >
          {row.status}
        </span>
        {row.cost_usd != null && (
          <span className="ml-auto text-charcoal font-semibold tabular-nums">
            ${row.cost_usd.toFixed(4)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-mono text-mid">
        {row.input_tokens != null && row.input_tokens > 0 && (
          <span>in {row.input_tokens.toLocaleString()}t</span>
        )}
        {row.output_tokens != null && row.output_tokens > 0 && (
          <span>out {row.output_tokens.toLocaleString()}t</span>
        )}
        {row.cached_input_tokens != null && row.cached_input_tokens > 0 && (
          <span>cache {row.cached_input_tokens.toLocaleString()}t</span>
        )}
        {row.input_bytes != null && row.input_bytes > 0 && (
          <span>in {(row.input_bytes / 1024).toFixed(0)}KB</span>
        )}
        {row.output_bytes != null && row.output_bytes > 0 && (
          <span>out {(row.output_bytes / 1024).toFixed(0)}KB</span>
        )}
        {row.duration_ms != null && (
          <span>{(row.duration_ms / 1000).toFixed(1)}s</span>
        )}
        <span title={row.user_id ?? ""}>
          {email ?? (row.user_id ? row.user_id.slice(0, 8) : "—")}
        </span>
      </div>
      {row.error_message && (
        <p className="text-[12px] text-danger break-words">{row.error_message}</p>
      )}
      {meta && (
        <details className="text-[11px]">
          <summary className="text-mid cursor-pointer font-mono">metadata</summary>
          <pre className="mt-1 p-2 bg-canvas border border-hairline rounded whitespace-pre-wrap text-charcoal font-mono">
            {meta}
          </pre>
        </details>
      )}
    </div>
  );
}
