import type { GridSettings } from "@/lib/api-public";

export function GridOverlay({
  enabled,
  columns = 12,
  columnColor = "rgba(255, 0, 102, 0.1)",
  columnGap = 20,
  maxWidth = 1440,
  marginH = 60,
  rowsEnabled,
  rowHeight = 8,
  rowColor = "rgba(0, 100, 255, 0.08)",
}: GridSettings) {
  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: `${maxWidth}px`,
          height: "100%",
          position: "relative",
        }}
      >
        {/* Column grid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${marginH}px`,
            right: `${marginH}px`,
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${columnGap}px`,
          }}
        >
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} style={{ backgroundColor: columnColor }} />
          ))}
        </div>

        {/* Row grid */}
        {rowsEnabled ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${rowHeight - 1}px, ${rowColor} ${rowHeight - 1}px, ${rowColor} ${rowHeight}px)`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
