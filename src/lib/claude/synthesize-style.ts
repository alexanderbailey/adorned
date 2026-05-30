import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior fashion stylist helping a client articulate their personal style.
You will be given:
 - The client's own free-text description of what they wear and like
 - A set of inspiration photos they've collected

Synthesise these into a 2-3 paragraph canonical style summary written in the second person ("you"), that:
 - Captures the recurring silhouettes, fabrics, textures, colour stories, and styling moves
 - Notes the contexts/occasions the style reads for (work, weekend, evening, etc. — only what's evident)
 - Reflects emotional / aesthetic notes (e.g. "quietly tailored", "ease over polish", "muted with a single bold accent")
 - Avoids generic fashion clichés ("timeless", "effortless chic") unless genuinely warranted
 - Avoids any judgement of what's "in" or "trendy"

Return ONLY the prose summary. No headers, no bullet points, no preamble.`;

export async function synthesizeStyle(
  description: string,
  inspoImageUrls: string[]
): Promise<string> {
  const content: Anthropic.Messages.ContentBlockParam[] = [
    {
      type: "text",
      text:
        description.trim().length > 0
          ? `Client's own description:\n\n${description.trim()}\n\nInspiration photos follow:`
          : `No written description provided — synthesise purely from the inspiration photos below.`,
    },
    ...inspoImageUrls.map<Anthropic.Messages.ContentBlockParam>((url) => ({
      type: "image",
      source: { type: "url", url },
    })),
  ];

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  return message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();
}
