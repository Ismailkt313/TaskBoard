import { useState, useRef, useEffect } from "react";
import type { Todo, Subtask } from "../types/todo";

interface SubtaskListProps {
  todo: Todo;
  onAddSubtask: (todoId: string, title: string) => void;
  onUpdateSubtask: (
    todoId: string,
    subtaskId: string,
    data: { title?: string; completed?: boolean }
  ) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

export default function SubtaskList({
  todo,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask
}: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const editRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (isAdding && addRef.current) {
      addRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddSubtask(todo._id, newTitle.trim());
      setNewTitle("");
      setIsAdding(false);
    }
  };

  const startEdit = (subtask: Subtask) => {
    setEditingId(subtask._id);
    setEditTitle(subtask.title);
  };

  const handleEditSave = (subtaskId: string) => {
    if (editTitle.trim()) {
      onUpdateSubtask(todo._id, subtaskId, { title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle("");
  };

  const completedCount = todo.subtasks.filter((s) => s.completed).length;
  const totalCount = todo.subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="subtasks-container">
      {/* Subtask Header & Progress Bar */}
      <div className="subtasks-header">
        <div className="subtasks-header__info">
          <span className="subtasks-header__label">Subtasks</span>
          <span className="subtasks-header__count">
            {completedCount} of {totalCount} ({progressPercent}%)
          </span>
        </div>
        <div className="subtasks-progress-track">
          <div
            className="subtasks-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Subtask Items List */}
      <div className="subtasks-list">
        {todo.subtasks.map((subtask) => (
          <div key={subtask._id} className="subtask-row">
            <button
              className={`subtask-checkbox ${subtask.completed ? "subtask-checkbox--checked" : ""}`}
              onClick={() =>
                onUpdateSubtask(todo._id, subtask._id, {
                  completed: !subtask.completed
                })
              }
              aria-label={subtask.completed ? "Mark incomplete" : "Mark complete"}
            >
              {subtask.completed && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {editingId === subtask._id ? (
              <div className="subtask-edit-form">
                <input
                  ref={editRef}
                  className="subtask-edit-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave(subtask._id);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditTitle("");
                    }
                  }}
                  onBlur={() => handleEditSave(subtask._id)}
                />
                <button
                  className="subtask-edit-btn"
                  onClick={() => handleEditSave(subtask._id)}
                >
                  Save
                </button>
              </div>
            ) : (
              <span
                className={`subtask-title ${subtask.completed ? "subtask-title--done" : ""}`}
                onClick={() => startEdit(subtask)}
                title="Click to edit subtask"
              >
                {subtask.title}
              </span>
            )}

            <button
              className="subtask-delete-btn"
              onClick={() => onDeleteSubtask(todo._id, subtask._id)}
              title="Delete subtask"
              aria-label="Delete subtask"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Discoverable Add Subtask Section */}
      {isAdding ? (
        <div className="subtask-add-form">
          <input
            ref={addRef}
            className="subtask-add-input"
            value={newTitle}
            placeholder="Subtask title…"
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewTitle("");
              }
            }}
          />
          <button
            className="subtask-add-submit"
            onClick={handleAdd}
            disabled={!newTitle.trim()}
          >
            Add
          </button>
          <button
            className="subtask-add-cancel"
            onClick={() => {
              setIsAdding(false);
              setNewTitle("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="subtask-add-trigger"
          onClick={() => setIsAdding(true)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add subtask</span>
        </button>
      )}
    </div>
  );
}
