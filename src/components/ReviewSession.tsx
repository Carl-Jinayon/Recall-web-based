import { useEffect, useState } from "react";
import type { Topic } from "../types";
import { nextReviewDay } from "../lib/scheduler";
import { depthClass } from "../lib/ui";
import { Icon } from "./Icon";
import { Modal, ModalHeader } from "./Modal";
import { StageTrack } from "./StageTrack";

type SessionAction = "reviewed" | "postponed" | "mastered";

interface ReviewSessionProps {
  topicIds: string[];
  topics: Topic[];
  onAction: (topicId: string, action: SessionAction) => void;
  onClose: () => void;
}

interface Counts {
  reviewed: number;
  postponed: number;
  mastered: number;
}

export function ReviewSession({
  topicIds,
  topics,
  onAction,
  onClose,
}: ReviewSessionProps) {
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    reviewed: 0,
    postponed: 0,
    mastered: 0,
  });
  const [finished, setFinished] = useState(false);

  const current = topics.find((topic) => topic.id === topicIds[index]);

  const act = (action: SessionAction) => {
    if (!current || finished) return;
    onAction(current.id, action);
    setCounts((previous) => ({
      ...previous,
      [action]: previous[action] + 1,
    }));

    if (index + 1 >= topicIds.length) {
      setFinished(true);
    } else {
      setIndex((value) => value + 1);
      setShowNotes(false);
    }
  };

  useEffect(() => {
    if (finished) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1") act("postponed");
      if (event.key === "2") act("reviewed");
      if (event.key === "3") act("mastered");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!current) return null;

  const stageDay = nextReviewDay(current);
  const isFinal = current.stage === 4;
  const progress = finished ? 100 : (index / topicIds.length) * 100;
  const totalActions = counts.reviewed + counts.postponed + counts.mastered;

  return (
    <Modal open onClose={onClose} size="lg" className="review-modal">
      <div className="session-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <ModalHeader
        eyebrow="Review session"
        title={finished ? "Session complete" : `Card ${index + 1} of ${topicIds.length}`}
        onClose={onClose}
      />

      {finished ? (
        <div className="session-summary">
          <span className="session-summary-icon">
            <Icon name="check" size={30} />
          </span>
          <h2>You showed up.</h2>
          <p>
            {totalActions === 1
              ? "One review is now in the record."
              : `${totalActions} reviews are now in the record.`}{" "}
            The next dates are already scheduled.
          </p>
          <div className="session-stats">
            <div>
              <strong>{counts.reviewed}</strong>
              <span>advanced</span>
            </div>
            <div>
              <strong>{counts.postponed}</strong>
              <span>repeated</span>
            </div>
            <div>
              <strong>{counts.mastered}</strong>
              <span>mastered</span>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Back to dashboard
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      ) : (
        <div className="review-body">
          <div className="review-topic-meta">
            <span className="track-label">
              <span
                className="track-dot"
                style={{ background: "var(--track-color, var(--accent))" }}
              />
              {current.track}
            </span>
            {current.kind === "language" ? (
              <span className="kind-badge">Language</span>
            ) : null}
            <span className={`depth-badge ${depthClass(current.depth)}`}>
              {current.depth}
            </span>
          </div>

          <h2 className="review-title">{current.title}</h2>

          <div className="review-cycle">
            <div className="review-cycle-head">
              <span>
                {isFinal ? "Final review · Day 30" : `Next review · Day ${stageDay}`}
              </span>
              <span>{current.stage} of 5 completed</span>
            </div>
            <StageTrack stage={current.stage} status={current.status} />
            <p>
              {isFinal
                ? "Complete this review to finish the cycle and mark the card mastered."
                : "Reviewing early is allowed. The remaining intervals shift from today."}
            </p>
          </div>

          {current.notes ? (
            <div className={`review-notes${showNotes ? " is-open" : ""}`}>
              <button
                type="button"
                className="notes-toggle"
                onClick={() => setShowNotes((value) => !value)}
              >
                <span className="notes-toggle-copy">
                  <Icon name="library" size={17} />
                  <span>
                    <strong>{showNotes ? "Hide notes" : "Reveal notes"}</strong>
                    <small>
                      {showNotes
                        ? "Close the notes and try to recall the idea again."
                        : "Try to recall the idea before you look."}
                    </small>
                  </span>
                </span>
                <Icon
                  name={showNotes ? "chevronLeft" : "chevronRight"}
                  size={17}
                />
              </button>
              {showNotes ? <p className="notes-body">{current.notes}</p> : null}
            </div>
          ) : (
            <p className="review-no-notes">
              No notes for this card. Recall what you can, then choose the next step.
            </p>
          )}

          <div className="review-actions">
            <button
              type="button"
              className="review-action review-action-muted"
              onClick={() => act("postponed")}
            >
              <span className="review-action-icon">
                <Icon name="rotate" size={19} />
              </span>
              <span>
                <strong>Again tomorrow</strong>
                <small>Keep the same stage</small>
              </span>
              <kbd>1</kbd>
            </button>
            <button
              type="button"
              className="review-action review-action-primary"
              onClick={() => act("reviewed")}
            >
              <span className="review-action-icon">
                <Icon name="check" size={19} />
              </span>
              <span>
                <strong>{isFinal ? "Finish cycle" : "Reviewed"}</strong>
                <small>{isFinal ? "Mark as mastered" : "Move to the next interval"}</small>
              </span>
              <kbd>2</kbd>
            </button>
            <button
              type="button"
              className="review-action review-action-quiet"
              onClick={() => act("mastered")}
            >
              <span className="review-action-icon">
                <Icon name="spark" size={19} />
              </span>
              <span>
                <strong>Mastered now</strong>
                <small>Skip the remaining reviews</small>
              </span>
              <kbd>3</kbd>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
