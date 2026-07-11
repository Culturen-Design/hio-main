/**
 * Suggested prompts for the builder's chat panel, derived from what's on the
 * page and what the tenant may add. Every suggestion is deliberately a SINGLE
 * action: the ai-command engine executes exactly one tool call per message, so
 * a compound prompt ("add X and rewrite Y") would silently drop its second half.
 */

/** Add-a-section candidates, in the order we'd rather show them. */
const ADD_SUGGESTIONS: readonly { type: string; prompt: string }[] = [
  { type: "testimonial", prompt: "Add a testimonials section" },
  { type: "services", prompt: "Add a services section" },
  { type: "gallery", prompt: "Add a gallery section" },
  { type: "calendar", prompt: "Add a booking calendar section" },
  { type: "links", prompt: "Add a links section" },
  { type: "contact", prompt: "Add a contact section" },
  { type: "bio", prompt: "Add a bio section" },
];

const MAX_SUGGESTIONS = 4;

export function buildSuggestions(
  sections: readonly { type: string }[],
  allowedTypes: readonly string[],
): string[] {
  const present = new Set(sections.map((s) => s.type));
  const allowed = new Set(allowedTypes);
  const suggestions: string[] = [];

  if (present.has("hero")) suggestions.push("Rewrite my hero headline");

  for (const candidate of ADD_SUGGESTIONS) {
    if (suggestions.length >= MAX_SUGGESTIONS - 1) break;
    if (allowed.has(candidate.type) && !present.has(candidate.type)) {
      suggestions.push(candidate.prompt);
      if (suggestions.length >= 3) break;
    }
  }

  if (sections.length > 1) suggestions.push("Remove the last section");

  return suggestions.slice(0, MAX_SUGGESTIONS);
}
