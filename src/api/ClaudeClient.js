/**
 * ClaudeClient — Mock implementation.
 * Returns pre-written dialogue for each NPC with a simulated typing delay.
 * To enable real Claude API: replace getResponse() with a streaming fetch call.
 */

import { DIALOGUES } from '../data/dialogues.js'

const responseCounters = {}

/**
 * Returns the next dialogue line for a given NPC id.
 * Cycles through the dialogue bank.
 */
export async function* streamDialogue(npcId) {
  const bank = DIALOGUES[npcId]
  if (!bank) {
    yield "No signal from this frequency. Try another character."
    return
  }

  responseCounters[npcId] = responseCounters[npcId] ?? 0
  const text = bank[responseCounters[npcId] % bank.length]
  responseCounters[npcId]++

  // Simulate streaming: yield word by word with slight delay
  const words = text.split(' ')
  for (const word of words) {
    yield word + ' '
    await delay(28 + Math.random() * 22)
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/* ── How to enable real Claude API ──────────────────────────────
 *
 * 1. Create .env file: VITE_CLAUDE_API_KEY=sk-ant-...
 * 2. Replace the export above with:
 *
 * export async function* streamDialogue(npcId, userMessage = 'Tell me about yourself.') {
 *   const systemPrompts = { ...from NPC modules... }
 *   const res = await fetch('https://api.anthropic.com/v1/messages', {
 *     method: 'POST',
 *     headers: {
 *       'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
 *       'anthropic-version': '2023-06-01',
 *       'content-type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       model: 'claude-haiku-4-5-20251001',
 *       max_tokens: 180,
 *       stream: true,
 *       system: systemPrompts[npcId],
 *       messages: [{ role: 'user', content: userMessage }],
 *     }),
 *   })
 *   const reader = res.body.getReader()
 *   const decoder = new TextDecoder()
 *   while (true) {
 *     const { done, value } = await reader.read()
 *     if (done) break
 *     const lines = decoder.decode(value).split('\n')
 *     for (const line of lines) {
 *       if (!line.startsWith('data: ')) continue
 *       try {
 *         const json = JSON.parse(line.slice(6))
 *         if (json.type === 'content_block_delta') yield json.delta.text
 *       } catch (_) {}
 *     }
 *   }
 * }
 * ─────────────────────────────────────────────────────────────── */
