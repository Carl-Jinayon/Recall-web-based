import type { TopicStatus } from "../types";
import { INTERVALS } from "../lib/scheduler";

interface StageTrackProps {
  stage: number;
  status: TopicStatus;
  compact?: boolean;
}

export function StageTrack({ stage, status, compact = false }: StageTrackProps) {
  return (
    <div
      className={`stage-track${compact ? " is-compact" : ""}`}
      aria-label={`Review cycle: ${stage} of ${INTERVALS.length} reviews complete`}
    >
      {INTERVALS.map((day, index) => {
        const complete = status === "mastered" || stage > index;
        const current = status === "learning" && stage === index;
        return (
          <div
            key={day}
            className={`stage-step${complete ? " is-complete" : ""}${
              current ? " is-current" : ""
            }`}
          >
            <span className="stage-dot" />
            <span className="stage-day">{day}</span>
          </div>
        );
      })}
    </div>
  );
}
