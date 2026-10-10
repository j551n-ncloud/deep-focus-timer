# Deep Focus Timer

A focus timer that runs entirely in the browser. Pick a task, pick a length,
put on some background audio and work until the timer runs out. Nothing is
sent to a server; everything is kept in `localStorage`.

Built with React, TypeScript, Vite, Tailwind CSS and shadcn/ui.

## What it does

- **Session lengths** from 15 minutes to 3 hours, a 25/5 Pomodoro mode, and
  a 90 minute deep work mode.
- **A task per session**, chosen from a task list with categories before the
  timer starts.
- **Background audio** from a YouTube link that keeps playing for the whole
  session.
- **Survives a reload.** A running session picks up where it was after a
  page refresh.
- **History.** A contribution calendar of focus hours per day, and a streak
  counter.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

With Docker, the production image builds the app and serves it with nginx:

```bash
npm run docker:build && npm run docker:run         # http://localhost:3000
docker compose up calendar-app                     # same, with compose
docker compose --profile dev up calendar-app-dev   # dev server with hot reload
```

## Where the data lives

Everything is stored in the browser's `localStorage`, so it stays on the
device and works offline. Clearing site data deletes it.

| Key | What |
|---|---|
| `focus-calendar` | focus hours per day, for the calendar and streak |
| `focus-tasks` | the task list, with categories and completion state |

[DATA_STORAGE.md](DATA_STORAGE.md) has the full list and notes on backing
it up.

## Project layout

| Path | Contents |
|---|---|
| `src/pages/Index.tsx` | the app |
| `src/components/` | timer, focus session, task input, calendar, YouTube embed |
| `src/components/ui/` | shadcn/ui primitives |
| `src/hooks/useSessionPersistence.ts` | keeps a running session across reloads |
| `nginx.conf` | static serving for the Docker image |
