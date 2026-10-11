import { useState, useRef } from "react";
import type { Folder, TodoPriority } from "../types/todo";

interface AddTodoFormProps {
  activeFolder: Folder | null;
  folders: Folder[];
  onAdd: (data: {
    title?: string;
    titles?: string[];
    priority: TodoPriority;
    folderId?: string;
    description?: string;
    dueDate?: string;
  }) => Promise<void> | void;
}

export default function AddTodoForm({
  activeFolder,
  folders,
  onAdd
}: AddTodoFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [targetFolderOverride, setTargetFolderOverride] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const targetFolderId = targetFolderOverride ?? (activeFolder?._id || "");

  // Split title by comma into individual tasks
  const splitTitles = title
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const isMultiple = splitTitles.length > 1;

  const handleSubmit = async () => {
    if (splitTitles.length === 0 || isSubmitting) return;

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (isMultiple) {
        await onAdd({
          titles: splitTitles,
          priority,
          folderId: targetFolderId || undefined,
          description: description.trim() || undefined,
          dueDate: dueDate || undefined
        });
      } else {
        await onAdd({
          title: splitTitles[0],
          priority,
          folderId: targetFolderId || undefined,
          description: description.trim() || undefined,
          dueDate: dueDate || undefined
        });
      }

      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setTargetFolderOverride(null);
      setIsExpanded(false);
    } catch {
      setErrorMsg("Failed to create task(s). Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setTargetFolderOverride(null);
    setErrorMsg("");
    setIsExpanded(false);
  };

  const currentFolder = folders.find((f) => f._id === targetFolderId);

  return (
    <div className={`task-creator ${isExpanded ? "task-creator--expanded" : ""}`}>
      {/* Active destination folder badge */}
      <div className="task-creator__header">
        <span className="task-creator__folder-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          Adding to:{" "}
          <strong>{currentFolder ? currentFolder.name : "All Tasks (No folder)"}</strong>
        </span>
      </div>

      {/* Main title input row */}
      <div className="task-creator__input-row">
        <input
          ref={inputRef}
          className="task-creator__title-input"
          value={title}
          placeholder="Add a task… (use commas to add multiple tasks)"
          onChange={(e) => {
            setTitle(e.target.value);
            if (errorMsg) setErrorMsg("");
          }}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape") {
              handleCancel();
            }
          }}
        />

        {!isExpanded ? (
          <button
            className="task-creator__quick-add-btn"
            onClick={handleSubmit}
            disabled={splitTitles.length === 0 || isSubmitting}
            title={isMultiple ? `Add ${splitTitles.length} tasks` : "Add task"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{isMultiple ? `Add ${splitTitles.length} Tasks` : "Add Task"}</span>
          </button>
        ) : null}
      </div>

      {/* Comma-split live preview chips */}
      {isMultiple && (
        <div className="task-creator__split-preview">
          <span className="task-creator__split-label">
            Splitting into {splitTitles.length} tasks:
          </span>
          <div className="task-creator__split-chips">
            {splitTitles.map((t, idx) => (
              <span key={idx} className="task-creator__split-chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Options Section */}
      {isExpanded && (
        <div className="task-creator__expandable">
          <textarea
            className="task-creator__desc-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />

          <div className="task-creator__toolbar">
            <div className="task-creator__pills">
              {/* Folder Selector */}
              <div className="task-creator__pill" title="Destination folder">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                <select
                  value={targetFolderId}
                  onChange={(e) => setTargetFolderOverride(e.target.value)}
                  className="task-creator__select"
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div className="task-creator__pill" title="Priority">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TodoPriority)}
                  className={`task-creator__select task-creator__select--${priority}`}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              {/* Due Date Picker */}
              <div className="task-creator__pill" title="Due Date">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  type="date"
                  className="task-creator__date-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Submit & Cancel Actions */}
            <div className="task-creator__actions">
              <button
                type="button"
                className="task-creator__cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="task-creator__submit-btn"
                onClick={handleSubmit}
                disabled={splitTitles.length === 0 || isSubmitting}
              >
                {isSubmitting
                  ? "Adding…"
                  : isMultiple
                  ? `Add ${splitTitles.length} Tasks`
                  : "Add Task"}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="task-creator__error">
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
