import { useMemo } from "react";
import type { Page, Topic } from "../types";
import {
  formatShortDate,
  parseDate,
  relativeActivityDate,
} from "../lib/dates";
import {
  getDailyReviewCounts,
  getDueTopics,
  getProgressPercent,
  getRecentActivity,
  getReviewCount,
  getStreak,
  getTrackStats,
} from "../lib/scheduler";
import { actionLabel, trackColor } from "../lib/ui";
import { Icon, type IconName } from "./Icon";
import { StatCard } from "./StatCard";

interface ProgressProps {
  topics: Topic[];
  today: string;
  onNavigate: (page: Page) => void;
  onStartReview: (ids: string[]) => void;
}

function activityIcon(type: string): IconName {
  if (type === "mastered") return "spark";
  if (type === "postponed") return "rotate";
  if (type === "started") return "play";
  if (type === "restarted") return "refresh";
  return "check";
}

export function Progress({
  topics,
  today,
  onNavigate,
  onStartReview,
}: ProgressProps) {
  const mastered = topics.filter((topic) => topic.status === "mastered");
  const learning = topics.filter((topic) => topic.status === "learning");
  const notStarted = topics.filter((topic) => topic.status === "not-started");
  const due = getDueTopics(topics, today);
  const percent = getProgressPercent(topics);
  const reviews = getReviewCount(topics);
  const streak = getStreak(topics, today);
  const trackStats = getTrackStats(topics, today);
  const recent = getRecentActivity(topics, 10);
  const daily = useMemo(
    () => getDailyReviewCounts(topics, today, 14),
    [topics, today],
  );
  const maxDaily = Math.max(1, ...daily.map((day) => day.count));
  const totalReviews = daily.reduce((total, day) => total + day.count, 0);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Progress</p>
          <h1>Evidence of repetition.</h1>
          <p className="page-lede">
            Mastery is a record of completed cycles, not a feeling. These numbers
            come from actual reviews.
          </p>
        </div>
        <div className="page-actions">
          {due.length > 0 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onStartReview(due.map((topic) => topic.id))}
            >
              <Icon name="play" size={16} />
              Review {due.length} due
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate("library")}
            >
              Browse library
            </button>
          )}
        </div>
      </header>

      <div className="progress-top">
        <section className="mastery-card">
          <div
            className="mastery-ring"
            style={{
              background: `conic-gradient(var(--accent) ${percent}%, var(--border) 0)`,
            }}
            role="img"
            aria-label={`${percent} percent of topics mastered`}
          >
            <div className="mastery-ring-inner">
              <strong>{percent}%</strong>
              <span>mastered</span>
            </div>
          </div>
          <div className="mastery-copy">
            <p className="eyebrow">Overall</p>
            <h2>{mastered.length} of {topics.length} cards</h2>
            <p>
              {learning.length} in progress · {notStarted.length} not started ·{" "}
              {due.length} due now
            </p>
          </div>
        </section>

        <div className="progress-stats">
          <StatCard
            icon="check"
            label="Reviews completed"
            value={reviews}
            note="Across every card"
            tone="accent"
          />
          <StatCard
            icon="spark"
            label="Day streak"
            value={streak}
            note={streak === 0 ? "Review today to begin" : "Keep it going"}
          />
          <StatCard
            icon="clock"
            label="In progress"
            value={learning.length}
            note="Active cycles"
          />
          <StatCard
            icon="layers"
            label="Not started"
            value={notStarted.length}
            note="Waiting in the library"
          />
        </div>
      </div>

      <div className="progress-grid">
        <section className="panel track-progress-panel">
          <div className="panel-head">
            <div>
              <h2>Progress by track</h2>
              <p className="panel-sub">
                Mastered cards count toward completion; learning cards are underway.
              </p>
            </div>
          </div>
          <div className="track-progress-list">
            {trackStats.map((track) => {
              const masteredPercent = track.total
                ? (track.mastered / track.total) * 100
                : 0;
              const learningPercent = track.total
                ? (track.learning / track.total) * 100
                : 0;
              return (
                <div className="track-progress" key={track.id}>
                  <div className="track-progress-head">
                    <span className="track-label">
                      <span
                        className="track-dot"
                        style={{ background: trackColor(track.id) }}
                      />
                      {track.name}
                    </span>
                    <span className="track-fraction">
                      {track.mastered}/{track.total}
                    </span>
                  </div>
                  <div className="progress-bar" aria-hidden="true">
                    <span
                      className="progress-mastered"
                      style={{ width: `${masteredPercent}%` }}
                    />
                    <span
                      className="progress-learning"
                      style={{ width: `${learningPercent}%` }}
                    />
                  </div>
                  <div className="track-progress-meta">
                    <span>{track.learning} learning</span>
                    <span>{track.notStarted} not started</span>
                    {track.due > 0 ? (
                      <span className="is-due">{track.due} due</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h2>Recent activity</h2>
              <p className="panel-sub">The last few actions on your cards.</p>
            </div>
          </div>
          {recent.length > 0 ? (
            <div className="activity-list">
              {recent.map(({ topic, event }) => (
                <div className="activity-item" key={event.id}>
                  <span className={`activity-icon activity-${event.type}`}>
                    <Icon name={activityIcon(event.type)} size={15} />
                  </span>
                  <div className="activity-copy">
                    <strong>{topic.title}</strong>
                    <span>
                      {actionLabel(event.type)} ·{" "}
                      {relativeActivityDate(event.date, today)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="small-empty">
              No activity yet. Start a card or complete a review to see it here.
            </p>
          )}
        </section>
      </div>

      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h2>Review activity</h2>
            <p className="panel-sub">
              {totalReviews} review{totalReviews === 1 ? "" : "s"} in the last 14
              days.
            </p>
          </div>
        </div>
        <div className="mini-chart">
          {daily.map((day) => (
            <div
              className="chart-column"
              key={day.date}
              title={`${formatShortDate(day.date)}: ${day.count} review${
                day.count === 1 ? "" : "s"
              }`}
            >
              <span className="chart-value">{day.count > 0 ? day.count : ""}</span>
              <div className="chart-track">
                <span
                  className={`chart-bar${day.count > 0 ? " has-value" : ""}`}
                  style={{
                    height: `${Math.max(4, (day.count / maxDaily) * 100)}%`,
                  }}
                />
              </div>
              <span className="chart-label">{parseDate(day.date).getDate()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
