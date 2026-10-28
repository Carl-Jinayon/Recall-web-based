import type { StoredState, Theme, Topic } from "../types";
import { createSeedTopics } from "./curriculum";
import { todayISO } from "./dates";

const STORAGE_KEY = "recall.state.v1";

function defaultTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

function isTopic(value: unknown): value is Topic {
  if (!value || typeof value !== "object") return false;
  const topic = value as Partial<Topic>;
  return (
    typeof topic.id === "string" &&
    typeof topic.title === "string" &&
    typeof topic.trackId === "number" &&
    typeof topic.track === "string" &&
    typeof topic.depth === "string" &&
    typeof topic.notes === "string" &&
    (topic.kind === "topic" || topic.kind === "language") &&
    (topic.source === "curriculum" || topic.source === "custom") &&
    typeof topic.createdAt === "string" &&
    typeof topic.stage === "number" &&
    (topic.status === "not-started" ||
      topic.status === "learning" ||
      topic.status === "mastered") &&
    Array.isArray(topic.history)
  );
}

export { isTopic as isStoredTopic };

export function loadState(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (
        parsed.version === 1 &&
        Array.isArray(parsed.topics) &&
        parsed.topics.every(isTopic)
      ) {
        return {
          version: 1,
          topics: parsed.topics,
          theme: parsed.theme === "dark" ? "dark" : "light",
        };
      }
    }
  } catch {
    // Fall through to a fresh state if local storage is unavailable or corrupt.
  }

  const today = todayISO();
  return {
    version: 1,
    topics: createSeedTopics(today),
    theme: defaultTheme(),
  };
}

export function saveState(state: StoredState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local storage can be unavailable in private or restricted contexts.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else to do.
  }
}

export { STORAGE_KEY };
