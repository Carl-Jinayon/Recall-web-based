import { describe, expect, it } from "vitest";
import type { Topic } from "../types";
import { addDays, daysBetween } from "./dates";
import {
  INTERVALS,
  completeReview,
  createTopic,
  getDailyReviewCounts,
  getDueTopics,
  getReviewCount,
  getStreak,
  isDue,
  masterTopic,
  nextReviewDay,
  postponeReview,
  restartCycle,
  startCycle,
} from "./scheduler";

const today = "2026-10-28";

function topic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: "topic-1",
    title: "Testing",
    trackId: 9,
    track: "Software Engineering Practice",
    depth: "WORKING",
    notes: "",
    kind: "topic",
    source: "curriculum",
    createdAt: today,
    stage: 0,
    status: "not-started",
    history: [],
    ...overrides,
  };
}

describe("dates", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-28", 3)).toBe("2026-10-31");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(daysBetween("2026-10-28", "2026-11-04")).toBe(7);
  });
});

describe("review cycle", () => {
  it("starts with the first review one day later", () => {
    const started = startCycle(topic(), today);
    expect(started.status).toBe("learning");
    expect(started.nextReview).toBe(addDays(today, INTERVALS[0]));
    expect(nextReviewDay(started)).toBe(1);
    expect(isDue(started, today)).toBe(false);
  });

  it("advances through the 1/3/7/15/30 cycle", () => {
    let current = startCycle(topic(), today);
    const dueDates: string[] = [];

    for (let index = 0; index < INTERVALS.length; index += 1) {
      const reviewDate = current.nextReview!;
      dueDates.push(reviewDate);
      current = completeReview(current, reviewDate);
    }

    expect(dueDates).toEqual([
      "2026-10-29",
      "2026-10-31",
      "2026-11-04",
      "2026-11-12",
      "2026-11-27",
    ]);
    expect(current.stage).toBe(5);
    expect(current.status).toBe("mastered");
    expect(current.nextReview).toBeUndefined();
  });

  it("shifts future reviews when a review is completed late", () => {
    let current = startCycle(topic(), today);
    current = completeReview(current, "2026-11-02");
    expect(current.stage).toBe(1);
    expect(current.nextReview).toBe("2026-11-04");
  });

  it("postpones the same stage until tomorrow", () => {
    const started = startCycle(topic(), today);
    const postponed = postponeReview(started, "2026-11-05");
    expect(postponed.stage).toBe(0);
    expect(postponed.nextReview).toBe("2026-11-06");
    expect(postponed.history.at(-1)?.type).toBe("postponed");
  });

  it("marks a topic as mastered immediately", () => {
    const started = startCycle(topic(), today);
    const mastered = masterTopic(started, today);
    expect(mastered.status).toBe("mastered");
    expect(mastered.stage).toBe(5);
    expect(mastered.nextReview).toBeUndefined();
  });

  it("restarts a mastered topic at stage zero", () => {
    const mastered = masterTopic(startCycle(topic(), today), today);
    const restarted = restartCycle(mastered, "2026-12-01");
    expect(restarted.status).toBe("learning");
    expect(restarted.stage).toBe(0);
    expect(restarted.nextReview).toBe("2026-12-02");
    expect(restarted.masteredAt).toBeUndefined();
  });

  it("returns only topics due today or earlier, sorted by date", () => {
    const overdue = startCycle(topic({ id: "a", title: "Overdue" }), "2026-10-20");
    const dueToday = startCycle(
      topic({ id: "b", title: "Due today" }),
      "2026-10-27",
    );
    const future = startCycle(topic({ id: "c", title: "Future" }), today);

    expect(getDueTopics([future, dueToday, overdue], today).map((t) => t.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("counts consecutive review days, allowing yesterday to keep the streak", () => {
    const reviewed = topic({
      history: [
        {
          id: "1",
          date: "2026-10-27",
          at: "2026-10-27T10:00:00.000Z",
          type: "reviewed",
          stage: 1,
        },
        {
          id: "2",
          date: "2026-10-28",
          at: "2026-10-28T10:00:00.000Z",
          type: "reviewed",
          stage: 2,
        },
      ],
    });
    expect(getStreak([reviewed], today)).toBe(2);
  });

  it("does not count postponements or manual mastery as reviews", () => {
    const mixed = topic({
      history: [
        {
          id: "1",
          date: today,
          at: "2026-10-28T09:00:00.000Z",
          type: "reviewed",
          stage: 1,
        },
        {
          id: "2",
          date: today,
          at: "2026-10-28T10:00:00.000Z",
          type: "postponed",
          stage: 1,
        },
        {
          id: "3",
          date: today,
          at: "2026-10-28T11:00:00.000Z",
          type: "mastered",
          stage: 5,
        },
      ],
    });
    expect(getReviewCount([mixed])).toBe(1);
    expect(getStreak([mixed], today)).toBe(1);
    expect(getDailyReviewCounts([mixed], today, 1)[0].count).toBe(1);
  });
});

describe("custom topic creation", () => {
  it("can create a topic without starting the cycle", () => {
    const created = createTopic(
      {
        title: "Custom topic",
        trackId: 0,
        track: "Custom",
        depth: "WORKING",
        notes: "A note",
        startNow: false,
        startDate: today,
        source: "custom",
        kind: "topic",
      },
      today,
      false,
    );
    expect(created.status).toBe("not-started");
    expect(created.history).toHaveLength(0);
    expect(created.source).toBe("custom");
  });
});
