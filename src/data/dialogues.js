/**
 * Mock NPC dialogue banks.
 * Each NPC cycles through these responses (one per E-press).
 * Architecture is API-ready — swap ClaudeClient.js to enable live responses.
 */

export const DIALOGUES = {
  ayoola: [
    "MDFLD isn't a marketplace — it's infrastructure. Anyone can build a listings page. We're building the trust layer that makes the whole secondary football economy function. That's the difference between a feature and a foundation.",

    "The football memorabilia market is worth billions and it's still largely running on eBay and DMs. That's not a gap — that's a runway. Verification-first isn't a product decision, it's a statement of values. Trust is the moat.",

    "I build with AI because it lets one person operate at the velocity of a team. But AI doesn't replace judgment. The judgment is knowing what to build, why the order matters, and what to never outsource. Infrastructure decisions compound.",

    "Every founder pitch talks about TAM. I think about infrastructure TAM — the value of being the layer everything else runs on. Football is global, tribal, and deeply sentimental. We're building the rails for that emotion to have commercial form.",
  ],

  builder: [
    "Every product here was built by one person. That's the point — tools are powerful enough now that a solo founder can ship what took teams five years ago.",
    "The scraper, the ML pipeline, the family portal — all of it is production code. Not demos. Not tutorials. Real software solving real problems.",
    "I'm proving that taste + technical skill + relentless focus beats a team without vision. Come find me when you're ready to build something that matters.",
    "Check the Projects zone to the east. 153 scraped products, 10k boot images, a full-stack enrollment system. That's what nights and weekends look like.",
  ],
}
