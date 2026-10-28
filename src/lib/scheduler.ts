import type {
  ActivityItem,
  CurriculumCard,
  ReviewAction,
  ReviewEvent,
  Topic,
  TopicDraft,
  TrackStat,
} from "../types";
import { addDays, daysBetween } from "./dates";

export const INTERVALS = [1, 3, 7, 15, 30] as const;
export const REVIEWS_PER_CYCLE = INTERVALS.length;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeEvent(type: ReviewAction, stage: number, date: string): ReviewEvent {
  return {
    id: makeId(),
    date,
    at: new Date().toISOString(),
    type,
    stage,
  };
}

export function createTopic(
  card: CurriculumCard | (TopicDraft & { source: "custom"; kind: "topic" }),
  createdAt: string,
  startNow: boolean,
): Topic {
  const topic: Topic = {
    id: "source" in card ? `custom-${makeId()}` : card.id,
    title: card.title,
    trackId: card.trackId,
    track: card.track,
    depth: card.depth,
    notes: card.notes,
    kind: card.kind,
    source: "source" in card ? "custom" : "curriculum",
    createdAt,
    stage: 0,
    status: "not-started",
    history: [],
  };

  return startNow ? startCycle(topic, createdAt) : topic;
}

export function seedTopic(card: CurriculumCard, today: string): Topic {
  return createTopic(card, today, false);
}

export function startCycle(topic: Topic, startDate: string): Topic {
  return {
    ...topic,
    status: "learning",
    startedAt: startDate,
    nextReview: addDays(startDate, INTERVALS[0]),
    stage: 0,
    masteredAt: undefined,
    history: [...topic.history, makeEvent("started", 0, startDate)],
  };
}

export function restartCycle(topic: Topic, startDate: string): Topic {
  return {
    ...topic,
    status: "learning",
    startedAt: startDate,
    nextReview: addDays(startDate, INTERVALS[0]),
    stage: 0,
    masteredAt: undefined,
    history: [...topic.history, makeEvent("restarted", 0, startDate)],
  };
}

export function completeReview(topic: Topic, date: string): Topic {
  if (topic.status !== "learning" || topic.stage >= REVIEWS_PER_CYCLE) {
    return topic;
  }

  const isFinalReview = topic.stage === REVIEWS_PER_CYCLE - 1;
  const nextStage = topic.stage + 1;
  const nextReview = isFinalReview
    ? undefined
    : addDays(date, INTERVALS[nextStage] - INTERVALS[topic.stage]);

  return {
    ...topic,
    stage: nextStage,
    status: isFinalReview ? "mastered" : "learning",
    nextReview,
    masteredAt: isFinalReview ? date : undefined,
    history: [...topic.history, makeEvent("reviewed", nextStage, date)],
  };
}

export function postponeReview(topic: Topic, date: string): Topic {
  if (topic.status !== "learning") return topic;

  return {
    ...topic,
    nextReview: addDays(date, 1),
    history: [...topic.history, makeEvent("postponed", topic.stage, date)],
  };
}

export function masterTopic(topic: Topic, date: string): Topic {
  if (topic.status === "mastered") return topic;

  return {
    ...topic,
    stage: REVIEWS_PER_CYCLE,
    status: "mastered",
    nextReview: undefined,
    masteredAt: date,
    history: [...topic.history, makeEvent("mastered", REVIEWS_PER_CYCLE, date)],
  };
}

export function nextReviewDay(topic: Topic): number | null {
  return topic.stage < REVIEWS_PER_CYCLE ? INTERVALS[topic.stage] : null;
}

export function isDue(topic: Topic, today: string): boolean {
  return (
    topic.status === "learning" &&
    Boolean(topic.nextReview) &&
    topic.nextReview! <= today
  );
}

export function isOverdue(topic: Topic, today: string): boolean {
  return (
    topic.status === "learning" &&
    Boolean(topic.nextReview) &&
    topic.nextReview! < today
  );
}

export function isDueToday(topic: Topic, today: string): boolean {
  return topic.status === "learning" && topic.nextReview === today;
}

export function sortByDue(topics: Topic[]): Topic[] {
  return [...topics].sort((a, b) => {
    if (a.nextReview && b.nextReview && a.nextReview !== b.nextReview) {
      return a.nextReview.localeCompare(b.nextReview);
    }
    return a.title.localeCompare(b.title);
  });
}

export function getDueTopics(topics: Topic[], today: string): Topic[] {
  return sortByDue(topics.filter((topic) => isDue(topic, today)));
}

export function getUpcomingTopics(
  topics: Topic[],
  today: string,
  days: number,
): Topic[] {
  return sortByDue(
    topics.filter((topic) => {
      if (topic.status !== "learning" || !topic.nextReview) return false;
      const difference = daysBetween(today, topic.nextReview);
      return difference > 0 && difference <= days;
    }),
  );
}

export function getTrackStats(topics: Topic[], today: string): TrackStat[] {
  const map = new Map<number, TrackStat>();

  for (const topic of topics) {
    const current = map.get(topic.trackId) ?? {
      id: topic.trackId,
      name: topic.track,
      total: 0,
      learning: 0,
      mastered: 0,
      notStarted: 0,
      due: 0,
    };

    current.total += 1;
    if (topic.status === "learning") current.learning += 1;
    if (topic.status === "mastered") current.mastered += 1;
    if (topic.status === "not-started") current.notStarted += 1;
    if (isDue(topic, today)) current.due += 1;

    map.set(topic.trackId, current);
  }

  return [...map.values()].sort((a, b) => a.id - b.id);
}

export function getStreak(topics: Topic[], today: string): number {
  const reviewedDates = new Set(
    topics.flatMap((topic) =>
      topic.history
        .filter((event) => event.type === "reviewed")
        .map((event) => event.date),
    ),
  );

  let cursor = today;
  if (!reviewedDates.has(cursor)) {
    cursor = addDays(today, -1);
  }

  let streak = 0;
  while (reviewedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getReviewCount(topics: Topic[]): number {
  return topics.reduce(
    (total, topic) =>
      total + topic.history.filter((event) => event.type === "reviewed").length,
    0,
  );
}

export function getRecentActivity(
  topics: Topic[],
  limit = 12,
): ActivityItem[] {
  return topics
    .flatMap((topic) =>
      topic.history
        .filter((event) =>
          ["reviewed", "postponed", "mastered", "started", "restarted"].includes(
            event.type,
          ),
        )
        .map((event) => ({ topic, event })),
    )
    .sort((a, b) => b.event.at.localeCompare(a.event.at))
    .slice(0, limit);
}

export function getDailyReviewCounts(
  topics: Topic[],
  today: string,
  days = 14,
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const topic of topics) {
    for (const event of topic.history) {
      if (event.type !== "reviewed") continue;
      counts.set(event.date, (counts.get(event.date) ?? 0) + 1);
    }
  }

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - (days - 1));
    return { date, count: counts.get(date) ?? 0 };
  });
}

export function getProgressPercent(topics: Topic[]): number {
  if (topics.length === 0) return 0;
  const mastered = topics.filter((topic) => topic.status === "mastered").length;
  return Math.round((mastered / topics.length) * 100);
}

export function getSuggestedTopics(topics: Topic[], limit = 3): Topic[] {
  const notStarted = topics.filter((topic) => topic.status === "not-started");
  const byTrack = new Map<number, Topic[]>();

  for (const topic of notStarted) {
    const group = byTrack.get(topic.trackId) ?? [];
    group.push(topic);
    byTrack.set(topic.trackId, group);
  }

  const suggestions: Topic[] = [];
  for (const group of byTrack.values()) {
    if (group[0]) suggestions.push(group[0]);
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}
