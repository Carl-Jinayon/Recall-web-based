import rawCurriculum from "../data/curriculum.json";
import type { CurriculumData, Topic } from "../types";
import { seedTopic } from "./scheduler";

const data = rawCurriculum as CurriculumData;

export const curriculum = data;
export const curriculumTracks = data.tracks;
export const curriculumCards = data.topics;

export function createSeedTopics(today: string): Topic[] {
  return curriculumCards.map((card) => seedTopic(card, today));
}

export function mergeCurriculum(
  topics: Topic[],
  today: string,
): { topics: Topic[]; added: number } {
  const existing = new Set(topics.map((topic) => topic.id));
  const additions = curriculumCards
    .filter((card) => !existing.has(card.id))
    .map((card) => seedTopic(card, today));

  return { topics: [...topics, ...additions], added: additions.length };
}

export function trackName(trackId: number): string {
  if (trackId === 0) return "Custom";
  return curriculumTracks.find((track) => track.id === trackId)?.name ?? "Custom";
}
