# Website place labels and Notion sync

`assets/js/place-labels.js` is a website-only presentation dictionary. The publisher writes itinerary, ticket and hotel source JSON; it does not write this dictionary. Do not copy display labels back into Notion or change source IDs to translate names.

Existing `placeId` rendering remains authoritative, including ticket anchors and UNESCO markers. Plain text is matched longest-first against explicit aliases, with Latin word boundaries and date scopes for ambiguous names. HTML is escaped before rendering. Unknown names remain unchanged. New names/aliases need an explicit dictionary entry after review; ambiguous aliases must have a date scope, which also needs review if an itinerary moves dates.

The dictionary covers itinerary text, notes, titles, subtitles, tags and Today titles. Search includes both language variants. Hotels, restaurant brands, service numbers and ticket product names retain their source spelling. A translated label does not create a map pin, coordinates, reservation or UNESCO status.

When existing canonical place names change, update their dictionary entries as well. Keep `place-labels.js` in the service worker shell cache and bump the cache version after edits.
