---
title: "The Search That Should Have Been the Start"
date: 2026-09-05
tldr: "I spent an evening hunting a pair of boots across eBay, Instagram, Depop, Facebook Marketplace and half a dozen boutique stores. It made me angry enough to build the thing MDFLD should have started with almost two years ago. It now indexes about thirty one thousand listings from our little server."
---

It has been two weeks since I posted here. For someone who wrote a whole post about liking to be busy, going quiet on the one place I said I'd think out loud is a little embarrassing. So, yeah, noted, haha. Here's what I was doing instead.

## The search

Late in August I needed a pair of boots. Not for content or the dataset. I needed a replacement so I can have something to play in. I had a model in mind, the Predator Absolado LZ, my size obviously, and a number I wasn't willing to go above.

So I did what I always do, what every boot head does, and what I somehow keep forgetting is completely insane. I opened eBay. I opened three boutique stores I trust. I went through a handful of Instagram accounts that sell retro pairs out of their DMs. I checked Facebook Marketplace. I checked Depop. Then I went back to eBay and searched again with different words, because eBay doesn't know what a boot is. It knows what a shoe is, and it knows what "size 11" is, and it has no idea that the thing I'm looking for has a model, a generation, a colorway, and a sole type, and that all of those matter more than the word "predator" in a title.

I found the pair eventually. Right size, right price, on eBay, from a seller whose photos I zoomed into for a long time before I paid. It's a great pair and I'm extremely happy with it.

I was furious after the purchase, and the reason is obvious in hindsight. I run a company whose entire reason to exist is trust in your boots and kits. I've spent almost two years on it. And when I, personally, needed a pair, MDFLD did nothing for me. I went through the exact same scattered, squinting, tab-hoarding process as anyone else, and I settled for the same bad experience.

That was the moment my mind started racing.

## The second time frustration built something

The first time I felt this exact frustration, it turned into MDFLD. A marketplace where the listings are real and the boots are what they claim to be. That idea is still right. But a marketplace needs supply before it's useful to anyone, and supply is the slowest thing in the world to build from zero.

This time the frustration pointed somewhere else. I didn't need a better place to buy. I needed a better place to look. Every boot I could have bought that night already existed on someone's site. What didn't exist was a single front door that understood boots and could show me all of them at once.

So I stopped work on other things and built that. The mental model was Kayak: be the front door, not the warehouse.

## What it actually is

The aggregator pulls listings from other places and lays the MDFLD taxonomy over them. Model, generation, colorway, size. That taxonomy already existed, it's the same data behind the [boot cloud on the explore page](https://mdfld.co/explore), and it turned out to be the most valuable thing I'd built without knowing it.

The sources so far are eBay through its official API, and retro specialists that run on Shopify. Depop and Mercari are wired up but off, because both of them block headless browsers and I'd rather have a couple sources that work than 10 that flake.

The real product is the normalizer, the code that reads a seller's title and figures out what boot it is. Sellers write titles like they're texting. The normalizer pulls out the size, the product code if there is one, the sole type, the condition, and then matches what's left against the taxonomy. When it's confident, the listing lands under the right boot. When it isn't, it doesn't guess, and I fix it by hand in an admin queue. Every correction becomes a rule, so the thing gets a little smarter each week.

Right now it holds about thirty one thousand active listings across about fourteen hundred boots, and it's live on [mdfld.co](https://mdfld.co).

## Running it on one small box

All of this runs on one server, next to the same Postgres database that runs the rest of the site. No queue, no orchestration, nothing with a control plane.

The ingest is a systemd timer that fires every six hours. Each run takes a Postgres advisory lock before it starts, so if one pass runs long, the next one sees the lock and quietly goes back to sleep instead of stacking on top of it. There's a retention pass that expires listings we haven't seen in a while, and a weekly job that re-runs the matcher over old listings once the rules have improved, so mistakes from last month get fixed without me touching them.

It's boring, and it has not needed my attention once since it went in. I'll take boring lol.

## This should have been where I started

Here's the part that's harder to write.

Working on this, I kept having the same thought: this is where I should have started. Before the marketplace, before the checkout, before the shipping labels, before the verification work I care so much about. An index that understands boots creates value the first day it runs, for anyone who searches, with no sellers needed. Everything else I built needed someone else to show up first.

I've made a lot of mistakes in close to two years on MDFLD. I built in the order that made sense to me instead of the order that would have made something useful fastest. I'm only now starting to understand how this has to work, and the honest reason I understand it is that I got to feel the original problem again, as a customer, on a Monday night.

I wrote [a few weeks ago](/blog/mine-to-solve/) that this problem feels like mine to solve whether or not MDFLD is the vehicle. I still think that. What changed is that I now know which door the solution comes through. It comes through the search. Everything else, the trust layer, the price history, the legit check, hangs off the moment someone types in the boot they want and finally sees all of them in one place.

Nearly two years to learn that. It's worth it, I think, but I'd rather you learn it from this post than the way I did.
