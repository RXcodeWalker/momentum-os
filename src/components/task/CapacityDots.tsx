export function CapacityDots({
  fill,
  cap,
  taskCount,
}: {
  fill: number;
  cap: number;
  taskCount: number;
}) {
  return (
    <div className="flex items-center gap-1 mb-3">
      {Array.from({ length: cap }).map((_, i) => {
        const filled = i < fill;
        const isLastSlot = i === cap - 1 && taskCount === cap - 1;
        const atCap = taskCount >= cap;

        let dotClass = "h-1 w-4 rounded-full transition-all duration-300 ";
        if (!filled) {
          dotClass += "bg-muted-foreground/20";
        } else if (atCap || isLastSlot) {
          dotClass += atCap ? "bg-warning/50" : "bg-warning/40";
        } else {
          dotClass += "bg-muted-foreground/40";
        }

        return <span key={i} className={dotClass} />;
      })}
      <span className="text-[10px] text-muted-foreground/40 ml-1.5 tabular-nums">
        {taskCount}/{cap}
      </span>
    </div>
  );
}
