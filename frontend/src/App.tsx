import {type DragEvent, useEffect, useMemo, useState } from "react";
import {
  createTodos,
  deleteTodo,
  getTodos,
  reorderTodos,
  updateTodo
} from "./services/todo.service";
import type { Todo, TodoPriority } from "./types/todo";

type StatusFilter = "all" | "completed" | "incomplete";
type PriorityFilter = "all" | TodoPriority;
type SortOption =
  | "custom"
  | "priority"
  | "newest"
  | "oldest"
  | "updated"
  | "alphabetical"
  | "completion";

type SortDirection = "asc" | "desc";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("all");

  const [sortBy, setSortBy] = useState<SortOption>("custom");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedTodoId, setDraggedTodoId] =
    useState<string | null>(null);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        const data = await getTodos();
        setTodos(data);
      } catch {
        setError("Unable to load todos");
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, []);

  const handleAddTodos = async () => {
    const titles = title
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!titles.length) return;

    try {
      const newTodos = await createTodos(titles, priority);

      setTodos((current) => [...newTodos, ...current]);
      setTitle("");
    } catch {
      setError("Unable to create todos");
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const updatedTodo = await updateTodo(todo._id, {
        completed: !todo.completed
      });

      setTodos((current) =>
        current.map((item) =>
          item._id === updatedTodo._id ? updatedTodo : item
        )
      );
    } catch {
      setError("Unable to update todo");
    }
  };

  const handlePriorityChange = async (
    todo: Todo,
    nextPriority: TodoPriority
  ) => {
    try {
      const updatedTodo = await updateTodo(todo._id, {
        priority: nextPriority
      });

      setTodos((current) =>
        current.map((item) =>
          item._id === updatedTodo._id ? updatedTodo : item
        )
      );
    } catch {
      setError("Unable to update priority");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);

      setTodos((current) =>
        current.filter((todo) => todo._id !== id)
      );
    } catch {
      setError("Unable to delete todo");
    }
  };

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    id: string
  ) => {
    setDraggedTodoId(id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
    targetId: string
  ) => {
    event.preventDefault();

    if (!draggedTodoId || draggedTodoId === targetId) {
      setDraggedTodoId(null);
      return;
    }

    const currentIndex = todos.findIndex(
      (todo) => todo._id === draggedTodoId
    );

    const targetIndex = todos.findIndex(
      (todo) => todo._id === targetId
    );

    if (currentIndex === -1 || targetIndex === -1) {
      setDraggedTodoId(null);
      return;
    }

    const reordered = [...todos];
    const [movedTodo] = reordered.splice(currentIndex, 1);

    reordered.splice(targetIndex, 0, movedTodo);

    setTodos(reordered);
    setDraggedTodoId(null);

    try {
      const updatedTodos = await reorderTodos(
        draggedTodoId,
        targetIndex
      );

      setTodos(updatedTodos);
    } catch {
      setError("Unable to save todo order");
    }
  };

  const visibleTodos = useMemo(() => {
    let result = [...todos];

    if (statusFilter === "completed") {
      result = result.filter((todo) => todo.completed);
    }

    if (statusFilter === "incomplete") {
      result = result.filter((todo) => !todo.completed);
    }

    if (priorityFilter !== "all") {
      result = result.filter(
        (todo) => todo.priority === priorityFilter
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((todo) =>
        todo.title.toLowerCase().includes(query)
      );
    }

    if (sortBy === "priority") {
      const priorityOrder = {
        low: 1,
        medium: 2,
        high: 3
      };

      result.sort(
        (a, b) =>
          priorityOrder[a.priority] -
          priorityOrder[b.priority]
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
    }

    if (sortBy === "updated") {
      result.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      );
    }

    if (sortBy === "alphabetical") {
      result.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }

    if (sortBy === "completion") {
      result.sort(
        (a, b) =>
          Number(a.completed) - Number(b.completed)
      );
    }

    if (sortDirection === "desc" && sortBy !== "custom") {
      result.reverse();
    }

    return result;
  }, [
    todos,
    statusFilter,
    priorityFilter,
    search,
    sortBy,
    sortDirection
  ]);

  const completedCount = todos.filter(
    (todo) => todo.completed
  ).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearch("");
    setSortBy("custom");
    setSortDirection("asc");
  };

  return (
    <main className="app">
      <section className="todo-container">
        <header className="header">
          <div>
            <p className="eyebrow">CI/CD Playground</p>

            <h1>Todo List</h1>

            <p className="subtitle">
              Build it. Break it. Ship it.
            </p>
          </div>

          <div className="stats">
            <strong>{completedCount}</strong>
            <span>completed</span>
          </div>
        </header>

        {error && (
          <div className="error">
            <span>{error}</span>

            <button onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        <div className="add-section">
          <input
            value={title}
            placeholder="Add multiple todos separated by commas..."
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAddTodos();
              }
            }}
          />

          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value as TodoPriority
              )
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button onClick={handleAddTodos}>
            Add
          </button>
        </div>

        <div className="toolbar">
          <div className="search-wrapper">
            <input
              value={search}
              placeholder="Search todos..."
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="control">
            <label>Status</label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StatusFilter
                )
              }
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>

          <div className="control">
            <label>Priority</label>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as PriorityFilter
                )
              }
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="control">
            <label>Sort</label>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as SortOption
                )
              }
            >
              <option value="custom">Custom order</option>
              <option value="priority">Priority</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="updated">Recently updated</option>
              <option value="alphabetical">A–Z</option>
              <option value="completion">Completion</option>
            </select>
          </div>

          <button
            className="direction"
            disabled={sortBy === "custom"}
            onClick={() =>
              setSortDirection((current) =>
                current === "asc" ? "desc" : "asc"
              )
            }
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </button>

          <button
            className="clear-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div className="listing-header">
          <span>
            {visibleTodos.length} of {todos.length} tasks
          </span>

          {sortBy === "custom" && (
            <span>Drag to reorder</span>
          )}
        </div>

        <div className="todo-list">
          {loading ? (
            <div className="empty">
              Loading todos...
            </div>
          ) : visibleTodos.length === 0 ? (
            <div className="empty">
              No todos found.
            </div>
          ) : (
            visibleTodos.map((todo) => (
              <div
                key={todo._id}
                className={`todo-item ${
                  draggedTodoId === todo._id
                    ? "dragging"
                    : ""
                }`}
                draggable={sortBy === "custom"}
                onDragStart={(event) =>
                  handleDragStart(event, todo._id)
                }
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={(event) =>
                  handleDrop(event, todo._id)
                }
              >
                <span
                  className={`drag-handle ${
                    sortBy !== "custom"
                      ? "disabled"
                      : ""
                  }`}
                >
                  ⋮⋮
                </span>

                <button
                  className={`checkbox ${
                    todo.completed
                      ? "completed"
                      : ""
                  }`}
                  onClick={() =>
                    handleToggle(todo)
                  }
                >
                  {todo.completed ? "✓" : ""}
                </button>

                <div className="todo-content">
                  <span
                    className={`todo-title ${
                      todo.completed ? "done" : ""
                    }`}
                  >
                    {todo.title}
                  </span>

                </div>
                  <select
                    className={`priority priority-${todo.priority}`}
                    value={todo.priority}
                    onChange={(event) =>
                      handlePriorityChange(
                        todo,
                        event.target
                          .value as TodoPriority
                      )
                    }
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                <button
                  className="delete"
                  onClick={() =>
                    handleDelete(todo._id)
                  }
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <footer>
          <span>{todos.length} tasks</span>

          <span>
            MongoDB · Express · React · TypeScript
          </span>
        </footer>
      </section>
    </main>
  );
}

export default App;