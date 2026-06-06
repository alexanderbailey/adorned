import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Approximate per-model prices in USD. Update against the provider's current
// pricing page; deliberately conservative-ish so cost estimates lean slightly
// high rather than low. These are used at log time to populate cost_usd; the
// authoritative bill comes from the provider, not from this column.
//
// Image-gen models are priced per output image; we still log token counts when
// the SDK returns them, but cost is dominated by the per-image fee.

type Price =
  | { kind: "tokens"; input_per_million: number; output_per_million: number; cached_input_per_million?: number }
  | { kind: "image"; per_image: number; input_per_million?: number };

const PRICES: Record<string, Price> = {
  // Anthropic
  "claude-haiku-4-5":    { kind: "tokens", input_per_million: 0.80, output_per_million: 4.00 },
  "claude-sonnet-4-6":   { kind: "tokens", input_per_million: 3.00, output_per_million: 15.00, cached_input_per_million: 0.30 },
  // Google Gemini
  "gemini-2.5-flash-image": { kind: "image", per_image: 0.039, input_per_million: 0.10 },
  "gemini-3-pro-image":     { kind: "image", per_image: 0.12 },
  "gemini-3.1-flash-image": { kind: "image", per_image: 0.05 },
};

export interface AiUsageLog {
  userId: string | null;
  provider: "anthropic" | "google";
  model: string;
  operation: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cachedInputTokens?: number | null;
  inputBytes?: number | null;
  outputBytes?: number | null;
  durationMs?: number | null;
  status: "success" | "error";
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

function calcCostUsd(args: AiUsageLog): number | null {
  const price = PRICES[args.model];
  if (!price) return null;
  let cost = 0;
  if (price.kind === "tokens") {
    const inT = args.inputTokens ?? 0;
    const outT = args.outputTokens ?? 0;
    const cachedT = args.cachedInputTokens ?? 0;
    const billedInT = Math.max(inT - cachedT, 0);
    cost += (billedInT / 1_000_000) * price.input_per_million;
    cost += (outT / 1_000_000) * price.output_per_million;
    if (price.cached_input_per_million) {
      cost += (cachedT / 1_000_000) * price.cached_input_per_million;
    }
  } else {
    // image: one image per successful call, plus optional per-token input fee.
    if (args.status === "success" && (args.outputBytes ?? 0) > 0) {
      cost += price.per_image;
    }
    if (price.input_per_million && args.inputTokens) {
      cost += (args.inputTokens / 1_000_000) * price.input_per_million;
    }
  }
  return Number.isFinite(cost) ? Math.round(cost * 1_000_000) / 1_000_000 : null;
}

export async function logAiUsage(args: AiUsageLog): Promise<void> {
  try {
    const cost = calcCostUsd(args);
    const admin = createAdminClient();
    await admin.from("ai_usage").insert({
      user_id: args.userId,
      provider: args.provider,
      model: args.model,
      operation: args.operation,
      input_tokens: args.inputTokens ?? null,
      output_tokens: args.outputTokens ?? null,
      cached_input_tokens: args.cachedInputTokens ?? null,
      input_bytes: args.inputBytes ?? null,
      output_bytes: args.outputBytes ?? null,
      cost_usd: cost,
      duration_ms: args.durationMs ?? null,
      status: args.status,
      error_message: args.errorMessage ?? null,
      metadata: args.metadata ?? {},
    });
  } catch (err) {
    // Logging failures must never break the user-facing call.
    console.error("[usage] logAiUsage failed:", err);
  }
}
