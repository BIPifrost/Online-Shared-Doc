import { useEffect, useRef } from "react";

type SidebarDrawerProps = {
  isOpen: boolean;
  position: "left" | "right";
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
};

export function SidebarDrawer({
  isOpen,
  position,
  onClose,
  children,
  width = "360px"
}: SidebarDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div className="sidebar-drawer-overlay" onClick={onClose} aria-hidden="true" />
      )}

      {/* 抽屉面板 */}
      <aside
        ref={drawerRef}
        className={`sidebar-drawer sidebar-drawer--${position}${
          isOpen ? " sidebar-drawer--open" : ""
        }`}
        style={{ width }}
      >
        <button
          className="sidebar-drawer-close"
          onClick={onClose}
          title="关闭面板 (ESC)"
          aria-label="关闭面板"
        >
          ×
        </button>
        <div className="sidebar-drawer-content">{children}</div>
      </aside>
    </>
  );
}
