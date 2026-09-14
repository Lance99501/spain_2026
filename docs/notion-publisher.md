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

## Phase 1 — Preview

Open **Actions** → **Publish Spain 2026 from Notion** → **Run workflow**.

Choose:

- `Mode = Preview`
- `Scope = All`, `Itinerary`, or `Reservations`

Preview is read-only. It compares Notion with the current GitHub source data and writes a Summary + `notion-publisher-preview` artifact. It never commits data.

Preview checks Confirmed / Fixed rows, status/time conflicts, reservation ticket matches, and heuristic candidates. Heuristic matches are suggestions only.

## Phase 2 — Guarded Publish

The same workflow now also exposes `Mode = Publish`.

Publish is intentionally deterministic: **only rows listed in `config/notion-links.json` are allowed to write to GitHub**. Unmapped Notion rows are skipped and reported. Publish never guesses a target.

Current initial links cover the verified Córdoba examples:

- `ITN-45` → `item-2026-10-16-02` (Mezquita)
- `ITN-12` → `day-2026-10-16` (Córdoba day trip)
- Mezquita Reservation → `tkt-mezquita-cordoba`
- Córdoba → Sevilla AVANT Reservation → `tkt-renfe-cordoba-sevilla`

### Publish safety gates

A Publish run stops before writing source JSON if any mapped row hits one of these conditions:

- GitHub is `confirmed` but Notion is no longer `Confirmed`.
- A linked Notion date differs from the GitHub day/item date.
- A Confirmed / Fixed / ticketed item has a different start time.
- The explicit target in `config/notion-links.json` no longer exists.

A mapped Reservation may promote a non-confirmed GitHub ticket to `confirmed`, but it can never downgrade a confirmed ticket.

A mapped itinerary transport may be promoted to `confirmed`. For non-protected items, an exact `HH:MM` start time may be updated. Confirmed ticket times are never changed automatically.

### What a successful Publish does

1. Reads only the whitelisted Notion fields.
2. Applies deterministic mapped changes in `data/source/`.
3. Adds `sourceItineraryId` links when applicable.
4. Bumps the PWA service-worker cache if public data changed.
5. Runs `npm run build:data` to regenerate `data/generated/bootstrap.json`.
6. Runs data validation.
7. Commits and pushes only when there is an actual diff.
8. Normal GitHub Tests / Pages deployment then run from that commit.

The workflow writes a Summary and keeps `notion-publisher-report` as an artifact for 14 days.

## Normal operating SOP

For a real booking / ticket change:

1. Update the private Notion Reservation / Itinerary first.
2. Run `Mode = Preview`.
3. Review any BLOCK / ambiguous / unmapped findings.
4. Add or verify the deterministic entry in `config/notion-links.json` when a new row should control an existing GitHub item/ticket.
5. Run `Mode = Publish`.
6. Confirm the generated commit passes GitHub Tests and Pages deployment.

Do not use Pages CMS to originate a Confirmed / cancelled / changed-ticket state. Pages CMS remains for low-risk public itinerary text and flexible planning.

## Data boundary

The publisher requests only the fields listed in `config/notion-publisher.json`.

It deliberately does **not** request or publish Booking Ref, amount, currency, traveler names, internal reservation Notes, or Source URL.

`NOTION_TOKEN` must exist only as a GitHub Actions secret. Google Drive permissions are not changed by this publisher.
