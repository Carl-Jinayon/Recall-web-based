import type { CSSProperties } from "react";
import type { Topic } from "../types";
import { dueLabel, formatShortDate } from "../lib/dates";
import { isDue } from "../lib/scheduler";
import { depthClass, trackColor } from "../lib/ui";
import { Icon } from "./Icon";
import { StageTrack } from "./StageTrack";

interface TopicCardProps {
  topic: Topic;
  today: string;
  onReview: (id: string) => void;
  onStart: (id: string) => void;
  onRestart: (id: string) => void;
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
}

export function TopicCard({
  topic,
  today,
  onReview,
  onStart,
  onRestart,
  onEdit,
  onDelete,
}: TopicCardProps) {
  const due = isDue(topic, today);
  const isFinalReview = topic.stage === 4;

  let actionLabel = "Start cycle";
  let action = () => onStart(topic.id);
  let actionClass = "btn-secondary";

  if (topic.status === "learning") {
    actionLabel = due ? (isFinalReview ? "Finish cycle" : "Review") : "Review early";
    action = () => onReview(topic.id);
    actionClass = due ? "btn-primary" : "btn-secondary";
  }

  if (topic.status === "mastered") {
    actionLabel = "Restart cycle";
    action = () => onRestart(topic.id);
    actionClass = "btn-secondary";
  }

  const statusText =
    topic.status === "mastered"
      ? `Mastered${topic.masteredAt ? ` · ${formatShortDate(topic.masteredAt)}` : ""}`
      : topic.status === "not-started"
        ? "Not started"
        : dueLabel(topic.nextReview!, today);

  return (
    <article
      className="topic-card"
      style={{ "--track-color": trackColor(topic.trackId) } as CSSProperties}
    >
      <div className="topic-card-top">
        <div className="topic-meta">
          <span className="track-label">
            <span className="track-dot" />
            {topic.track}
          </span>
          {topic.kind === "language" ? (
            <span className="kind-badge">Language</span>
          ) : null}
          <span className={`depth-badge ${depthClass(topic.depth)}`}>
            {topic.depth}
          </span>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => onEdit(topic)}
            aria-label={`Edit ${topic.title}`}
            title="Edit"
          >
            <Icon name="pencil" size={15} />
          </button>
          <button
            type="button"
            className="icon-button danger-hover"
            onClick={() => onDelete(topic)}
            aria-label={`Delete ${topic.title}`}
            title="Delete"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>

      <h3>{topic.title}</h3>
      <p className={`topic-notes${topic.notes ? "" : " is-empty"}`}>
        {topic.notes || "No notes for this card."}
      </p>

      <StageTrack
        stage={topic.stage}
        status={topic.status}
        compact
      />

      <div className="topic-card-footer">
        <span
          className={`topic-status${
            due ? " is-due" : topic.status === "mastered" ? " is-mastered" : ""
          }`}
        >
          {statusText}
        </span>
        <button type="button" className={`btn btn-small ${actionClass}`} onClick={action}>
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
