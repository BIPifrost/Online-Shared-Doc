import { useCallback, useEffect, useRef } from "react";

type ResizableSplitPaneProps = {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  splitRatio: number; // 0-100，左侧占比
  onSplitRatioChange: (ratio: number) => void;
  leftFullscreen?: boolean;
  rightFullscreen?: boolean;
};

export function ResizableSplitPane({
  leftContent,
  rightContent,
  splitRatio,
  onSplitRatioChange,
  leftFullscreen = false,
  rightFullscreen = false
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = event.clientX - containerRect.left;
      const newRatio = (relativeX / containerRect.width) * 100;

      onSplitRatioChange(newRatio);
    },
    [onSplitRatioChange]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // 全屏模式处理
  if (leftFullscreen) {
    return <div className="split-pane-fullscreen">{leftContent}</div>;
  }

  if (rightFullscreen) {
    return <div className="split-pane-fullscreen">{rightContent}</div>;
  }

  return (
    <div ref={containerRef} className="resizable-split-pane">
      <div
        className="split-pane-left"
        style={{ flexBasis: `${splitRatio}%` }}
      >
        {leftContent}
      </div>

      <div
        className="split-pane-resizer"
        onMouseDown={handleMouseDown}
        title="拖动调整左右比例"
      >
        <div className="split-pane-resizer-handle" />
      </div>

      <div
        className="split-pane-right"
        style={{ flexBasis: `${100 - splitRatio}%` }}
      >
        {rightContent}
      </div>
    </div>
  );
}
