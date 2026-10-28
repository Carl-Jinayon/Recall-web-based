import { useId, useState } from "react";
import type { CurriculumTrack, Topic, TopicDraft } from "../types";
import { trackName } from "../lib/curriculum";
import { Icon } from "./Icon";
import { Modal, ModalHeader } from "./Modal";

interface TopicFormProps {
  topic?: Topic | null;
  tracks: CurriculumTrack[];
  today: string;
  onSave: (draft: TopicDraft) => void;
  onClose: () => void;
}

export function TopicForm({
  topic,
  tracks,
  today,
  onSave,
  onClose,
}: TopicFormProps) {
  const titleId = useId();
  const [title, setTitle] = useState(topic?.title ?? "");
  const [trackId, setTrackId] = useState(String(topic?.trackId ?? 1));
  const [customTrack, setCustomTrack] = useState(
    topic?.trackId === 0 ? topic.track : "",
  );
  const [depth, setDepth] = useState(topic?.depth ?? "WORKING");
  const [notes, setNotes] = useState(topic?.notes ?? "");
  const [startNow, setStartNow] = useState(!topic);
  const [startDate, setStartDate] = useState(today);
  const [error, setError] = useState("");

  const isEditing = Boolean(topic);
  const numericTrackId = Number(trackId);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Give the card a title first.");
      return;
    }

    onSave({
      title: trimmedTitle,
      trackId: numericTrackId,
      track:
        numericTrackId === 0
          ? customTrack.trim() || "Custom"
          : trackName(numericTrackId),
      depth: depth.trim() || "WORKING",
      notes: notes.trim(),
      startNow: isEditing ? false : startNow,
      startDate,
    });
  };

  return (
    <Modal open onClose={onClose} labelledBy={titleId} size="md">
      <ModalHeader
        eyebrow={isEditing ? "Edit card" : "New card"}
        title={isEditing ? "Edit review card" : "Add a review card"}
        description={
          isEditing
            ? "Update the text without changing the review history."
            : "Add something you studied so it enters the review cycle."
        }
        titleId={titleId}
        onClose={onClose}
      />
      <form className="topic-form" onSubmit={submit}>
        <label className="form-field">
          <span>Title</span>
          <input
            data-autofocus
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. TCP handshake"
          />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Collection</span>
            <select
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
            >
              {tracks.map((track) => (
                <option value={track.id} key={track.id}>
                  {track.name}
                </option>
              ))}
              <option value={0}>Custom</option>
            </select>
          </label>

          <label className="form-field">
            <span>Depth</span>
            <input
              type="text"
              list="depth-options"
              value={depth}
              onChange={(event) => setDepth(event.target.value)}
              placeholder="DEEP, WORKING, or AWARE"
            />
            <datalist id="depth-options">
              <option value="DEEP" />
              <option value="WORKING" />
              <option value="AWARE" />
            </datalist>
          </label>
        </div>

        {numericTrackId === 0 ? (
          <label className="form-field">
            <span>Custom collection name</span>
            <input
              type="text"
              value={customTrack}
              onChange={(event) => setCustomTrack(event.target.value)}
              placeholder="e.g. Thesis research"
            />
          </label>
        ) : null}

        <label className="form-field">
          <span>Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="A definition, an example, a question to answer, or why it matters."
          />
        </label>

        {!isEditing ? (
          <div className="start-options">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={startNow}
                onChange={(event) => setStartNow(event.target.checked)}
              />
              <span>
                <strong>Start the review cycle now</strong>
                <small>The first review is due one day after the start date.</small>
              </span>
            </label>
            {startNow ? (
              <label className="form-field form-field-inline">
                <span>Start date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Icon name={isEditing ? "check" : "plus"} size={16} />
            {isEditing ? "Save changes" : "Add card"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
