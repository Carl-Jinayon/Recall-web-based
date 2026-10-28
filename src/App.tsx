import { useCallback, useEffect, useState } from "react";
import type { Page, StoredState, Theme, Topic, TopicDraft } from "./types";
import {
  completeReview,
  createTopic,
  getDueTopics,
  masterTopic,
  postponeReview,
  restartCycle,
  startCycle,
} from "./lib/scheduler";
import {
  clearState,
  isStoredTopic,
  loadState,
  saveState,
} from "./lib/storage";
import { curriculumTracks, mergeCurriculum } from "./lib/curriculum";
import { todayISO } from "./lib/dates";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Library } from "./components/Library";
import { Upcoming } from "./components/Upcoming";
import { Progress } from "./components/Progress";
import { Settings } from "./components/Settings";
import { TopicForm } from "./components/TopicForm";
import { ReviewSession } from "./components/ReviewSession";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Toast, type ToastMessage } from "./components/Toast";

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
}

export default function App() {
  const [store, setStore] = useState<StoredState>(() => loadState());
  const [page, setPage] = useState<Page>("dashboard");
  const [today, setToday] = useState(todayISO);
  const [sessionIds, setSessionIds] = useState<string[] | null>(null);
  const [formTopic, setFormTopic] = useState<Topic | "new" | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    saveState(store);
  }, [store]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [page]);

  useEffect(() => {
    document.documentElement.dataset.theme = store.theme;
  }, [store.theme]);

  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastMessage["tone"] = "success") => {
      setToast({ id: Date.now() + Math.random(), message, tone });
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const updateTopics = (updater: (topics: Topic[]) => Topic[]) => {
    setStore((previous) => ({
      ...previous,
      topics: updater(previous.topics),
    }));
  };

  const startTopic = (id: string) => {
    const target = store.topics.find((topic) => topic.id === id);
    if (!target || target.status !== "not-started") return;
    updateTopics((topics) =>
      topics.map((topic) =>
        topic.id === id ? startCycle(topic, today) : topic,
      ),
    );
    notify("Review cycle started. First review is due tomorrow.");
  };

  const restartTopic = (id: string) => {
    const target = store.topics.find((topic) => topic.id === id);
    if (!target) return;
    updateTopics((topics) =>
      topics.map((topic) =>
        topic.id === id ? restartCycle(topic, today) : topic,
      ),
    );
    notify("Cycle restarted. First review is due tomorrow.");
  };

  const reviewAction = (
    topicId: string,
    action: "reviewed" | "postponed" | "mastered",
  ) => {
    updateTopics((topics) =>
      topics.map((topic) => {
        if (topic.id !== topicId) return topic;
        if (action === "reviewed") return completeReview(topic, today);
        if (action === "postponed") return postponeReview(topic, today);
        return masterTopic(topic, today);
      }),
    );
  };

  const startReview = (ids: string[]) => {
    const valid = ids.filter((id) =>
      store.topics.some(
        (topic) => topic.id === id && topic.status === "learning",
      ),
    );
    if (valid.length === 0) {
      notify("Those cards are not in an active review cycle.", "info");
      return;
    }
    setSessionIds(valid);
  };

  const saveTopic = (draft: TopicDraft) => {
    if (!formTopic) return;

    if (formTopic === "new") {
      const base = createTopic(
        {
          ...draft,
          source: "custom",
          kind: "topic",
        },
        today,
        false,
      );
      const topic = draft.startNow
        ? startCycle(base, draft.startDate || today)
        : base;
      setStore((previous) => ({
        ...previous,
        topics: [topic, ...previous.topics],
      }));
      notify(
        draft.startNow
          ? "Card added. First review is scheduled."
          : "Card added to the library.",
      );
    } else {
      updateTopics((topics) =>
        topics.map((topic) =>
          topic.id === formTopic.id
            ? {
                ...topic,
                title: draft.title,
                trackId: draft.trackId,
                track: draft.track,
                depth: draft.depth,
                notes: draft.notes,
              }
            : topic,
        ),
      );
      notify("Card updated.");
    }

    setFormTopic(null);
  };

  const deleteTopic = (topic: Topic) => {
    setConfirm({
      title: "Delete this card?",
      message: `“${topic.title}” and its review history will be removed. This cannot be undone without a backup.`,
      confirmLabel: "Delete card",
      tone: "danger",
      onConfirm: () => {
        updateTopics((topics) => topics.filter((item) => item.id !== topic.id));
        setSessionIds((current) => {
          if (!current) return current;
          const remaining = current.filter((id) => id !== topic.id);
          return remaining.length > 0 ? remaining : null;
        });
        notify("Card deleted.", "info");
      },
    });
  };

  const exportBackup = () => {
    const payload = {
      app: "recall",
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: store.theme,
      topics: store.topics,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recall-backup-${today}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    notify("Backup exported.");
  };

  const importBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const topicsCandidate = Array.isArray(parsed)
        ? parsed
        : (parsed as { topics?: unknown } | null)?.topics;

      if (
        !Array.isArray(topicsCandidate) ||
        !topicsCandidate.every(isStoredTopic)
      ) {
        throw new Error("Invalid backup");
      }

      const importedTopics = topicsCandidate as Topic[];
      const importedTheme =
        !Array.isArray(parsed) &&
        (parsed as { theme?: unknown } | null)?.theme === "dark"
          ? "dark"
          : store.theme;

      setConfirm({
        title: "Replace this library?",
        message: `Import ${importedTopics.length} cards and replace the current library and progress? Export a backup first if you are unsure.`,
        confirmLabel: "Import backup",
        tone: "primary",
        onConfirm: () => {
          setStore({
            version: 1,
            topics: importedTopics,
            theme: importedTheme,
          });
          setSessionIds(null);
          setFormTopic(null);
          notify("Backup imported.");
        },
      });
    } catch {
      notify("That file is not a valid Recall backup.", "error");
    }
  };

  const syncCurriculum = () => {
    const result = mergeCurriculum(store.topics, today);
    setStore((previous) => ({ ...previous, topics: result.topics }));
    notify(
      result.added === 0
        ? "All curriculum cards are already in the library."
        : `Added ${result.added} curriculum card${result.added === 1 ? "" : "s"}.`,
      result.added === 0 ? "info" : "success",
    );
  };

  const resetProgress = () => {
    setConfirm({
      title: "Reset all progress?",
      message:
        "Every card stays in the library, but schedules, history, mastery, and custom card history will be cleared.",
      confirmLabel: "Reset progress",
      tone: "danger",
      onConfirm: () => {
        updateTopics((topics) =>
          topics.map((topic) => ({
            ...topic,
            status: "not-started",
            stage: 0,
            startedAt: undefined,
            nextReview: undefined,
            masteredAt: undefined,
            history: [],
          })),
        );
        setSessionIds(null);
        notify("All progress reset.", "info");
      },
    });
  };

  const clearData = () => {
    setConfirm({
      title: "Start over?",
      message:
        "This removes custom cards and all progress, then restores the original curriculum library. Export a backup first if you want to keep anything.",
      confirmLabel: "Start over",
      tone: "danger",
      onConfirm: () => {
        clearState();
        const fresh = loadState();
        setStore({ ...fresh, theme: store.theme });
        setPage("dashboard");
        setSessionIds(null);
        setFormTopic(null);
        notify("Library restored to its original state.", "info");
      },
    });
  };

  const changeTheme = (theme: Theme) => {
    setStore((previous) => ({ ...previous, theme }));
  };

  const dueCount = getDueTopics(store.topics, today).length;

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        dueCount={dueCount}
        theme={store.theme}
        onNavigate={setPage}
        onToggleTheme={() =>
          changeTheme(store.theme === "dark" ? "light" : "dark")
        }
      />

      <main className="main-content">
        {page === "dashboard" ? (
          <Dashboard
            topics={store.topics}
            today={today}
            onStartReview={startReview}
            onStartTopic={startTopic}
            onAddTopic={() => setFormTopic("new")}
            onNavigate={setPage}
          />
        ) : null}

        {page === "library" ? (
          <Library
            topics={store.topics}
            today={today}
            onAddTopic={() => setFormTopic("new")}
            onStartReview={startReview}
            onStartTopic={startTopic}
            onRestartTopic={restartTopic}
            onEditTopic={setFormTopic}
            onDeleteTopic={deleteTopic}
          />
        ) : null}

        {page === "upcoming" ? (
          <Upcoming
            topics={store.topics}
            today={today}
            onStartReview={startReview}
          />
        ) : null}

        {page === "progress" ? (
          <Progress
            topics={store.topics}
            today={today}
            onNavigate={setPage}
            onStartReview={startReview}
          />
        ) : null}

        {page === "settings" ? (
          <Settings
            topics={store.topics}
            theme={store.theme}
            onThemeChange={changeTheme}
            onExport={exportBackup}
            onImport={importBackup}
            onSyncCurriculum={syncCurriculum}
            onResetProgress={resetProgress}
            onClearData={clearData}
          />
        ) : null}
      </main>

      {sessionIds ? (
        <ReviewSession
          topicIds={sessionIds}
          topics={store.topics}
          onAction={reviewAction}
          onClose={() => {
            setSessionIds(null);
            setPage("dashboard");
          }}
        />
      ) : null}

      {formTopic ? (
        <TopicForm
          topic={formTopic === "new" ? null : formTopic}
          tracks={curriculumTracks}
          today={today}
          onSave={saveTopic}
          onClose={() => setFormTopic(null)}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          tone={confirm.tone}
          onConfirm={() => {
            confirm.onConfirm();
            setConfirm(null);
          }}
          onClose={() => setConfirm(null)}
        />
      ) : null}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
