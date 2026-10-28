import { useMemo } from "react";
import type { Page, Topic } from "../types";
import { dueLabel, formatLongDate, formatShortDate } from "../lib/dates";
import {
  getDueTopics,
  getSuggestedTopics,
  getUpcomingTopics,
  isDueToday,
  isOverdue,
} from "../lib/scheduler";
import { depthClass } from "../lib/ui";
import { Icon } from "./Icon";
import { StatCard } from "./StatCard";

interface DashboardProps {
  topics: Topic[];
  today: string;
  onStartReview: (ids: string[]) => void;
  onStartTopic: (id: string) => void;
  onAddTopic: () => void;
  onNavigate: (page: Page) => void;
}

function MemoryCurve() {
  return (
    <div className="memory-curve">
      <div className="curve-caption">
        <span>Memory</span>
        <span>Five reviews</span>
      </div>
      <svg viewBox="0 0 420 150" role="img" aria-label="A retention curve rising across five reviews">
        <path
          className="curve-grid"
          d="M20 120H400M20 85H400M20 50H400"
        />
        <path
          className="curve-line"
          d="M20 120C72 118 92 92 124 96C160 100 170 68 204 74C242 80 254 48 286 54C326 61 342 32 400 24"
        />
        {[
          [20, 120],
          [124, 96],
          [204, 74],
          [286, 54],
          [400, 24],
        ].map(([x, y], index) => (
          <g key={x}>
            <circle className="curve-dot" cx={x} cy={y} r="5" />
            <text className="curve-label" x={x} y="142" textAnchor="middle">
              {[1, 3, 7, 15, 30][index]}
            </text>
          </g>
        ))}
      </svg>
      <p className="curve-note">Each review makes the next one stick longer.</p>
    </div>
  );
}

export function Dashboard({
  topics,
  today,
  onStartReview,
  onStartTopic,
  onAddTopic,
  onNavigate,
}: DashboardProps) {
  const due = useMemo(() => getDueTopics(topics, today), [topics, today]);
  const dueToday = useMemo(
    () => topics.filter((topic) => isDueToday(topic, today)),
    [topics, today],
  );
  const overdue = useMemo(
    () => topics.filter((topic) => isOverdue(topic, today)),
    [topics, today],
  );
  const learning = useMemo(
    () => topics.filter((topic) => topic.status === "learning"),
    [topics],
  );
  const mastered = useMemo(
    () => topics.filter((topic) => topic.status === "mastered"),
    [topics],
  );
  const upcoming = useMemo(
    () => getUpcomingTopics(topics, today, 7),
    [topics, today],
  );
  const suggestions = useMemo(() => getSuggestedTopics(topics, 3), [topics]);

  const hasDue = due.length > 0;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{formatLongDate(today)}</p>
          <h1>Keep what you learn.</h1>
          <p className="page-lede">
            Review on day 1, 3, 7, 15, and 30. Small repetitions, long memory.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={onAddTopic}>
            <Icon name="plus" size={17} />
            Add topic
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!hasDue}
            onClick={() => onStartReview(due.map((topic) => topic.id))}
          >
            <Icon name="play" size={16} />
            Start review
          </button>
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow eyebrow-light">Today's queue</p>
          <div className="hero-count">
            {due.length}
            {" "}
            <span>{due.length === 1 ? "topic" : "topics"}</span>
          </div>
          <h2>
            {hasDue
              ? due.length === 1
                ? "One topic is ready for review."
                : `${due.length} topics are ready for review.`
              : "Nothing is due right now."}
          </h2>
          <p>
            {hasDue
              ? "Clear the queue while it is small. A short review today saves a long relearning session later."
              : "Start a topic from the library, or enjoy the breathing room. The next review will appear here."}
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-light"
              onClick={() =>
                hasDue
                  ? onStartReview(due.map((topic) => topic.id))
                  : onNavigate("library")
              }
            >
              {hasDue ? "Start review session" : "Browse library"}
              <Icon name="arrowRight" size={17} />
            </button>
            <button
              type="button"
              className="btn btn-ghost-light"
              onClick={() => onNavigate("upcoming")}
            >
              See schedule
            </button>
          </div>
        </div>
        <MemoryCurve />
      </section>

      <div className="stat-grid">
        <StatCard
          icon="target"
          label="Due today"
          value={dueToday.length}
          note="Scheduled for today"
          tone="accent"
        />
        <StatCard
          icon="alert"
          label="Overdue"
          value={overdue.length}
          note={overdue.length === 0 ? "All caught up" : "Needs attention"}
          tone="warning"
        />
        <StatCard
          icon="clock"
          label="In progress"
          value={learning.length}
          note="Active review cycles"
        />
        <StatCard
          icon="check"
          label="Mastered"
          value={mastered.length}
          note="Completed the cycle"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel due-panel">
          <div className="panel-head">
            <div>
              <h2>Due for review</h2>
              <p className="panel-sub">
                {hasDue
                  ? "Oldest reviews first. A card stays here until you review or postpone it."
                  : "Your queue is clear."}
              </p>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => onNavigate("library")}
            >
              Open library
              <Icon name="chevronRight" size={15} />
            </button>
          </div>

          {hasDue ? (
            <div className="due-list">
              {due.map((topic) => (
                <article className="due-item" key={topic.id}>
                  <span
                    className={`due-marker${
                      isOverdue(topic, today) ? " is-overdue" : ""
                    }`}
                    aria-hidden="true"
                  />
                  <div className="due-copy">
                    <div className="due-title-row">
                      <h3>{topic.title}</h3>
                      <span className={`depth-badge ${depthClass(topic.depth)}`}>
                        {topic.depth}
                      </span>
                    </div>
                    <p>
                      {topic.track}
                      {topic.kind === "language" ? " · Language" : ""}
                    </p>
                  </div>
                  <div className="due-side">
                    <span
                      className={`due-date${
                        isOverdue(topic, today) ? " is-overdue" : ""
                      }`}
                    >
                      {dueLabel(topic.nextReview!, today)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={() => onStartReview([topic.id])}
                    >
                      Review
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <span className="empty-icon">
                <Icon name="check" size={22} />
              </span>
              <div>
                <h3>No reviews due.</h3>
                <p>Start a new topic or check the library for something to revisit.</p>
              </div>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={() => onNavigate("library")}
              >
                Browse library
              </button>
            </div>
          )}
        </section>

        <div className="dashboard-side">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Next 7 days</h2>
                <p className="panel-sub">What is coming up.</p>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate("upcoming")}
              >
                View all
              </button>
            </div>
            {upcoming.length > 0 ? (
              <div className="compact-list">
                {upcoming.slice(0, 5).map((topic) => (
                  <div className="compact-item" key={topic.id}>
                    <span className="compact-date">
                      {formatShortDate(topic.nextReview!)}
                    </span>
                    <div className="compact-copy">
                      <strong>{topic.title}</strong>
                      <span>{topic.track}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="small-empty">No reviews scheduled in the next week.</p>
            )}
          </section>

          <section className="panel suggestion-panel">
            <div className="panel-head">
              <div>
                <h2>Start something new</h2>
                <p className="panel-sub">A card from a different track.</p>
              </div>
            </div>
            {suggestions.length > 0 ? (
              <div className="suggestion-list">
                {suggestions.map((topic) => (
                  <div className="suggestion-item" key={topic.id}>
                    <div>
                      <span className="suggestion-track">{topic.track}</span>
                      <strong>{topic.title}</strong>
                    </div>
                    <button
                      type="button"
                      className="icon-button start-button"
                      onClick={() => onStartTopic(topic.id)}
                      aria-label={`Start review cycle for ${topic.title}`}
                      title="Start review cycle"
                    >
                      <Icon name="play" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="small-empty">
                Every topic has been started. Add a custom one if you are learning
                something new.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
