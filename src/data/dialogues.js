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

  cto: [
    "Supabase was the right call at this stage. You get Postgres — not some watered-down NoSQL guess — plus RLS, auth, realtime, and edge functions in one platform. The founder can move fast AND make decisions that don't become debt. That's rare.",

    "AI-assisted development isn't about replacing engineers — it's about compressing the time between 'idea' and 'working proof of concept'. The real skill is knowing which 30% of the AI output to keep, which to throw away, and which to redesign entirely.",

    "API-first architecture is a forcing function for clarity. If you can't describe what your system does in a clean API surface, you don't understand it yet. Supabase's auto-generated APIs give you a starting point — but you have to own the shape.",

    "The hardest infrastructure problem at MDFLD isn't scale — it's trust at schema level. Row-level security means the database itself enforces who sees what. That's not just a feature, that's the product. The verification tables are the product.",
  ],

  investor: [
    "The global football memorabilia and vintage kit market sits north of $40B annually — and it's still largely informal, opaque, and ripe for a trust crisis. The first platform to own verification and provenance will own the market. MDFLD's positioning is correct.",

    "Infrastructure plays have disproportionate upside. You're not competing with one marketplace — you're building the layer that all marketplaces eventually need to run on. Think Stripe for payments, not PayPal. That's the mental model here.",

    "What I look for early is: does the founder understand the unsexy parts? Customs? Cross-border tax? Authentication at scale? Ayoola talks about shipping corridors and trust scores before he talks about GMV. That's the right order of operations.",

    "The network effect here is asymmetric. Every verified listing makes the next verification cheaper and more credible. Every satisfied collector reinforces the trust signal. The moat builds itself if the foundation is right. That's what we're betting on.",
  ],

  community: [
    "You don't understand — finding an authentic 1998 France World Cup shirt in your actual size was basically impossible before this. I've been burned three times on eBay by 'original' kits that were clearly reproductions. Provenance matters. It's the story.",

    "Football is the most global sport on Earth, and every era has an aesthetic. The Umbro umbros. The Kappa popper tracksuits. The Lotto keepers' kits nobody wanted until they wanted them. This stuff is cultural history, and it deserves a proper home.",

    "The collector community isn't niche anymore. Sneakers went mainstream, streetwear went mainstream — vintage football is next. The gap between demand and trustworthy supply is enormous. That's why MDFLD matters right now.",

    "What MDFLD gets right is that it treats us like serious collectors, not just buyers. Verification isn't just about fraud — it's about respect for the object. A shirt that was worn by someone, that has a history, that means something — that deserves to be authenticated.",
  ],
}
