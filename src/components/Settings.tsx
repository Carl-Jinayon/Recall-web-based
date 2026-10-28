import { useRef } from "react";
import type { Theme, Topic } from "../types";
import { getReviewCount } from "../lib/scheduler";
import { Icon } from "./Icon";

interface SettingsProps {
  topics: Topic[];
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onSyncCurriculum: () => void;
  onResetProgress: () => void;
  onClearData: () => void;
}

export function Settings({
  topics,
  theme,
  onThemeChange,
  onExport,
  onImport,
  onSyncCurriculum,
  onResetProgress,
  onClearData,
}: SettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const customCount = topics.filter((topic) => topic.source === "custom").length;
  const reviewCount = getReviewCount(topics);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Make it yours.</h1>
          <p className="page-lede">
            Appearance, backups, and the rules behind the review schedule.
          </p>
        </div>
      </header>

      <div className="settings-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Appearance</h2>
              <p className="panel-sub">Choose the reading environment you prefer.</p>
            </div>
          </div>
          <div className="theme-options">
            <button
              type="button"
              className={`theme-option${theme === "light" ? " is-active" : ""}`}
              onClick={() => onThemeChange("light")}
            >
              <span className="theme-preview theme-preview-light">
                <span />
                <span />
                <span />
              </span>
              <span className="theme-option-copy">
                <Icon name="sun" size={17} />
                <strong>Light</strong>
              </span>
            </button>
            <button
              type="button"
              className={`theme-option${theme === "dark" ? " is-active" : ""}`}
              onClick={() => onThemeChange("dark")}
            >
              <span className="theme-preview theme-preview-dark">
                <span />
                <span />
                <span />
              </span>
              <span className="theme-option-copy">
                <Icon name="moon" size={17} />
                <strong>Dark</strong>
              </span>
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Your data</h2>
              <p className="panel-sub">
                Everything is stored locally in this browser. No account, no server.
              </p>
            </div>
          </div>
          <div className="data-summary">
            <div>
              <strong>{topics.length}</strong>
              <span>cards</span>
            </div>
            <div>
              <strong>{customCount}</strong>
              <span>custom</span>
            </div>
            <div>
              <strong>{reviewCount}</strong>
              <span>reviews</span>
            </div>
          </div>
          <div className="button-row">
            <button type="button" className="btn btn-secondary" onClick={onExport}>
              <Icon name="download" size={16} />
              Export backup
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="upload" size={16} />
              Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = "";
              }}
            />
          </div>
          <p className="settings-hint">
            Export a JSON backup before clearing browser data or moving to another
            computer.
          </p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>The review cycle</h2>
              <p className="panel-sub">Five reviews, spaced further apart each time.</p>
            </div>
          </div>
          <ol className="cycle-list">
            {[
              ["Day 1", "First review", "Return to the topic one day after learning it."],
              ["Day 3", "Second review", "Two days after the first review."],
              ["Day 7", "Third review", "Four days after the second."],
              ["Day 15", "Fourth review", "Eight days after the third."],
              ["Day 30", "Fifth review", "Fifteen days after the fourth. Then mastered."],
            ].map(([day, title, description]) => (
              <li key={day}>
                <span className="cycle-day">{day.replace("Day ", "")}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="settings-hint">
            Late reviews shift the remaining schedule forward. The next interval
            starts from the day you actually review, so overdue cards do not stack
            up.
          </p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Curriculum</h2>
              <p className="panel-sub">
                Cards are imported from the complete curriculum document.
              </p>
            </div>
          </div>
          <p className="settings-paragraph">
            The library currently contains {topics.length} cards from 12 tracks.
            When the curriculum changes, add any new topics without touching the
            progress you already have.
          </p>
          <button type="button" className="btn btn-secondary" onClick={onSyncCurriculum}>
            <Icon name="refresh" size={16} />
            Add missing curriculum cards
          </button>
        </section>
      </div>

      <section className="panel danger-panel">
        <div className="panel-head">
          <div>
            <h2>Reset</h2>
            <p className="panel-sub">
              These actions are local and cannot be undone without a backup.
            </p>
          </div>
        </div>
        <div className="danger-row">
          <div>
            <strong>Reset all progress</strong>
            <p>Keep every card, but clear schedules, history, and mastery.</p>
          </div>
          <button type="button" className="btn btn-danger-ghost" onClick={onResetProgress}>
            Reset progress
          </button>
        </div>
        <div className="danger-row">
          <div>
            <strong>Start over</strong>
            <p>
              Delete custom cards and progress, then restore the original curriculum
              library.
            </p>
          </div>
          <button type="button" className="btn btn-danger" onClick={onClearData}>
            Start over
          </button>
        </div>
      </section>
    </div>
  );
}
