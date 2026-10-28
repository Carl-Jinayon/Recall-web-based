import { useMemo, useState } from "react";
import type { Topic } from "../types";
import { daysBetween, formatWeekdayDate } from "../lib/dates";
import { getUpcomingTopics } from "../lib/scheduler";
import { depthClass, trackColor } from "../lib/ui";
import { Icon } from "./Icon";

interface UpcomingProps {
  topics: Topic[];
  today: string;
  onStartReview: (ids: string[]) => void;
}

const ranges = [7, 30, 90] as const;
type Range = (typeof ranges)[number];

export function Upcoming({ topics, today, onStartReview }: UpcomingProps) {
  const [range, setRange] = useState<Range>(30);

  const upcoming = useMemo(
    () => getUpcomingTopics(topics, today, range),
    [topics, today, range],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Topic[]>();
    for (const topic of upcoming) {
      const date = topic.nextReview!;
      const group = map.get(date) ?? [];
      group.push(topic);
      map.set(date, group);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [upcoming]);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Schedule</p>
          <h1>What comes next.</h1>
          <p className="page-lede">
            Every active review cycle, ordered by its next due date. Reviewing early
            is allowed; the following date shifts from the day you review.
          </p>
        </div>
        <div className="range-switch" role="group" aria-label="Upcoming range">
          {ranges.map((value) => (
            <button
              key={value}
              type="button"
              className={range === value ? "is-active" : ""}
              onClick={() => setRange(value)}
            >
              {value} days
            </button>
          ))}
        </div>
      </header>

      <div className="schedule-summary">
        <div>
          <span className="summary-label">Scheduled</span>
          <strong>{upcoming.length}</strong>
          <span className="summary-note">
            {upcoming.length === 1 ? "review" : "reviews"} in the next {range} days
          </span>
        </div>
        <div className="schedule-rule">
          <Icon name="clock" size={18} />
          <p>
            After each review, the next gap follows the cycle: 1 → 3 → 7 → 15 → 30.
            A late review moves the remaining schedule forward instead of piling up.
          </p>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="upcoming-list">
          {groups.map(([date, items]) => {
            const difference = daysBetween(today, date);
            return (
              <section className="upcoming-group" key={date}>
                <div className="upcoming-date">
                  <strong>{formatWeekdayDate(date)}</strong>
                  <span>{difference === 1 ? "Tomorrow" : `In ${difference} days`}</span>
                </div>
                <div className="upcoming-items">
                  {items.map((topic) => (
                    <article className="upcoming-item" key={topic.id}>
                      <span
                        className="track-dot"
                        style={{ background: trackColor(topic.trackId) }}
                        aria-hidden="true"
                      />
                      <div className="upcoming-copy">
                        <strong>{topic.title}</strong>
                        <span>{topic.track}</span>
                      </div>
                      <span className={`depth-badge ${depthClass(topic.depth)}`}>
                        {topic.depth}
                      </span>
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => onStartReview([topic.id])}
                      >
                        Review early
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="empty-state panel">
          <span className="empty-icon">
            <Icon name="calendar" size={22} />
          </span>
          <div>
            <h3>No reviews in this window.</h3>
            <p>
              Start or review a topic and its next date will appear here. You can
              also extend the range.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
