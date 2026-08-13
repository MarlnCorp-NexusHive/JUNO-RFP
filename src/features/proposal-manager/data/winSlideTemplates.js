/** Post-selection win-slide template copy. */

export function defaultWinSlideFromPursuit(pursuit, competitors) {
  const names = competitors.map((c) => c.shortName || c.name).filter(Boolean);
  const against = names.length ? names.join(", ") : "the field";
  const won = pursuit?.outcome === "won";
  const lost = pursuit?.outcome === "lost";

  const whyUs = won
    ? (pursuit.debrief?.whyWon || []).slice(0, 4)
    : [
        "Document-grounded drafts and evaluator-ready exports",
        "PM–auditor review trail the buyer can audit",
        "Issuer + competitive intel in the same pursuit file",
      ];

  const whyThem = lost
    ? (pursuit.debrief?.whyLost || []).slice(0, 4)
    : competitors.slice(0, 3).map((c) => `${c.shortName}: ${c.typicalWinThemes?.[0] || c.valueProposition?.slice(0, 90) || "incumbent / brand gravity"}`);

  return {
    pov: won
      ? `Post-selection POV: JUNO won ${pursuit?.rfpName || "this RFP"} against ${against} because the evaluation rewarded completeness, named ownership, and submission-ready volumes — not a generic GenAI demo.`
      : lost
        ? `Post-selection POV: We lost ${pursuit?.rfpName || "this RFP"} to ${against}. The scores show a domain/fit gap, not a documentation-process gap — JUNO’s ops quality was not the deciding factor.`
        : `Post-downselect POV: ${pursuit?.rfpName || "This pursuit"} is still open. Position JUNO against ${against} on defensibility, collaboration, and export — not rate-card alone.`,
    testing: won
      ? "Proof: Section L/M crosswalk complete; named crews/owners; SLA mapping tested against the solicitation checklist before submit."
      : lost
        ? "Testing/debrief: Factor scores ingested on Scoring. Gaps (vertical kits, past-performance library, go/no-go fit) are queued for Product Engineering."
        : "Testing: Run a red-team against the competitor win themes below before orals. Confirm every claim traces to the RFP text in Content Hub.",
    whyUs,
    whyThem,
  };
}

export function buildWinSlideDeckContent({ pursuit, outcome, competitors, pov, testing, whyUs, whyThem }) {
  const names = competitors.map((c) => c.shortName || c.name).filter(Boolean);
  const against = names.length ? names.join(", ") : "the competitive field";
  const verb = outcome === "won" ? "Won against" : outcome === "lost" ? "Lost against" : "Competing against";
  const whyUsLines = (whyUs || []).map((l) => `- ${l}`).join("\n");
  const whyThemLines = (whyThem || []).map((l) => `- ${l}`).join("\n");
  const competitorBlocks = competitors
    .map(
      (c) =>
        `${c.name} (${c.segment})\nValue: ${c.valueProposition || "—"}\nDifferentiators: ${(c.keyDifferentiators || []).slice(0, 3).join("; ")}`
    )
    .join("\n\n");

  return `
# Post-RFP selection win slide
Pursuit: ${pursuit?.rfpName || "Untitled RFP"}
Agency: ${pursuit?.agency || "—"}
Solicitation: ${pursuit?.solicitationNumber || "—"}
Outcome: ${verb} ${against}

## Point of view (post-selection)
${pov}

## Proof / testing
${testing}

## Why JUNO / Marln
${whyUsLines || "- (add win themes)"}

## Why them / where they scored
${whyThemLines || "- (add competitor themes)"}

## Competitor field
${competitorBlocks || "No competitors selected."}

## Ask
Use this slide in orals, internal win reviews, or Product Engineering debrief. Gaps from Scoring feed the roadmap.
`.trim();
}
