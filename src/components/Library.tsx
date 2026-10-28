import { useEffect, useMemo, useState } from "react";
import type { Topic } from "../types";
import { curriculumTracks } from "../lib/curriculum";
import { isDue } from "../lib/scheduler";
import { Icon } from "./Icon";
import { TopicCard } from "./TopicCard";

interface LibraryProps {
  topics: Topic[];
  today: string;
  onAddTopic: () => void;
  onStartReview: (ids: string[]) => void;
  onStartTopic: (id: string) => void;
  onRestartTopic: (id: string) => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topic: Topic) => void;
}

type StatusFilter = "all" | "not-started" | "learning" | "due" | "mastered";
type SortMode = "track" | "title" | "due";

const PAGE_SIZE = 24;

export function Library({
  topics,
  today,
  onAddTopic,
  onStartReview,
  onStartTopic,
  onRestartTopic,
  onEditTopic,
  onDeleteTopic,
}: LibraryProps) {
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<SortMode>("track");
  const [page, setPage] = useState(1);

  const trackOptions = useMemo(() => {
    const options = [...curriculumTracks];
    if (topics.some((topic) => topic.trackId === 0)) {
      options.push({ id: 0, name: "Custom" });
    }
    return options;
  }, [topics]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = topics.filter((topic) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${topic.title} ${topic.track} ${topic.notes}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesTrack =
        trackFilter === "all" || topic.trackId === Number(trackFilter);
      const matchesDepth =
        depthFilter === "all" ||
        topic.depth.toUpperCase().startsWith(depthFilter.toUpperCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "due"
          ? isDue(topic, today)
          : topic.status === statusFilter);

      return matchesQuery && matchesTrack && matchesDepth && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "due") {
        if (a.nextReview && b.nextReview) {
          return a.nextReview.localeCompare(b.nextReview);
        }
        if (a.nextReview) return -1;
        if (b.nextReview) return 1;
        return a.title.localeCompare(b.title);
      }
      if (a.trackId !== b.trackId) return a.trackId - b.trackId;
      return a.title.localeCompare(b.title);
    });
  }, [topics, query, trackFilter, depthFilter, statusFilter, sort, today]);

  useEffect(() => {
    setPage(1);
  }, [query, trackFilter, statusFilter, depthFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters =
    query !== "" ||
    trackFilter !== "all" ||
    statusFilter !== "all" ||
    depthFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setTrackFilter("all");
    setStatusFilter("all");
    setDepthFilter("all");
    setSort("track");
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h1>All review cards.</h1>
          <p className="page-lede">
            {topics.length} cards from your curriculum, plus anything you add.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onAddTopic}>
            <Icon name="plus" size={17} />
            Add topic
          </button>
        </div>
      </header>

      <section className="library-toolbar" aria-label="Filter review cards">
        <label className="search-field">
          <Icon name="search" size={17} />
          <span className="visually-hidden">Search cards</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, tracks, or notes"
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <Icon name="close" size={14} />
            </button>
          ) : null}
        </label>

        <label className="filter-field">
          <span>Track</span>
          <select
            value={trackFilter}
            onChange={(event) => setTrackFilter(event.target.value)}
          >
            <option value="all">All tracks</option>
            {trackOptions.map((track) => (
              <option value={track.id} key={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="not-started">Not started</option>
            <option value="learning">Learning</option>
            <option value="due">Due now</option>
            <option value="mastered">Mastered</option>
          </select>
        </label>

        <label className="filter-field">
          <span>Depth</span>
          <select
            value={depthFilter}
            onChange={(event) => setDepthFilter(event.target.value)}
          >
            <option value="all">All depths</option>
            <option value="DEEP">Deep</option>
            <option value="WORKING">Working</option>
            <option value="AWARE">Aware</option>
          </select>
        </label>

        <label className="filter-field">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
          >
            <option value="track">Track</option>
            <option value="title">Title</option>
            <option value="due">Next review</option>
          </select>
        </label>

        {hasFilters ? (
          <button type="button" className="btn btn-small btn-quiet" onClick={clearFilters}>
            <Icon name="filter" size={15} />
            Clear
          </button>
        ) : null}
      </section>

      <div className="library-meta">
        <span>
          {filtered.length === 0
            ? "No cards match these filters"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        {hasFilters ? <span className="filter-note">Filters active</span> : null}
      </div>

      {visible.length > 0 ? (
        <div className="topic-grid">
          {visible.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              today={today}
              onReview={(id) => onStartReview([id])}
              onStart={onStartTopic}
              onRestart={onRestartTopic}
              onEdit={onEditTopic}
              onDelete={onDeleteTopic}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <span className="empty-icon">
            <Icon name="search" size={22} />
          </span>
          <div>
            <h3>Nothing found.</h3>
            <p>Try a different search term, or clear the active filters.</p>
          </div>
          {hasFilters ? (
            <button type="button" className="btn btn-small btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="pagination" aria-label="Library pages">
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
          >
            <Icon name="chevronLeft" size={15} />
            Previous
          </button>
          <span>
            Page {safePage} of {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => setPage(Math.min(pageCount, safePage + 1))}
            disabled={safePage === pageCount}
          >
            Next
            <Icon name="chevronRight" size={15} />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
