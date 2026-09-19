# Spain 2026 · Notion Publisher

The publisher is enabled in phases so Confirmed / Fixed travel data cannot be silently downgraded.

## First-time setup

1. In Notion, create an internal connection named **Spain 2026 Publisher** with **Read content** only.
2. Share only these databases with that connection:
   - `📅 每日行程｜Itinerary`
   - `🎫 預訂與票券｜Reservations & Tickets`
3. Do not share the Spain 2026 parent page, finance, insurance, or unrelated databases.
4. Copy the Notion integration token.
5. In GitHub open `Lance99501/spain_2026` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
6. Save the token as `NOTION_TOKEN`.

The data-source IDs live in `config/notion-publisher.json`; they are not secrets.

## Automatic safe publication

The workflow requests an hourly run at `17 * * * *`. GitHub schedules are best effort; a configured cron is not evidence that it ran on time.

Each scheduled run performs Preview → safety gate → guarded Publish → build and full tests → ordinary commit/push → explicit Pages build and live verification. Protected findings stop publication. The Publish job rechecks the Preview gate against its current main checkout. No-change runs skip dependency installation and browser tests, but still verify Pages so a previous failed deployment can recover.

`Spain PWA Sync Watch` checks separately for new commits, verified deployment, failures, rollback/pause, and more than 3 hours without a workflow run or scheduled run. Manual runs do not prove the hourly schedule is healthy. Duplicate incidents and successful no-change runs stay silent. This watch is a ChatGPT task, not a workflow in this repository.

Manual modes on **main**:

- **Preview**: inspect changes without writing.
- **Publish**: run the same protected publication now.
- **Rollback**: revert a validated auto-publish commit, test, push, deploy, and pause future publication.
- **Deploy**: test and deploy current main without querying or changing Notion; use after a Pages failure.

## Preview

For a manual Preview choose:

- `Mode = Preview`
- `Scope = All`, `Itinerary`, or `Reservations`

Preview is read-only. It resolves `config/notion-links.json` first, then uses heuristic matching only for still-unmapped rows. Heuristic matches are suggestions and are never written.

The Summary separates:

- deterministic mappings,
- ignored private records,
- unmapped / heuristic candidates,
- safety-review findings,
- the automatic Preview gate result.

## Guarded Publish

Scheduled runs publish automatically after the gate passes. To run immediately, choose `Mode = Publish` manually.

Explicit mappings in `config/notion-links.json` remain authoritative. Public-safe new itinerary rows can also be created when they meet `config/notion-publisher.json → autoCreateItinerary`: Planned/Idea, Flexible/Idea, not Fixed, allowed low-risk Type, ITN-63 or newer, an existing date with a matching city, and no likely duplicate. Their existing timeline schema carries `sourceItineraryId` and `notionManaged`; subsequent updates use this embedded identity, not a new entry in `notion-links.json`. Unmapped high-risk items still require review.

Website-only day metadata remains in the day JSON when the publisher updates linked items. `city` is the accommodation/base-city group; optional `focusCity` is the place shown in Today and used for weather on day trips. For example, the Córdoba day keeps `city: "Sevilla"` and uses `focusCity: "Cordoba"`. A future fixed Toledo day should use `city: "Madrid"` plus `focusCity: "Toledo"`. This display metadata is not written back to Notion.

The mapping model supports:

- Itinerary → item
- Itinerary → day
- Itinerary hotel Check-in / Check-out → existing `hotels.json` stay window
- Reservation → one ticket
- Reservation → multiple tickets, e.g. one Emirates booking controlling outbound + return tickets
- Multiple Reservations → one shared ticket, e.g. separate Alhambra passenger bookings
- Reservation → confirmed hotel stay
- `ignore: true` for private records that must never publish, e.g. personal travel insurance

Personal insurance is explicitly ignored rather than published. Use the current Preview report to inspect coverage; counts change as bookings are added.

### Publish safety gates

A Publish run stops before writing source JSON if any mapped row hits one of these conditions:

- GitHub is `confirmed` but Notion is no longer `Confirmed`.
- A linked Notion date differs from the GitHub day/item date.
- A linked hotel Check-in / Check-out date differs from the locked stay window.
- A Confirmed / Fixed / ticketed item has a different start time.
- A hotel Reservation is no longer Confirmed or its start date differs from the confirmed hotel check-in.
- The explicit target in `config/notion-links.json` no longer exists.
- The Notion `Itinerary ID` no longer matches the deterministic mapping.

A mapped Reservation may promote a non-confirmed GitHub ticket to `confirmed`, but it can never downgrade a confirmed ticket.

### What a successful Publish does

1. Reads only the whitelisted Notion fields.
2. Applies deterministic mapped changes in `data/source/`.
3. Adds `sourceItineraryId` links to mapped itinerary items/days and hotel stay anchors when applicable.
4. Bumps the PWA service-worker cache only when public data changed.
5. Runs `npm run build:data` to regenerate `data/generated/bootstrap.json`.
6. Installs Chromium and runs the **full `npm test` suite**, including Playwright smoke tests, before committing.
7. Commits and pushes only when there is an actual diff.
8. A separate job with `contents: read` and `pages: write` explicitly requests `POST /repos/{owner}/{repo}/pages/builds` for the existing branch-based Pages site (`main`, `/`). No PAT or hosting migration is needed.
9. The job waits for the expected build commit and compares the live bootstrap JSON, service worker and index byte-for-byte with the checkout. A stale build or mismatched files cannot report success. If main advanced, it stops and asks for a retry against current main. Already-matching public files need no new build.

A committed change is **not yet a deployed update**. Pages errors fail the workflow after preserving the data commit; retry **Deploy** or let a later successful safe/no-change Publish verify and repair deployment. Preview alone never deploys.

GitHub's [Pages REST API](https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build) documents the explicit build request and its `pages: write` permission.

The workflow writes a Summary and keeps `notion-publisher-report` as an artifact for 14 days.

## Normal operating SOP

1. Update the private Notion Reservation / Itinerary first.
2. Wait for an actual scheduled run or manually run **Publish / All** on main.
3. If Preview or Publish blocks, resolve the actual conflict using official confirmation/tickets before modifying mappings or protected data. Never downgrade Confirmed/Fixed just to pass the gate.
4. Verify **Deploy and verify live Pages**, not just Test or the data commit.
5. If only Pages failed, run **Deploy**. There is no need to republish or duplicate itinerary entries.

## Rollback and resume

Choose **Rollback**, with an auto-publish SHA or blank for the latest auto-publish commit. Only a single-parent ancestor commit with the exact auto-publisher subject and allowed public data paths is accepted. Revert conflicts and tests stop before pushing; no force push is used.

Rollback creates an ordinary revert commit, rebuilds the data, refreshes the cache version, and adds `config/notion-publish-paused.json`. It then uses the same explicit Pages verification job. The pause prevents the next hourly run from immediately reapplying unchanged Notion data. Preview remains available while paused. Review/correct Notion first, then remove the pause file in a reviewed commit and run Preview followed by Publish to resume. If rollback data was pushed but Pages failed, use **Deploy**, not a second rollback.

## Data boundary

The publisher requests only the fields listed in `config/notion-publisher.json`.

It deliberately does **not** request or publish Booking Ref, amount, currency, traveler names, internal reservation Notes, or Source URL.

`NOTION_TOKEN` must exist only as a GitHub Actions secret. Google Drive permissions are not changed by this publisher.
