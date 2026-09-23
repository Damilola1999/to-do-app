# To-Do List

A modern, offline-capable task manager built with **React 19** + **Vite** and styled with a single CSS file. It supports task checklists, nested subtasks, fuzzy search, a stats summary, a dark/light theme toggle (with persisted preference), and a little celebration with confetti when everything is done.

---

## Features

- **Live date & time** in the header (updates every second).
- **Add / edit tasks** from an inline form (title + start/end time).
- **Checkboxes** to mark tasks done (strikethrough + green styling).
- **Task deletion** with a trash button.
- **Subtasks / checklists** — expand any task to add, check, and remove subtasks.
- **Stats summary** — bold "Done" / "Undone" counters in the header.
- **Notification badge** — the bell shows the number of incomplete tasks.
- **Fuzzy search** — a gap/subsequence matcher filters tasks by title *or* subtask title.
- **Dark / light mode** toggle with a persisted preference saved to `localStorage` (respects the OS theme on first load).
- **Celebration overlay** — when all tasks are complete, a confetti animation and "All Done!" popup appear (with a close button to dismiss).

---

## Tech Stack

| Tool | Purpose |
| --- | --- |
| React 19 | UI framework |
| Vite 8 | Dev server & build tool |
| TypeScript 6 | Type checking |
| oxlint | Linter |
| lucide-react | Icons |

---

## Project Structure

```
to-do/
├── public/
├── src/
│   ├── App.tsx       # Root component, renders <TodoApp />
│   ├── TodoApp.tsx   # The whole application: state, logic, JSX
│   ├── index.css     # All styles (light + dark) and animations
│   └── main.tsx      # React entrypoint (mounts <App /> into #root)
├── index.css         # global reset & base styles
├── vite.config.ts
├── tsconfig*.json
├── package.json
└── README.md
```

---

## Scripts

```bash
npm run dev     # start the Vite dev server
npm run build   # typecheck (tsc) + production build (vite)
npm run lint    # run oxlint
npm run preview # preview the production build locally
```

---

## Every Attribute / State (in `TodoApp.tsx`)

### Data model

```ts
interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  startTime: string
  endTime: string
  completed: boolean
  subtasks: Subtask[]
}
```

### Component state

| State | Initial value | Description |
| --- | --- | --- |
| `tasks` | `[]` | The master list of `Task` objects (persisted only in memory during the session). |
| `showAddForm` | `false` | Toggles the "Add New" task form vs. the "Add New" button. |
| `newTaskTitle` | `''` | Controlled value of the new-task title input. |
| `newTaskStartTime` | `''` | Controlled value of the new-task start time (`HH:MM`). |
| `newTaskEndTime` | `''` | Controlled value of the new-task end time (`HH:MM`). |
| `currentDate` | `new Date()` | Live timestamp, refreshed every second for the header. |
| `searchQuery` | `''` | Controlled value of the fuzzy search input. |
| `expandedTask` | `null` | ID of the task whose subtask checklist is expanded (`null` = none). |
| `subtaskInput` | `''` | Controlled value of the "add subtask" input. |
| `dismissed` | `false` | Whether the user dismissed the "All Done!" celebration (prevents re-showing while still complete). |
| `darkMode` | (derived) | `true`/`false` — initialized from `localStorage.theme`, falling back to the OS `prefers-color-scheme` setting. |

### Derived values

| Value | How it's computed | Used for |
| --- | --- | --- |
| `completedCount` | `tasks.filter(t => t.completed).length` | Done counter + header title. |
| `undoneCount` | `tasks.length - completedCount` | Undone counter, notification badge. |
| `allDone` | `tasks.length > 0 && completedCount === tasks.length` | Deciding when to celebrate. |
| `showCelebration` | `allDone && !dismissed` | Mounting the celebration overlay. |
| `filteredTasks` | `useMemo` over `fuzzyMatch` on title or any subtask title | Rendering the visible list + the "X of Y shown" counter. |

### Module-level helper

```ts
fuzzyMatch(text, query)
```

A dependency-free **subsequence matcher**. It lowercases both strings and returns `true` if every character of `query` appears in `text` in order (gaps allowed), so e.g. searching `"mtn"` matches `"Meeting on work"`. An empty query matches everything.

---

## Key Handlers

| Handler | What it does |
| --- | --- |
| `toggleTask(id)` | Flips a task's `completed` flag; resets the celebration-dismiss flag when the list is no longer fully done. |
| `handleAddTask()` | Creates a new `Task` (with `completed: false` and `subtasks: []`) and appends it, then resets the add form. |
| `deleteTask(id)` | Removes a task and resets the celebration-dismiss flag. |
| `toggleExpand(id)` | Opens/closes the subtask checklist for a task. |
| `addSubtask(taskId)` | Appends a subtask to the expanded task. |
| `toggleSubtask(taskId, subtaskId)` | Toggles a subtask's `completed` flag. |
| `deleteSubtask(taskId, subtaskId)` | Removes a subtask. |
| `toggleDarkMode()` | Flips `darkMode`, which the effect below persists. |

### Side effects (`useEffect`)

1. **Theme effect** — toggles the `dark` class on `<html>` and writes `"dark"` / `"light"` to `localStorage.theme` whenever `darkMode` changes.
2. **Clock effect** — schedules a 1-second timeout to bump `currentDate`, keeping the header time live.

---

## Layout Notes

- **Header row (left → right):** Dark/Light toggle → centered live date & time → notification bell (with undone-count badge).
- **Header cards:** a "Tasks" summary card (total count).
- **Stats bar:** bold "Done" (green) and "Undone" (amber) counters.
- **Add New:** a centered, width-capped button that reveals a compact form (title + start/end time + Add/Cancel).
- **Tasks list:** a vertical timeline (`.timeline-line` + `.timeline-dot`) with each task as a card; completed tasks are green-accented and strikethrough.
- **Search:** sits above the list with a "X of Y tasks shown" counter and an empty-state message when nothing matches.

---

## Theme Colors

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#F9FAFB` / `#FFFFFF` | `#0F172A` |
| Text | `#1F2937` | `#F1F5F9` |
| Secondary text | `#6B7280` | `#94A3B8` |
| Borders / dividers | `#E5E7EB` | `#334155` |
| Primary accent | `#2563EB` (blue) | `#4F46E5` (indigo) |
| Success / completed | `#10B981` (green) | `#34D399` |
| Warning / high priority | `#F59E0B` / `#EF4444` | `#FB923C` / `#EF4444` |

---

## Celebration

When every task is marked complete:
- A fixed full-screen overlay appears with a **`party-popper`** ring animation and **60 randomized confetti pieces** that fall and spin.
- A centered card shows **"All Done!"**.
- A close (×) button in the corner lets the user dismiss it (`setDismissed(true)`).
- Dismissing while still complete keeps it hidden; marking any task incomplete re-enables it for the next full completion.
