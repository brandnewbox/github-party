# Fixing Issue #19: Extension Pointing to localhost:1999

## PR History & What Led Us Here

### PR #10 — "injecting host" (merged Aug 25)
Set up `process.env.PARTY_HOST` in `content.ts` and `esbuild.mjs` so the PartyKit URL gets injected at build time instead of being hardcoded. For local dev, `PARTY_HOST=http://localhost:1999` comes from `docker-compose.yml`. This was the right approach — environment-driven, swappable per context.

### PR #11 — "added ci" (merged Aug 28)
Added CircleCI. The deploy job ran `npm run deploy`, parsed the PartyKit URL from the deploy output, and injected it into the extension build. Will reviewed and commented: **"I think the partykit host will consistently be `https://multiplayer-github.willtcarey.partykit.dev` but I'm not positive. Fetching the host through the deploy is cool."** This tells us the real URL — it's under Will's PartyKit account.

### PR #14 — "not building web extension through partykit" (CLOSED, not merged, Aug 29)
Hit the chicken-and-egg problem: `partykit.json` has a `build.command` that runs `npm run build:extension` during `npm run deploy`. That build needs `PARTY_HOST` set, but the whole point of deploying first is to *get* that URL. So deploys failed with exit code 7. The proposed fix was to remove the `build` block from `partykit.json`. Will rejected it: **"We don't want to get rid of this because this is what makes `npm run dev` auto build the extension during dev."** Ian and Will then got it working "without code changes" and closed the PR. It's unclear exactly how — possibly by setting a `PARTY_HOST` env var in the CircleCI context so the build step during deploy wouldn't fail.

### PR #12 — "circle fix" (merged Aug 29)
Fixed CI by upgrading Node from 18.17 to 22.0 and splitting the pipeline into separate `build-and-test` (non-main branches) and `deploy` (main only) jobs. Added a startup smoke test. The diff from PR #14 (not merged) also shows they considered hardcoding the URL to `https://multiplayer-github.willtcarey.partykit.dev` instead of dynamically parsing it from deploy output.

### PRs #15, #16, #18 — cosmetic (Sep 3–9)
Added icons, renamed extension from "Github Multiplayer" to "Github Party", removed `activeTab` permission. Each time, a zip was manually built and uploaded to a PR comment for Will to submit to the Chrome Web Store. The CI artifact pipeline was never used for store submissions.

### Issue #19 + PR #20 — current (Oct 3)
Someone noticed the live Chrome extension is connecting to `localhost:1999`. The zip that was submitted to the store was built locally without `PARTY_HOST` set, so esbuild injected `undefined` or the dev default. Ian manually patched `content.js` in a zip, then created PR #20 with a `build:extension:prod` script hardcoding `PARTY_HOST=https://github-party.partykit.dev`. Will reviewed and pointed out that URL doesn't resolve to a real DNS address.

## Root Cause

Two things went wrong:

1. **Wrong URL.** The prod build script in PR #20 uses `https://github-party.partykit.dev`. The actual deployed URL is `https://multiplayer-github.willtcarey.partykit.dev` (project name `multiplayer-github`, deployed under Will's account). We confirmed this — `github-party.partykit.dev` doesn't resolve, but `multiplayer-github.willtcarey.partykit.dev` returns HTTP 404 (meaning the server is live, it just doesn't serve HTTP because it's a WebSocket server).

2. **Manual zip builds bypass CI.** Every Chrome Web Store submission was a manually built zip uploaded in a PR comment. The CI pipeline correctly deploys the server and builds the extension with the right URL, but nobody uses those artifacts. The manually built zips used whatever `PARTY_HOST` was in the local environment — which was `localhost:1999` from Docker.

## Plan Forward

### Step 1: Fix the URL in `package.json`

Change the `build:extension:prod` script from:
```
PARTY_HOST=https://github-party.partykit.dev
```
to:
```
PARTY_HOST=https://multiplayer-github.willtcarey.partykit.dev
```

### Step 2: Fix the fallback URL in `.circleci/config.yml`

Line 45 has `${PARTY_HOST:-"https://github-party.partykit.dev"}` — update to `https://multiplayer-github.willtcarey.partykit.dev`.

### Step 3: Update `ARCHITECTURE.md`

Replace all references to `https://github-party.partykit.dev` with the correct URL.

### Step 4: Rebuild the extension

```bash
npm run build:extension:prod
```

Verify:
```bash
grep -o 'https://[^"]*partykit\.dev' web-extension-dist/content.js
```

Should output `https://multiplayer-github.willtcarey.partykit.dev`.

### Step 5: Bump version and package

Bump `web-extension/manifest.json` version to `1.0.2`, then zip:
```bash
cd web-extension-dist && zip -r ../github-party-extension-v1.0.2.zip . && cd ..
```

### Step 6: Update PR #20

Commit, push, and attach the new zip to PR #20. This properly closes issue #19.

## Open Question

The `partykit.json` build command still causes problems for CLI deploys (the exit code 7 issue from PR #14). It was resolved once "without code changes," likely by having `PARTY_HOST` set in the CircleCI context. But for local deploys you'd need to run:
```bash
PARTY_HOST=https://multiplayer-github.willtcarey.partykit.dev npm run deploy
```
This is worth documenting or fixing so future deploys don't hit the same wall.
