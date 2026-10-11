import { type DragEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createTodo,
  createTodos,
  deleteTodo,
  bulkDeleteTodos,
  getTodos,
  reorderTodos,
  updateTodo,
  addSubtask,
  updateSubtask,
  deleteSubtask
} from "./services/todo.service";
import {
  createFolder,
  deleteFolder,
  getFolders,
  updateFolder
} from "./services/folder.service";
import type { Folder, Todo, TodoPriority } from "./types/todo";
import Sidebar from "./components/Sidebar";
import TodoItem from "./components/TodoItem";
import AddTodoForm from "./components/AddTodoForm";

type StatusFilter = "all" | "incomplete" | "completed";
type PriorityFilter = "all" | "high" | "medium" | "low";
type SortOption =
  | "custom"
  | "priority"
  | "dueDate"
  | "newest"
  | "oldest"
  | "alphabetical";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [currentView, setCurrentView] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  // Selection & Bulk / Marked Deletion
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteMarkedModal, setShowDeleteMarkedModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);

  // PWA Download / Laptop Install
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Toast notification helper
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Listen for PWA Installability on Desktop / Laptop
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      showToast("TaskBoard installed on your computer successfully!", "success");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [showToast]);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsAppInstalled(true);
          setShowInstallModal(false);
          showToast("TaskBoard installed to your laptop!", "success");
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleDownloadDesktopShortcut = () => {
    const currentOrigin = window.location.origin;
    const shortcutContent = `[InternetShortcut]\r\nURL=${currentOrigin}/\r\nIconIndex=0\r\nIconFile=${currentOrigin}/todo.png\r\nHotKey=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,11\r\n`;
    const blob = new Blob([shortcutContent], { type: "application/internet-shortcut" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TaskBoard.url";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded TaskBoard desktop shortcut! Move it to your desktop for quick launch.", "success");
  };

  // Manual reload (e.g. on retry)
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [foldersData, todosData] = await Promise.all([
        getFolders(),
        getTodos()
      ]);
      setFolders(foldersData);
      setAllTodos(todosData);
    } catch {
      setError("Unable to connect to the server. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: fetch folders and all todos asynchronously
  useEffect(() => {
    let ignore = false;

    Promise.all([getFolders(), getTodos()])
      .then(([foldersData, todosData]) => {
        if (!ignore) {
          setFolders(foldersData);
          setAllTodos(todosData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Unable to connect to the server. Please check that the backend is running.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Refresh folders data to keep server in sync
  const refreshFolders = useCallback(async () => {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch {
      // silent refresh
    }
  }, []);

  // Determine active folder if viewing a folder
  const activeFolderId = useMemo(() => {
    if (currentView.startsWith("folder:")) {
      return currentView.replace("folder:", "");
    }
    return null;
  }, [currentView]);

  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return folders.find((f) => f._id === activeFolderId) || null;
  }, [folders, activeFolderId]);

  // Compute accurate real-time task counts across the entire application
  const folderTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of folders) {
      counts[f._id] = 0;
    }
    for (const t of allTodos) {
      if (t.folderId && counts[t.folderId] !== undefined) {
        counts[t.folderId]++;
      }
    }
    return counts;
  }, [folders, allTodos]);

  const allTasksCount = allTodos.length;

  const todayCount = useMemo(() => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return allTodos.filter((t) => {
      if (!t.dueDate || t.completed) return false;
      const d = new Date(t.dueDate);
      const targetStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return targetStr <= todayStr;
    }).length;
  }, [allTodos]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return allTodos.filter((t) => {
      if (!t.dueDate || t.completed) return false;
      const d = new Date(t.dueDate);
      const targetStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return targetStr > todayStr;
    }).length;
  }, [allTodos]);

  const completedCount = useMemo(() => {
    return allTodos.filter((t) => t.completed).length;
  }, [allTodos]);

  // Filter tasks based on view, status, priority, and search
  const visibleTodos = useMemo(() => {
    let result = [...allTodos];

    // 1. View filtering
    if (currentView === "today") {
      const now = new Date();
      const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      result = result.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        const targetStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        return targetStr <= todayStr;
      });
    } else if (currentView === "upcoming") {
      const now = new Date();
      const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      result = result.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        const targetStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        return targetStr > todayStr;
      });
    } else if (currentView === "completed") {
      result = result.filter((t) => t.completed);
    } else if (activeFolderId) {
      result = result.filter((t) => t.folderId === activeFolderId);
    }
    // "all" view shows all tasks

    // 2. Status filtering
    if (statusFilter === "completed") {
      result = result.filter((t) => t.completed);
    } else if (statusFilter === "incomplete") {
      result = result.filter((t) => !t.completed);
    }

    // 3. Priority filtering
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // 4. Search filtering
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // 5. Sorting
    if (sortBy === "oldest") {
      result.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === "priority") {
      const rank: Record<string, number> = { high: 3, medium: 2, low: 1 };
      result.sort((a, b) => rank[b.priority] - rank[a.priority]);
    } else if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "custom") {
      result.sort((a, b) => a.order - b.order);
    } else {
      // Default: "newest" -> newest tasks first
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [allTodos, currentView, activeFolderId, statusFilter, priorityFilter, search, sortBy]);

  // Contextual view statistics
  const viewCompletedCount = useMemo(() => {
    return visibleTodos.filter((t) => t.completed).length;
  }, [visibleTodos]);

  const viewTotalCount = visibleTodos.length;
  const viewProgressPercent =
    viewTotalCount > 0 ? Math.round((viewCompletedCount / viewTotalCount) * 100) : 0;

  // Folder Operations
  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await createFolder(name);
      setFolders((prev) => [...prev, newFolder]);
      setCurrentView(`folder:${newFolder._id}`);
      showToast(`Folder "${newFolder.name}" created`, "success");
    } catch {
      showToast("Failed to create folder", "error");
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    try {
      const updated = await updateFolder(id, name);
      setFolders((prev) =>
        prev.map((f) => (f._id === id ? { ...f, name: updated.name } : f))
      );
      showToast(`Folder renamed to "${updated.name}"`, "success");
    } catch {
      showToast("Failed to rename folder", "error");
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    const folderId = folderToDelete._id;
    const folderName = folderToDelete.name;

    try {
      await deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f._id !== folderId));
      // Remove all tasks that belonged to this folder
      setAllTodos((prev) => prev.filter((t) => t.folderId !== folderId));

      if (currentView === `folder:${folderId}`) {
        setCurrentView("all");
      }
      setFolderToDelete(null);
      showToast(`Folder "${folderName}" and its tasks deleted`, "info");
    } catch {
      showToast("Failed to delete folder", "error");
    }
  };

  // Task Operations
  const handleCreateTodo = async (data: {
    title?: string;
    titles?: string[];
    priority: TodoPriority;
    folderId?: string;
    description?: string;
    dueDate?: string;
  }) => {
    if (data.titles && data.titles.length > 1) {
      const createdList = await createTodos({
        titles: data.titles,
        priority: data.priority,
        folderId: data.folderId,
        description: data.description,
        dueDate: data.dueDate
      });
      setAllTodos((prev) => [...createdList, ...prev]);
      await refreshFolders();
      showToast(`${createdList.length} tasks created`, "success");
    } else {
      const singleTitle = data.title || (data.titles ? data.titles[0] : "");
      if (!singleTitle) return;
      const newTodo = await createTodo({
        title: singleTitle,
        priority: data.priority,
        folderId: data.folderId,
        description: data.description,
        dueDate: data.dueDate
      });
      setAllTodos((prev) => [newTodo, ...prev]);
      await refreshFolders();
      showToast("Task created", "success");
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    const nextCompleted = !todo.completed;
    // Optimistic update
    setAllTodos((prev) =>
      prev.map((t) =>
        t._id === todo._id ? { ...t, completed: nextCompleted } : t
      )
    );

    try {
      await updateTodo(todo._id, { completed: nextCompleted });
    } catch {
      // Revert on failure
      setAllTodos((prev) =>
        prev.map((t) =>
          t._id === todo._id ? { ...t, completed: todo.completed } : t
        )
      );
      showToast("Failed to update task", "error");
    }
  };

  const handleUpdateTodo = async (
    id: string,
    data: Partial<Pick<Todo, "title" | "priority" | "description" | "dueDate">>
  ) => {
    try {
      const updated = await updateTodo(id, data);
      setAllTodos((prev) =>
        prev.map((t) => (t._id === id ? updated : t))
      );
      showToast("Task updated", "success");
    } catch {
      showToast("Failed to save task changes", "error");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setAllTodos((prev) => prev.filter((t) => t._id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await refreshFolders();
      showToast("Task deleted", "info");
    } catch {
      showToast("Failed to delete task", "error");
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(visibleTodos.map((t) => t._id)));
  };

  const handleSelectMarked = () => {
    setSelectedIds(new Set(visibleTodos.filter((t) => t.completed).map((t) => t._id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirmDeleteMarked = async () => {
    const markedIds = visibleTodos.filter((t) => t.completed).map((t) => t._id);
    if (markedIds.length === 0) {
      setShowDeleteMarkedModal(false);
      return;
    }

    try {
      await bulkDeleteTodos(markedIds);
      setAllTodos((prev) => prev.filter((t) => !markedIds.includes(t._id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        markedIds.forEach((id) => next.delete(id));
        return next;
      });
      await refreshFolders();
      showToast(`${markedIds.length} marked task${markedIds.length === 1 ? "" : "s"} deleted`, "success");
    } catch {
      showToast("Failed to delete marked tasks", "error");
    } finally {
      setShowDeleteMarkedModal(false);
    }
  };

  const handleConfirmDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) {
      setShowDeleteSelectedModal(false);
      return;
    }

    try {
      await bulkDeleteTodos(idsToDelete);
      setAllTodos((prev) => prev.filter((t) => !idsToDelete.includes(t._id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      await refreshFolders();
      showToast(`${idsToDelete.length} task${idsToDelete.length === 1 ? "" : "s"} deleted`, "success");
    } catch {
      showToast("Failed to delete selected tasks", "error");
    } finally {
      setShowDeleteSelectedModal(false);
    }
  };

  const handlePriorityChange = async (todo: Todo, priority: TodoPriority) => {
    try {
      const updated = await updateTodo(todo._id, { priority });
      setAllTodos((prev) =>
        prev.map((t) => (t._id === todo._id ? updated : t))
      );
    } catch {
      showToast("Failed to update priority", "error");
    }
  };

  // Drag and Drop (Reordering)
  const handleDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedTodoId(id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (!draggedTodoId || draggedTodoId === targetId) {
      setDraggedTodoId(null);
      return;
    }

    const currentIndex = allTodos.findIndex((t) => t._id === draggedTodoId);
    const targetIndex = allTodos.findIndex((t) => t._id === targetId);

    if (currentIndex === -1 || targetIndex === -1) {
      setDraggedTodoId(null);
      return;
    }

    const reordered = [...allTodos];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setAllTodos(reordered);
    setDraggedTodoId(null);

    try {
      await reorderTodos(draggedTodoId, targetIndex);
    } catch {
      showToast("Failed to save reordered tasks", "error");
    }
  };

  // Subtask Operations
  const handleAddSubtask = async (todoId: string, title: string) => {
    try {
      const updated = await addSubtask(todoId, title);
      setAllTodos((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch {
      showToast("Failed to add subtask", "error");
    }
  };

  const handleUpdateSubtask = async (
    todoId: string,
    subtaskId: string,
    data: { title?: string; completed?: boolean }
  ) => {
    try {
      const updated = await updateSubtask(todoId, subtaskId, data);
      setAllTodos((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch {
      showToast("Failed to update subtask", "error");
    }
  };

  const handleDeleteSubtask = async (todoId: string, subtaskId: string) => {
    try {
      const updated = await deleteSubtask(todoId, subtaskId);
      setAllTodos((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch {
      showToast("Failed to delete subtask", "error");
    }
  };

  // View Title and Breadcrumb Helpers
  const viewTitle = useMemo(() => {
    if (currentView === "all") return "All Tasks";
    if (currentView === "today") return "Today";
    if (currentView === "upcoming") return "Upcoming";
    if (currentView === "completed") return "Completed";
    if (activeFolder) return activeFolder.name;
    return "Tasks";
  }, [currentView, activeFolder]);

  const breadcrumbText = useMemo(() => {
    if (activeFolder) {
      return `Workspace › Folders › ${activeFolder.name}`;
    }
    return `Workspace › ${viewTitle}`;
  }, [activeFolder, viewTitle]);

  return (
    <div className="app-shell">
      {/* Toast Feedback Messages */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Responsive Two-Column Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        folders={folders}
        folderTaskCounts={folderTaskCounts}
        allTasksCount={allTasksCount}
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        completedCount={completedCount}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={(id) => {
          const folder = folders.find((f) => f._id === id);
          if (folder) setFolderToDelete(folder);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Main Content Area */}
      <main className="main-viewport">
        {/* Top bar with breadcrumb and completion stats */}
        <header className="topbar">
          <div className="topbar__left">
            <button
              className="topbar__mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <nav className="topbar__breadcrumb" aria-label="Breadcrumb">
              <span>{breadcrumbText}</span>
            </nav>
          </div>

          {/* Contextual Completion Summary Bar */}
          <div className="topbar__summary">
            <span className="topbar__summary-text">
              {viewCompletedCount} of {viewTotalCount} completed ({viewProgressPercent}%)
            </span>
            <div className="topbar__progress-track" title={`${viewProgressPercent}% complete`}>
              <div
                className="topbar__progress-fill"
                style={{ width: `${viewProgressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <div className="content-container">
          {/* Header Title Section */}
          <section className="view-heading">
            <div className="view-heading__row">
              <h1 className="view-heading__title">{viewTitle}</h1>
              {activeFolder && (
                <span className="view-heading__badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                  Folder
                </span>
              )}
            </div>
            <p className="view-heading__subtitle">
              {viewTotalCount} {viewTotalCount === 1 ? "task" : "tasks"} · {viewCompletedCount} completed
            </p>
          </section>

          {/* Error Banner */}
          {error && (
            <div className="error-alert" role="alert">
              <span>{error}</span>
              <button
                className="error-alert__retry"
                onClick={loadInitialData}
              >
                Retry
              </button>
            </div>
          )}

          {/* Sticky Compact Task Creation Input */}
          <div className="sticky-task-creator">
            <AddTodoForm
              activeFolder={activeFolder}
              folders={folders}
              onAdd={handleCreateTodo}
            />
          </div>

          {/* Search, Filter & Sort Toolbar */}
          <div className="toolbar">
            <div className="toolbar__search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="toolbar__search-input"
                value={search}
                placeholder="Filter tasks by title or description…"
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="toolbar__search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="toolbar__filters">
              {/* Status Segmented Filter */}
              <div className="segmented-control">
                <button
                  className={`segmented-control__item ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </button>
                <button
                  className={`segmented-control__item ${statusFilter === "incomplete" ? "active" : ""}`}
                  onClick={() => setStatusFilter("incomplete")}
                >
                  Active
                </button>
                <button
                  className={`segmented-control__item ${statusFilter === "completed" ? "active" : ""}`}
                  onClick={() => setStatusFilter("completed")}
                >
                  Done
                </button>
              </div>

              {/* Priority Filter */}
              <select
                className="toolbar__select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                aria-label="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Sort By Selector */}
              <select
                className="toolbar__select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort tasks"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority (High to Low)</option>
                <option value="dueDate">Due Date</option>
                <option value="custom">Manual Order</option>
                <option value="alphabetical">Alphabetical</option>
              </select>

              {/* Option to delete all marked (completed) tasks */}
              {viewCompletedCount > 0 && (
                <button
                  type="button"
                  className="toolbar__delete-marked-btn"
                  onClick={() => setShowDeleteMarkedModal(true)}
                  title="Delete all marked (completed) tasks in this view"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  <span>Delete Marked ({viewCompletedCount})</span>
                </button>
              )}

              {/* Multi-Select mode toggle */}
              <button
                type="button"
                className={`toolbar__select-mode-btn ${isSelectMode ? "active" : ""}`}
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedIds(new Set());
                }}
                title={isSelectMode ? "Cancel selection" : "Select multiple tasks to delete"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <span>{isSelectMode ? "Cancel" : "Select"}</span>
              </button>
            </div>
          </div>

          {/* Batch Action Bar when Multi-Select mode is active */}
          {isSelectMode && (
            <div className="batch-action-bar">
              <div className="batch-action-bar__info">
                <span className="batch-action-bar__count">
                  {selectedIds.size} of {visibleTodos.length} selected
                </span>
              </div>
              <div className="batch-action-bar__actions">
                <button
                  type="button"
                  className="batch-btn"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
                {viewCompletedCount > 0 && (
                  <button
                    type="button"
                    className="batch-btn"
                    onClick={handleSelectMarked}
                  >
                    Select Marked ({viewCompletedCount})
                  </button>
                )}
                <button
                  type="button"
                  className="batch-btn"
                  onClick={handleDeselectAll}
                  disabled={selectedIds.size === 0}
                >
                  Deselect
                </button>
                <button
                  type="button"
                  className="batch-btn batch-btn--danger"
                  onClick={() => setShowDeleteSelectedModal(true)}
                  disabled={selectedIds.size === 0}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Delete Selected ({selectedIds.size})
                </button>
                <button
                  type="button"
                  className="batch-btn batch-btn--close"
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Task List Content Area */}
          <section className="task-list-section">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <span>Loading tasks…</span>
              </div>
            ) : visibleTodos.length > 0 ? (
              <div className="task-list">
                {visibleTodos.map((todo) => (
                  <TodoItem
                    key={todo._id}
                    todo={todo}
                    isDraggable={sortBy === "custom" && !search.trim()}
                    isDragging={draggedTodoId === todo._id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onToggle={handleToggleTodo}
                    onUpdate={handleUpdateTodo}
                    onDelete={handleDeleteTodo}
                    onPriorityChange={handlePriorityChange}
                    onAddSubtask={handleAddSubtask}
                    onUpdateSubtask={handleUpdateSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(todo._id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            ) : (
              /* Contextual Empty States */
              <div className="empty-state">
                <div className="empty-state__icon">
                  {search ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  ) : currentView === "completed" ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ) : currentView === "today" ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </div>

                <h3 className="empty-state__title">
                  {search
                    ? "No matching tasks found"
                    : statusFilter === "completed"
                    ? "No completed tasks"
                    : currentView === "today"
                    ? "No tasks due today"
                    : currentView === "upcoming"
                    ? "No upcoming tasks"
                    : activeFolder
                    ? `No tasks in ${activeFolder.name}`
                    : "No tasks to display"}
                </h3>

                <p className="empty-state__description">
                  {search
                    ? `We couldn't find any tasks matching "${search}". Try adjusting your keywords.`
                    : statusFilter === "completed"
                    ? "Complete some tasks to see them reflected here."
                    : currentView === "today"
                    ? "You are all caught up for today! Enjoy your day or plan ahead."
                    : currentView === "upcoming"
                    ? "Schedule due dates on your tasks to organize future work."
                    : activeFolder
                    ? "Create your first task in this folder using the input above."
                    : "Create a task above to start organizing your work."}
                </p>

                {search && (
                  <button
                    className="empty-state__action-btn"
                    onClick={() => setSearch("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Confirmation Modal for Folder Deletion */}
      {folderToDelete && (
        <div className="modal-backdrop" onClick={() => setFolderToDelete(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-folder-title"
          >
            <div className="modal-card__header">
              <div className="modal-card__warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 id="delete-folder-title" className="modal-card__title">
                  Delete Folder
                </h3>
                <p className="modal-card__description">
                  Are you sure you want to delete <strong>"{folderToDelete.name}"</strong>? All
                  tasks inside this folder will also be permanently deleted.
                </p>
              </div>
            </div>

            <div className="modal-card__actions">
              <button
                type="button"
                className="modal-card__btn-cancel"
                onClick={() => setFolderToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-card__btn-danger"
                onClick={handleConfirmDeleteFolder}
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Marked / Completed Tasks */}
      {showDeleteMarkedModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDeleteMarkedModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-marked-title"
          >
            <div className="modal-card__header">
              <div className="modal-card__warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <div>
                <h3 id="delete-marked-title" className="modal-card__title">
                  Delete Marked Items?
                </h3>
                <p className="modal-card__description">
                  Are you sure you want to permanently delete all{" "}
                  <strong>{viewCompletedCount}</strong> marked (completed) task
                  {viewCompletedCount === 1 ? "" : "s"} in this view? This action
                  cannot be undone.
                </p>
              </div>
            </div>

            <div className="modal-card__actions">
              <button
                type="button"
                className="modal-card__btn-cancel"
                onClick={() => setShowDeleteMarkedModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-card__btn-danger"
                onClick={handleConfirmDeleteMarked}
              >
                Delete {viewCompletedCount} Marked Task
                {viewCompletedCount === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Multi-Selected Tasks */}
      {showDeleteSelectedModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDeleteSelectedModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-selected-title"
          >
            <div className="modal-card__header">
              <div className="modal-card__warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <div>
                <h3 id="delete-selected-title" className="modal-card__title">
                  Delete Selected Items?
                </h3>
                <p className="modal-card__description">
                  Are you sure you want to permanently delete{" "}
                  <strong>{selectedIds.size}</strong> selected task
                  {selectedIds.size === 1 ? "" : "s"}? This action cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="modal-card__actions">
              <button
                type="button"
                className="modal-card__btn-cancel"
                onClick={() => setShowDeleteSelectedModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-card__btn-danger"
                onClick={handleConfirmDeleteSelected}
              >
                Delete {selectedIds.size} Task
                {selectedIds.size === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Downloading / Installing on Laptop */}
      {showInstallModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="modal-card modal-card--laptop-install"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="install-modal-title"
          >
            <div className="laptop-install-header">
              <div className="laptop-install-logo-wrap">
                <img
                  src="/todo.png"
                  alt="TaskBoard App Logo"
                  className="laptop-install-logo"
                />
              </div>
              <div className="laptop-install-header-text">
                <h3 id="install-modal-title" className="laptop-install-title">
                  Install TaskBoard on Laptop
                </h3>
                <p className="laptop-install-desc">
                  Run TaskBoard as a desktop application on your Windows or Mac laptop with instant startup and offline capability.
                </p>
              </div>
            </div>

            <div className="laptop-install-actions">
              {deferredPrompt ? (
                <button
                  type="button"
                  className="laptop-install-btn laptop-install-btn--primary"
                  onClick={handleTriggerInstall}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Install App on Laptop (1-Click)</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="laptop-install-btn laptop-install-btn--primary"
                  onClick={handleDownloadDesktopShortcut}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span>Download Desktop Shortcut (.url)</span>
                </button>
              )}

              <button
                type="button"
                className="laptop-install-btn laptop-install-btn--secondary"
                onClick={handleDownloadDesktopShortcut}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Save Windows / Mac Shortcut</span>
              </button>
            </div>

            <div className="laptop-install-guide">
              <h4 className="laptop-install-guide-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                How to install in browser on Laptop:
              </h4>
              <ol className="laptop-install-steps">
                <li>
                  <strong>Chrome & Brave:</strong> Click the <em>Install icon</em> (⊕) on the right side of your address bar, or click Menu (⋮) → <em>"Save and share"</em> → <em>"Install TaskBoard"</em>.
                </li>
                <li>
                  <strong>Microsoft Edge:</strong> Click the <em>App available</em> icon (⊞) in the address bar, or click (...) → <em>Apps</em> → <em>"Install this site as an app"</em>.
                </li>
                <li>
                  <strong>Instant Desktop Launcher:</strong> Click <em>"Download Desktop Shortcut"</em> above to get a direct desktop shortcut on your laptop.
                </li>
              </ol>
            </div>

            <div className="modal-card__actions" style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="modal-card__btn-cancel"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setShowInstallModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}