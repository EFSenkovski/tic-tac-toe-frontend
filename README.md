# Tic-Tac-Toe frontend

Svelte 5 (runes) + Vite + TypeScript client for [`tic-tac-toe-backend`](../tic-tac-toe-backend).

## Run

```sh
npm install
npm run dev     # http://localhost:5173, /api proxied to :8080
npm run check   # type-check
npm run build
```

Start the backend first. Set `VITE_BACKEND_URL` to proxy somewhere else.

## How it plays

- Pick a friend or an Easy / Medium / Hard AI, then X or O.
- Against a friend, send them the `/game/{id}` link. A third visitor just watches.
- When a game ends, **Play again** starts a Rematch with swapped Figures. A friend has to accept it first.
- The scoreboard (You · Draw · Opponent) lives in memory only: reloading or pressing **← Menu** resets it.
- Your seat is kept in `localStorage` per game, so a reload resumes it.

## Layout

```
src/App.svelte            routing and the 1 s poll loop
src/lib/api.ts            typed fetch wrapper
src/lib/session.svelte.ts all game state (GameSession)
src/lib/seats.ts          remembered seats
src/lib/*Screen.svelte    start, setup and game screens
src/lib/Board.svelte, Scoreboard.svelte, ShareLink.svelte
```
