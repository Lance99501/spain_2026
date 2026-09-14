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

## Preview

Open **Actions** → **Publish Spain 2026 from Notion** → **Run workflow**.

Choose:

- `Mode = Preview`
- `Scope = All`, `Itinerary`, or `Reservations`

Preview is read-only. It resolves `config/notion-links.json` first, then uses heuristic matching only for still-unmapped rows. Heuristic matches are suggestions and are never written.

The Summary separates:

- deterministic mappings,
- ignored private records,
- unmapped / heuristic candidates,
- safety-review findings.

## Guarded Publish

Choose `Mode = Publish`.

Publish is deterministic: **only rows listed in `config/notion-links.json` are allowed to control GitHub data**. Unmapped Notion rows are skipped and reported. Publish never guesses a target.

The mapping model supports:

- Itinerary → item
- Itinerary → day
- Itinerary hotel Check-in / Check-out → existing `hotels.json` stay window
- Reservation → one ticket
- Reservation → multiple tickets, e.g. one Emirates booking controlling outbound + return tickets
- Multiple Reservations → one shared ticket, e.g. separate Alhambra passenger bookings
- Reservation → confirmed hotel stay
- `ignore: true` for private records that must never publish, e.g. personal travel insurance

Current deterministic coverage includes all **21 Confirmed / Fixed itinerary rows** and all **19 Confirmed reservations** in the Spain trip window. Personal insurance is explicitly ignored rather than published.

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
8. GitHub Pages deploys from the resulting commit.

The workflow writes a Summary and keeps `notion-publisher-report` as an artifact for 14 days.

## Normal operating SOP

For a real booking / ticket change:

1. Update the private Notion Reservation / Itinerary first.
2. Run `Mode = Preview`.
3. Review any `BLOCK`, unmapped, or heuristic findings.
4. If it is a genuinely new record, add a deterministic entry in `config/notion-links.json`.
5. Run `Mode = Publish`.
6. Confirm the Publish job and GitHub Pages deployment are green.

For ordinary flexible route / note edits, Pages CMS can still be used later. Do not use Pages CMS to originate a Confirmed / cancelled / changed-ticket state.

## Data boundary

The publisher requests only the fields listed in `config/notion-publisher.json`.

It deliberately does **not** request or publish Booking Ref, amount, currency, traveler names, internal reservation Notes, or Source URL.

`NOTION_TOKEN` must exist only as a GitHub Actions secret. Google Drive permissions are not changed by this publisher.
