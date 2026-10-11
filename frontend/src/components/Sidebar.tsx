import { useState, useRef, useEffect } from "react";
import type { Folder } from "../types/todo";

export type NavView = "all" | "today" | "upcoming" | "completed";

interface SidebarProps {
  currentView: string; // "all" | "today" | "upcoming" | "completed" | "folder:${id}"
  onSelectView: (view: string) => void;
  folders: Folder[];
  folderTaskCounts: Record<string, number>;
  allTasksCount: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenInstallModal?: () => void;
}

export default function Sidebar({
  currentView,
  onSelectView,
  folders,
  folderTaskCounts,
  allTasksCount,
  todayCount,
  upcomingCount,
  completedCount,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  isMobileOpen,
  onCloseMobile,
  onOpenInstallModal
}: SidebarProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [menuOpenFolderId, setMenuOpenFolderId] = useState<string | null>(null);

  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCreatingFolder && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  useEffect(() => {
    if (editingFolderId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFolderId]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFolderId(null);
      }
    };
    if (menuOpenFolderId) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpenFolderId]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
    }
  };

  const handleSaveRename = (id: string) => {
    if (editingFolderName.trim()) {
      onRenameFolder(id, editingFolderName.trim());
      setEditingFolderId(null);
      setEditingFolderName("");
    }
  };

  const handleNavClick = (view: string) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? "sidebar--mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar__brand">
          <div className="sidebar__logo-container">
            <div className="sidebar__logo-wrap">
              <img
                src="/todo.png"
                alt="TaskBoard App Logo"
                className="sidebar__logo-img"
              />
            </div>
            <div>
              <h2 className="sidebar__brand-name">TaskBoard</h2>
              <span className="sidebar__brand-tag">Workspace</span>
            </div>
          </div>

          <button
            className="sidebar__mobile-close"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Primary Navigation Views */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          <div className="sidebar__section">
            <button
              className={`sidebar__nav-item ${currentView === "all" ? "sidebar__nav-item--active" : ""}`}
              onClick={() => handleNavClick("all")}
            >
              <svg className="sidebar__nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <span className="sidebar__nav-label">All Tasks</span>
              <span className="sidebar__nav-badge">{allTasksCount}</span>
            </button>

            <button
              className={`sidebar__nav-item ${currentView === "today" ? "sidebar__nav-item--active" : ""}`}
              onClick={() => handleNavClick("today")}
            >
              <svg className="sidebar__nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="sidebar__nav-label">Today</span>
              <span className="sidebar__nav-badge">{todayCount}</span>
            </button>

            <button
              className={`sidebar__nav-item ${currentView === "upcoming" ? "sidebar__nav-item--active" : ""}`}
              onClick={() => handleNavClick("upcoming")}
            >
              <svg className="sidebar__nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="sidebar__nav-label">Upcoming</span>
              <span className="sidebar__nav-badge">{upcomingCount}</span>
            </button>

            <button
              className={`sidebar__nav-item ${currentView === "completed" ? "sidebar__nav-item--active" : ""}`}
              onClick={() => handleNavClick("completed")}
            >
              <svg className="sidebar__nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="sidebar__nav-label">Completed</span>
              <span className="sidebar__nav-badge">{completedCount}</span>
            </button>
          </div>

          {/* Folders Section */}
          <div className="sidebar__section sidebar__section--folders">
            <div className="sidebar__section-header">
              <span className="sidebar__section-title">Folders</span>
              <button
                className="sidebar__add-folder-btn"
                onClick={() => setIsCreatingFolder(true)}
                title="Add new folder"
                aria-label="Add folder"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            {/* Inline Folder Creation */}
            {isCreatingFolder && (
              <div className="sidebar__inline-form">
                <input
                  ref={createInputRef}
                  className="sidebar__inline-input"
                  value={newFolderName}
                  placeholder="Folder name…"
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") {
                      setIsCreatingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                  onBlur={() => {
                    if (!newFolderName.trim()) {
                      setIsCreatingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                />
                <button
                  className="sidebar__inline-confirm"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  title="Create folder"
                >
                  ✓
                </button>
                <button
                  className="sidebar__inline-cancel"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Scrollable Folder List */}
            <div className="sidebar__folder-list">
              {folders.map((folder) => {
                const isSelected = currentView === `folder:${folder._id}`;
                const isEditing = editingFolderId === folder._id;
                const isMenuOpen = menuOpenFolderId === folder._id;
                const taskCount = folderTaskCounts[folder._id] ?? folder.taskCount ?? 0;

                if (isEditing) {
                  return (
                    <div key={folder._id} className="sidebar__inline-form">
                      <input
                        ref={editInputRef}
                        className="sidebar__inline-input"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(folder._id);
                          if (e.key === "Escape") {
                            setEditingFolderId(null);
                            setEditingFolderName("");
                          }
                        }}
                        onBlur={() => handleSaveRename(folder._id)}
                      />
                      <button
                        className="sidebar__inline-confirm"
                        onClick={() => handleSaveRename(folder._id)}
                      >
                        ✓
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={folder._id} className="sidebar__folder-row">
                    <button
                      className={`sidebar__nav-item ${isSelected ? "sidebar__nav-item--active" : ""}`}
                      onClick={() => handleNavClick(`folder:${folder._id}`)}
                    >
                      <svg className="sidebar__nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      </svg>
                      <span className="sidebar__nav-label" title={folder.name}>
                        {folder.name}
                      </span>
                      <span className="sidebar__nav-badge">{taskCount}</span>
                    </button>

                    {/* Context Menu Trigger */}
                    <button
                      className="sidebar__folder-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenFolderId(isMenuOpen ? null : folder._id);
                      }}
                      title="Folder options"
                      aria-label={`Options for folder ${folder.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                        <circle cx="5" cy="12" r="2" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div ref={menuRef} className="sidebar__context-menu">
                        <button
                          className="sidebar__context-item"
                          onClick={() => {
                            setEditingFolderId(folder._id);
                            setEditingFolderName(folder.name);
                            setMenuOpenFolderId(null);
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Rename</span>
                        </button>
                        <button
                          className="sidebar__context-item sidebar__context-item--danger"
                          onClick={() => {
                            onDeleteFolder(folder._id);
                            setMenuOpenFolderId(null);
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {folders.length === 0 && !isCreatingFolder && (
                <div className="sidebar__empty-folders">
                  <span>No folders yet</span>
                  <button
                    className="sidebar__empty-add-btn"
                    onClick={() => setIsCreatingFolder(true)}
                  >
                    + Create a folder
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Footer info */}
        <div className="sidebar__footer">
          {onOpenInstallModal && (
            <button
              type="button"
              className="sidebar__install-btn"
              onClick={onOpenInstallModal}
              title="Download TaskBoard App for Laptop"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Download for Laptop</span>
              <span className="sidebar__install-badge">App</span>
            </button>
          )}
          <div className="sidebar__footer-status">
            <span className="sidebar__footer-dot" />
            <span className="sidebar__footer-text">TaskBoard Cloud Sync</span>
          </div>
        </div>
      </aside>
    </>
  );
}
