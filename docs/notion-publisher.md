# Spain 2026 · Notion Publisher

This publisher is intentionally being enabled in phases.

## Phase 1 — Preview only

Current workflow: **Publish Spain 2026 from Notion**

The workflow has only one safety mode: `Preview`. It reads Notion and compares it with the current GitHub source JSON. It does not modify Notion, GitHub data, ticket status, or Google Drive permissions.

### First-time setup

1. In Notion, open the integrations / connections dashboard and create an **Internal connection** named `Spain 2026 Publisher`.
2. Give it **Read content** only.
3. In Notion, open `📅 每日行程｜Itinerary` → top-right `•••` → **Connections / Add connection** → select `Spain 2026 Publisher`.
4. Repeat for `🎫 預訂與票券｜Reservations & Tickets` only. Do not share the Spain 2026 parent page or finance/insurance databases.
5. Copy the connection token.
6. In GitHub, open `Lance99501/spain_2026` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
7. Name the secret `NOTION_TOKEN`, paste the token, and save.
8. Open **Actions** → **Publish Spain 2026 from Notion** → **Run workflow**.
9. Select `Mode = Preview` and `Scope = All`, then run it.
10. Open the completed workflow run and read **Summary**. A JSON copy is also available as the `notion-publisher-preview` artifact for 7 days.

## What Preview checks

- Notion itinerary rows inside the trip dates.
- Confirmed / Fixed itinerary rows as locked data.
- Exact `sourceItineraryId` links when they exist.
- Heuristic candidate links for rows that have not yet been explicitly linked.
- Start-time/status conflicts.
- Confirmed Reservation records against GitHub ticket entities.
- Any attempted `Confirmed → lower status` conflict is reported as `BLOCK` and is never applied.

Heuristic links are suggestions only. Phase 2 will add explicit source mappings before any automatic publishing is allowed.

## Data boundary

The publisher requests only the fields listed in `config/notion-publisher.json`.

It deliberately does **not** request or publish reservation booking references, amount, currency, traveler names, internal notes, or source URLs.

Data-source IDs are not secrets and are stored in the config. `NOTION_TOKEN` must exist only as a GitHub Actions secret.
