# Host screens (Discord board vs control)

The host screen-shares the **board** on Discord. Everyone in the call can see that screen. Treat it as a contestant-visible surface.

## Hard rule

Anything contestants must not know yet **must not be rendered on the board screen**. Do not put it in the board route’s UI, layout, title, scoreboard, CSS (hidden text), or debug overlays.

That includes:

- Clue answers
- The Last Trumpet answer before the host reveals a team
- Which cells are Double Portion, until that cell is opened (then it is public)
- Host judging controls (Correct / Incorrect / Reveal / Undo / Open buzzing)
- Host-only data from `hostOnly` (answers, Double Portion map)

The board client must not fetch the question set from Firestore and must not subscribe to `hostOnly`. Use the public/player child listeners only (`meta`, `public`, `players`, `teams`). Opening a cell from the board may write via a host transaction; do not render answers or unused Double Portion marks.

## Two host devices (required)

The same Google host signs in on **two different browsers/devices** (`localStorage` device id must differ; two tabs in one browser do not count).

| Device | Route | Role |
|--------|--------|------|
| Shared display | `/host/[code]/board` | Public lobby, then the board. Fits one viewport. Host may click cells. Never render answers. |
| Controls | `/host/[code]/control` | Answers, judging, lobby settings, and the same cell picker. |

`/host/[code]` is pairing: copy both URLs, claim one role per device. Do not start the game until both roles have fresh heartbeats from different device ids.

Cell clicks are allowed on **both** host screens. The board still must not render answers or unused Double Portion marks.

## Double Portion

Hosts do not choose Double Portion cells in the set editor. At game start (and Play again), pick **1** Round 1 cell and **2** Round 2 cells at random. Store the map only under `hostOnly`. Reveal on `public.currentClue.doublePortion` when that cell is opened, same moment players see it.

## Board layout

The Discord board must show the **entire** 6×5 grid (plus category headers) in the viewport without page scroll. In the lobby it shows the room code and contestant teams. Prefer `dvh` + a filling CSS grid. Compact scores. When a clue is open, replace the grid with the public clue (and Double Portion label only if this clue is one).
