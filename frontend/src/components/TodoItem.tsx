import { useState, useRef, useEffect, type DragEvent } from "react";
import type { Todo, TodoPriority } from "../types/todo";
import SubtaskList from "./SubtaskList";

interface TodoItemProps {
  todo: Todo;
  isDraggable: boolean;
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onToggle: (todo: Todo) => void;
  onUpdate: (
    id: string,
    data: Partial<Pick<Todo, "title" | "priority" | "description" | "dueDate">>
  ) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (todo: Todo, priority: TodoPriority) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onUpdateSubtask: (
    todoId: string,
    subtaskId: string,
    data: { title?: string; completed?: boolean }
  ) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function TodoItem({
  todo,
  isDraggable,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onToggle,
  onUpdate,
  onDelete,
  onPriorityChange,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect
}: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || "");
  const [editPriority, setEditPriority] = useState<TodoPriority>(todo.priority);
  const [editDueDate, setEditDueDate] = useState(
    todo.dueDate ? todo.dueDate.slice(0, 10) : ""
  );

  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  // Close more-actions menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onUpdate(todo._id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      dueDate: editDueDate || null
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditPriority(todo.priority);
    setEditDueDate(todo.dueDate ? todo.dueDate.slice(0, 10) : "");
    setIsEditing(false);
  };

  const completedSubtasks = todo.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = todo.subtasks.length;

  const isOverdue =
    Boolean(todo.dueDate && !todo.completed && new Date(todo.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0));

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 6) {
      return target.toLocaleDateString("en-US", { weekday: "short" });
    }

    return target.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div
      className={`task-row ${isDragging ? "task-row--dragging" : ""} ${todo.completed ? "task-row--completed" : ""}`}
      draggable={isDraggable && !isEditing}
      onDragStart={(e) => onDragStart(e, todo._id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, todo._id)}
    >
      <div className="task-row__main">
        {/* Multi-Select Checkbox */}
        {isSelectMode && (
          <button
            type="button"
            className={`task-row__multi-select-box ${isSelected ? "selected" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(todo._id);
            }}
            aria-label={isSelected ? "Deselect task" : "Select task"}
            title={isSelected ? "Deselect" : "Select task"}
          >
            {isSelected && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        )}

        {/* Optional drag handle */}
        {isDraggable && !isSelectMode && (
          <span className="task-row__grip" title="Drag to reorder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </span>
        )}

        {/* Custom Completion Checkbox */}
        <button
          className={`task-row__checkbox ${todo.completed ? "task-row__checkbox--done" : ""} task-row__checkbox--${todo.priority}`}
          onClick={() => onToggle(todo)}
          aria-label={todo.completed ? "Mark task incomplete" : "Mark task complete"}
        >
          {todo.completed && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Content & Edit View */}
        <div className="task-row__content">
          {isEditing ? (
            <div className="task-row__edit-box">
              <input
                ref={editInputRef}
                className="task-row__edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder="Task title"
              />
              <textarea
                className="task-row__edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="task-row__edit-toolbar">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TodoPriority)}
                  className="task-row__edit-select"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>

                <input
                  type="date"
                  className="task-row__edit-date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />

                <div className="task-row__edit-buttons">
                  <button
                    className="task-row__save-btn"
                    onClick={handleSave}
                    disabled={!editTitle.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="task-row__cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="task-row__title-wrap">
                <span
                  className={`task-row__title ${todo.completed ? "task-row__title--done" : ""}`}
                  onDoubleClick={() => setIsEditing(true)}
                  title="Double click to edit"
                >
                  {todo.title}
                </span>
              </div>

              {todo.description && (
                <p className="task-row__desc-snippet">{todo.description}</p>
              )}

              {/* Meta Badges */}
              <div className="task-row__badges">
                {/* Priority Badge */}
                <span className={`task-badge task-badge--priority-${todo.priority}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  <span className="task-badge__text">
                    {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                  </span>
                </span>

                {/* Due Date Badge */}
                {todo.dueDate && (
                  <span
                    className={`task-badge task-badge--due ${isOverdue ? "task-badge--overdue" : ""}`}
                    title={new Date(todo.dueDate).toLocaleDateString()}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{formatDueDate(todo.dueDate)}</span>
                  </span>
                )}

                {/* Subtask Count Badge */}
                {totalSubtasks > 0 && (
                  <button
                    className="task-badge task-badge--subtasks"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <polyline points="3 6 4 7 6 5" />
                      <polyline points="3 12 4 13 6 11" />
                      <polyline points="3 18 4 19 6 17" />
                    </svg>
                    <span>
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="task-row__actions">
          {/* Subtask expand toggle button */}
          <button
            className="task-row__icon-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
            aria-label="Toggle subtasks"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease"
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Quick Delete for marked/completed item */}
          {todo.completed && (
            <button
              className="task-row__icon-btn task-row__icon-btn--danger"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete marked item"
              aria-label="Delete marked item"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}

          {/* More actions menu */}
          <div className="task-row__menu-wrapper" ref={menuRef}>
            <button
              className="task-row__icon-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="More actions"
              aria-label="More actions"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="5" cy="12" r="2" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="task-row__dropdown">
                <button
                  className="task-row__dropdown-item"
                  onClick={() => {
                    setIsEditing(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit Task</span>
                </button>

                <div className="task-row__dropdown-divider" />

                <div className="task-row__dropdown-section-title">Change Priority</div>
                <div className="task-row__priority-options">
                  <button
                    className={`task-row__priority-btn ${todo.priority === "high" ? "active" : ""}`}
                    onClick={() => {
                      onPriorityChange(todo, "high");
                      setIsMenuOpen(false);
                    }}
                  >
                    High
                  </button>
                  <button
                    className={`task-row__priority-btn ${todo.priority === "medium" ? "active" : ""}`}
                    onClick={() => {
                      onPriorityChange(todo, "medium");
                      setIsMenuOpen(false);
                    }}
                  >
                    Med
                  </button>
                  <button
                    className={`task-row__priority-btn ${todo.priority === "low" ? "active" : ""}`}
                    onClick={() => {
                      onPriorityChange(todo, "low");
                      setIsMenuOpen(false);
                    }}
                  >
                    Low
                  </button>
                </div>

                <div className="task-row__dropdown-divider" />

                <button
                  className="task-row__dropdown-item task-row__dropdown-item--danger"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  <span>Delete Task</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Banner */}
      {showDeleteConfirm && (
        <div className="task-row__delete-prompt">
          <span>Delete this task?</span>
          <div className="task-row__delete-buttons">
            <button
              className="task-row__confirm-delete"
              onClick={() => onDelete(todo._id)}
            >
              Delete
            </button>
            <button
              className="task-row__cancel-delete"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expandable Subtask List */}
      {isExpanded && (
        <SubtaskList
          todo={todo}
          onAddSubtask={onAddSubtask}
          onUpdateSubtask={onUpdateSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      )}
    </div>
  );
}
