---
title: "The Search That Should Have Been the Start"
date: 2026-09-05
tldr: "One evening I hunted a single pair of boots across eBay, Instagram, Depop, Facebook Marketplace and half a dozen boutique stores, knocking on every door but the right one. The anger that followed built the thing MDFLD should have started with almost two years ago, and it now indexes about thirty one thousand listings from our little server."
---

Two weeks have passed since I last posted here. For a man who wrote a whole post about liking to be busy, going quiet on the one place I said I'd think out loud is a little embarrassing. So, yeah, noted, haha. Here's what I was doing instead.

## The search

Late in August I needed a pair of boots. Not for content, not for the dataset. I needed a replacement so I can have something to play in. I had a model in mind, the Predator Absolado LZ, my size obviously, and a number I was not willing to go above. Thus armed, I set out on the hunt.

So began the ritual. Every boot head knows it, and I somehow keep forgetting that it is completely insane. eBay first. Then three boutique stores I trust. Then a handful of Instagram accounts that sell retro pairs out of their DMs. Then Facebook Marketplace. Then Depop. Then back to eBay, searching again with different words, because eBay doesn't know what a boot is. It knows what a shoe is, and it knows what "size 11" is, and it has no idea that the thing I'm looking for has a model, a generation, a colorway, and a sole type, and that all of those matter more than the word "predator" in a title. A search box like that reads a title the way a stranger reads a name off a door: it can say the thing out loud, but it knows nothing at all about who lives there.

Door after door, then, each one opening onto a room that had never heard of what I was asking for.

Victory came, eventually. Right size, right price, on eBay, from a seller whose photos I zoomed into for a long time before I paid. It's a great pair and I'm extremely happy with it.

Fury arrived after the purchase, and the reason is obvious in hindsight. I run a company whose entire reason to exist is trust in your boots and kits. Almost two years I have spent on it. And when I, personally, needed a pair, MDFLD did nothing for me. I went through the exact same scattered, squinting, tab-hoarding process as anyone else, and I settled for the same bad experience. What does it say about a man who builds a company for this exact problem, then solves it the way everyone else does, by hand, tab by tab, late at night? It cost me an evening, a long squint at a stranger's photos, and whatever pride a founder has left when his own company cannot help him.

That was the moment my mind started racing.

## The second time frustration built something

The first time I felt this exact frustration, it turned into MDFLD. A marketplace where the listings are real and the boots are what they claim to be. That idea is still right. But a marketplace needs supply before it's useful to anyone, and supply is the slowest thing in the world to build from zero.

This time the frustration pointed somewhere else. What I needed, after the tabs and the DMs and the second search with different words, was not a better place to buy but a better place to look. Every boot I could have bought that night already existed on someone's site. What didn't exist was a single front door that understood boots and could show me all of them at once.

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

Working on this, the same thought kept returning: this is where I should have started. Before the marketplace, before the checkout, before the shipping labels, before the verification work I care so much about. An index that understands boots creates value the first day it runs, for anyone who searches, with no sellers needed. Everything else I built needed someone else to show up first.

I've made a lot of mistakes in close to two years on MDFLD. I built in the order that made sense to me instead of the order that would have made something useful fastest. Only now am I starting to understand how this has to work, and the honest reason I understand it is that I got to feel the original problem again, as a customer, on a Monday night.

I wrote [a few weeks ago](/blog/mine-to-solve/) that this problem feels like mine to solve whether or not MDFLD is the vehicle. I still think that. What changed is that I now know which door the solution comes through. It comes through the search. Everything else, the trust layer, the price history, the legit check, hangs off the moment someone types in the boot they want and finally sees all of them in one place.

Nearly two years to find the door. Worth it, I think. But I'd rather you learn where it is from this post than the way I did, one closed door at a time.
