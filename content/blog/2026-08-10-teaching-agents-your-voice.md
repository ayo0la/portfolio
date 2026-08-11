---
title: "Teaching an AI to write like you"
date: 2026-08-10
tldr: "Our agents drafted messages that sounded like an AI. The fix was not a better prompt or a fine-tune, it was noticing that every edit staff already made was a free training signal we were throwing away. Shipped this week."
---

At Square A we build AI agents for childcare centers. When a family inquires about a spot, an agent drafts the reply. When a family finishes a tour, an agent drafts the follow-up. A staff member reads every draft in a queue and approves it, edits it, or rejects it before anything reaches a parent. Nothing goes out unread by a human. That gate is the product.

The drafts were good. They were also, unmistakably, drafts written by a machine. Every center got the same competent, slightly stiff voice. One director writes in short warm bursts and signs off with her first name. Another writes long and formal and always names the specific classroom. A generic prompt cannot be both, and asking each center to write their own prompt is asking a childcare director to become a prompt engineer, which is not the deal.

## The signal was already there

Here is the thing I was slow to see. Staff were already editing the drafts. Every time a director rewrote "We look forward to welcoming your family" into "Can't wait to meet you and Micah!", she was telling us exactly how she writes. Then we saved her final text, sent it, and threw the lesson away.

That edit is a training signal. It is better than a training signal, actually, because it is free and it is unambiguous. The staff member is not annotating data for us. She is doing her job, and the difference between what the machine wrote and what she sent is the entire lesson.

So the feature became: watch the gate, learn from what happens there, and write it back into the next draft.

## Three small pieces

I did not fine-tune anything. Fine-tuning per client, for a product where each center is a tenant and centers come and go, is the wrong shape entirely: slow, expensive, hard to inspect, and nearly impossible to undo when a client asks you to forget something. Instead there are three plain pieces.

**Classify.** Every reviewed draft becomes one of three things: an unedited approval, an edited approval, or a rejection. An unedited approval only says "that was fine." An edit says "here is what I actually wanted." A rejection with a reason says "here is what you got wrong." The last two are the rich signal.

**Distill.** The interesting action goes to a small model whose only job is maintaining a short written description of how this center writes, in plain English, capped at roughly a thousand characters. Not the messages themselves, the rules behind them. Things like "opens with the child's first name" or "never uses exclamation points" or "always states the exact seat-hold deadline." Crucially, the distiller amends the existing profile rather than appending to it, so it stays a tight rulebook instead of growing into a diary.

**Inject.** At draft time, that profile gets appended to the agent's system prompt, along with at most two recent approved messages as tone references. A center with no history drafts exactly as it did before, byte for byte. A center with fifty reviewed actions drafts like itself.

## The decisions that actually mattered

The architecture above is the easy part. These are the choices I would want to read about in someone else's post.

**Positive signal is cheap, so batch it.** An unedited approval barely teaches you anything, but you still want to count it, because "the last twenty drafts went out untouched" is meaningful. So unedited approvals increment a counter and only trigger the distiller every fifth one. Edits and rejections always run. This alone cut the ongoing cost of the feature by most of what it would have been.

**Fail open, always.** If the profile cannot be loaded for any reason, the draft is generated without it. A learning feature is a nice-to-have sitting in front of a workflow that a business depends on. It is never allowed to be the reason a draft does not exist.

**Make the ordering failure survivable.** The distill job runs off a queue, which means it can be delivered twice. Each run gets stamped once it is distilled, so redelivery is a no-op. But the stamp is written after the profile is saved, deliberately. If the process dies between those two writes, the retry re-distills an action already reflected in the profile, and the distiller's amend-don't-append behavior absorbs that harmlessly. The other ordering would silently drop the action forever. When you have to pick a failure mode, pick the one that is redundant instead of the one that is lossy.

**Recent examples are a leak risk.** Those two example messages went to real families. They contain real names and real dates. The injection wraps them in an explicit instruction: match the voice and structure, never reuse any detail from them. Profiles are also scoped per center per agent type and enforced at the database level, so one center's voice can never bleed into another's draft.

**No black boxes.** Staff can open settings, read the profile the system has written about them, and edit or clear it. If a machine is keeping a description of how you write, you get to see it and change it. That felt non-negotiable, and it took about thirty lines.

## The bug that taught me the most

Early on, the classifier decided that nearly every approval was an edit.

The approve form is a textarea prefilled with the draft. Browsers normalize line breaks in textarea submissions to carriage-return-newline, while our stored draft used bare newlines. So a director who read a three-paragraph draft, changed nothing, and hit approve produced a "final" text that differed from the draft by invisible bytes on every line break. Byte comparison said edit. The distiller then dutifully learned style lessons from a diff containing no style changes.

The fix is one function that normalizes both sides before comparing. Two lines. But it is a good reminder of what these systems do when the input is subtly wrong: they do not crash, they confidently learn garbage. That is why the whole thing was built test-first, and why the tests cover the boring cases like "approval with Windows line endings" rather than only the happy path.

## Where it stands

This went to production today. About fourteen hundred lines, built test-first across a dozen scoped tasks, with the full suite green before it merged.

Which means the interesting part starts now. Nothing in the paragraphs above is proven yet. A profile that reads well after five gate actions may say something strange after two hundred, and the only way to find out is to watch real directors approve real messages for a few weeks and read what the system decided they sound like. That is the actual test, and I do not get to grade it myself.

The general lesson is the part that travels. If your product puts a human in front of AI output, you are already collecting the most valuable data in the building, and you are probably discarding it on every single approval. The gap between what the model wrote and what the human sent is your product's opinion about itself. Store it, distill it, feed it back.
