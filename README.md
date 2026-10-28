# Recall

*A local spaced-review app for retaining what you study.*

Recall turns a structured curriculum into review cards. It ships with 115 cards across 12 tracks, schedules each card on the **1 · 3 · 7 · 15 · 30 day** cycle, shows what is due, records every review, and marks a card mastered when the cycle is complete.

Everything runs on this computer. There is no account, no server, and no data leaves the browser.

## Requirements

- [Node.js](https://nodejs.org) 20.19+ or 22.12+ (current LTS recommended)
- npm, which is included with Node.js
- Windows for the double-click launcher; on macOS or Linux, use the manual start commands below

No database or external service is required.

## Quick Start

1. Open this folder.
2. Double-click **`Start Recall.cmd`**.
3. Keep the command window open while you use the app. Press `Ctrl+C` in that window to stop it.

The first launch installs the dependencies automatically. The app opens at:

```text
http://localhost:5173
```

### Manual Start

If you prefer a terminal:

```powershell
cd review-reminder
npm install
npm start
```

To create an optimized build:

```powershell
npm run build
npm run preview
```

## How the Review Cycle Works

| Review | Scheduled | What happens |
|---:|---|---|
| Start | Day 0 | The card enters the cycle. The first review is due the next day. |
| 1 | Day 1 | Completing it schedules the next review two days later. |
| 2 | Day 3 | Completing it schedules the next review four days later. |
| 3 | Day 7 | Completing it schedules the next review eight days later. |
| 4 | Day 15 | Completing it schedules the final review fifteen days later. |
| 5 | Day 30 | Completing it marks the card **mastered**. |

### Rules

- **Review early:** Allowed. The remaining intervals shift from the day you actually review.
- **Review late:** Allowed. The next interval starts from the real review date, so overdue cards do not pile up.
- **Again tomorrow:** Keeps the card at the same stage and moves the due date to tomorrow.
- **Mastered now:** Ends the cycle immediately and records the card as mastered.
- **Restart:** A mastered card can be put back into a fresh cycle without losing its history.
- **Mastered:** A card that finishes all five reviews leaves the due queue. It stays in the library.

## The Interface

| Area | Purpose |
|---|---|
| **Dashboard** | The due queue, overdue count, active cycles, mastery count, and the next seven days. |
| **Library** | Every card, with search and filters for track, status, and depth. Add, edit, or delete cards here. |
| **Upcoming** | All scheduled reviews for the next 7, 30, or 90 days. |
| **Progress** | Mastery percentage, reviews completed, day streak, progress by track, recent activity, and a 14-day review chart. |
| **Settings** | Light and dark themes, backup export and import, curriculum sync, and reset actions. |

The review session uses the keyboard:

| Key | Action |
|---|---|
| `1` | Again tomorrow |
| `2` | Reviewed |
| `3` | Mastered now |

## Starting Content

The app ships with **115 cards from 12 tracks**, imported from the curriculum:

1. Programming Fundamentals
2. Mathematics
3. Algorithms & Data Structures
4. Computer Systems
5. Databases
6. Networking & Cloud
7. Security
8. AI & Machine Learning
9. Software Engineering Practice
10. Web & Product
11. Business & Career
12. Human & Cognitive

The language sequence from the curriculum is included as separate cards labelled **Language**.

Cards arrive as **Not started**. A card enters the review schedule only after you study the topic and select **Start cycle**. This keeps the initial queue manageable instead of scheduling all 115 cards for day one. The **Start something new** panel on the dashboard suggests a card from a different track.

To regenerate the bundled cards after editing a curriculum Markdown file:

```powershell
npm run import:curriculum -- path/to/complete-curriculum.md
```

If you omit the path, the script looks for `../curriculum/complete-curriculum.md` next to this repository. The import updates `src/data/curriculum.json`; existing review progress is not touched. In the app, **Settings → Add missing curriculum cards** adds any newly imported cards to the current library.

## Your Data

Progress is stored in the browser's local storage under `recall.state.v1`, tied to `http://localhost:5173`.

> [!IMPORTANT]
> Clearing browser site data, using a different browser, or opening the app on a different port starts a fresh library. Export a backup before clearing data or moving to another computer.

Use **Settings → Export backup** to download a JSON file containing every card, schedule, and review event. **Import backup** replaces the current library after confirmation.

The app deliberately uses a fixed port (`5173`) so the local storage origin stays consistent between launches.

## Project Structure

```text
review-reminder/
├── .github/
│   └── workflows/ci.yml      Tests and production build on push
├── Start Recall.cmd          Double-click launcher
├── index.html                App shell and saved-theme bootstrap
├── scripts/
│   └── import-curriculum.mjs Reads a curriculum Markdown file and writes JSON
├── src/
│   ├── App.tsx               Application state and actions
│   ├── components/           Dashboard, library, review session, forms, dialogs
│   ├── data/
│   │   └── curriculum.json   Generated curriculum cards
│   ├── lib/
│   │   ├── curriculum.ts     Seed, merge, and track helpers
│   │   ├── dates.ts          Local-date arithmetic and formatting
│   │   ├── scheduler.ts      The 1/3/7/15/30 review engine
│   │   ├── storage.ts        Local storage load and save
│   │   └── scheduler.test.ts Scheduler and date tests
│   ├── styles.css            Design system and responsive layout
│   └── types.ts              Shared types
├── LICENSE                   MIT license
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development

| Command | Purpose |
|---|---|
| `npm start` | Start the dev server and open the browser. |
| `npm run dev` | Start the dev server without opening the browser. |
| `npm test` | Run the scheduler and date tests. |
| `npm run build` | Type-check and build into `dist/`. |
| `npm run preview` | Serve the production build at `http://localhost:4173`. |
| `npm run import:curriculum` | Regenerate the curriculum card data. |

Built with React 19, TypeScript, Vite, and Vitest. No backend and no runtime dependencies beyond React.

## Contributing

Issues and pull requests are welcome. Before opening a pull request, run:

```powershell
npm test
npm run build
```

## License

Released under the [MIT License](LICENSE).

## Troubleshooting

| Problem | Fix |
|---|---|
| `Port 5173 is already in use` | Another copy of Recall is probably running. Close the old command window, then launch again. |
| The browser did not open | Open `http://localhost:5173` manually while the command window is running. |
| Progress looks empty | Confirm the address is exactly `http://localhost:5173` and that you are in the same browser. Restore a backup if needed. |
| `Node.js is required` | Install the current LTS release from [nodejs.org](https://nodejs.org), then run `Start Recall.cmd` again. |

---

*Your review data stays in your browser. Export a backup before clearing site data or moving to another computer.*
