export type TopicStatus = "not-started" | "learning" | "mastered";
export type TopicKind = "topic" | "language";
export type TopicSource = "curriculum" | "custom";
export type Theme = "light" | "dark";
export type Page = "dashboard" | "library" | "upcoming" | "progress" | "settings";
export type ReviewAction = "reviewed" | "postponed" | "mastered" | "started" | "restarted";

export interface ReviewEvent {
  id: string;
  date: string;
  at: string;
  type: ReviewAction;
  stage: number;
}

export interface Topic {
  id: string;
  title: string;
  trackId: number;
  track: string;
  depth: string;
  notes: string;
  kind: TopicKind;
  source: TopicSource;
  createdAt: string;
  startedAt?: string;
  nextReview?: string;
  stage: number;
  status: TopicStatus;
  masteredAt?: string;
  history: ReviewEvent[];
}

export interface CurriculumTrack {
  id: number;
  name: string;
}

export interface CurriculumCard {
  id: string;
  title: string;
  trackId: number;
  track: string;
  depth: string;
  notes: string;
  kind: TopicKind;
}

export interface CurriculumData {
  source: string;
  importedAt: string;
  tracks: CurriculumTrack[];
  topics: CurriculumCard[];
}

export interface StoredState {
  version: 1;
  topics: Topic[];
  theme: Theme;
}

export interface TopicDraft {
  title: string;
  trackId: number;
  track: string;
  depth: string;
  notes: string;
  startNow: boolean;
  startDate: string;
}

export interface TrackStat {
  id: number;
  name: string;
  total: number;
  learning: number;
  mastered: number;
  notStarted: number;
  due: number;
}

export interface ActivityItem {
  topic: Topic;
  event: ReviewEvent;
}
