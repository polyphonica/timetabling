"use client";

import { useDraggable } from "@dnd-kit/core";

export function StudentChip({
  id,
  name,
  skills,
  selected,
  onToggleSelected,
}: {
  id: string;
  name: string;
  skills: string[];
  selected: boolean;
  onToggleSelected: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `student:${id}`,
    data: { personId: id, name },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-start gap-2 rounded-md border bg-background px-2 py-1 text-sm select-none active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      } ${selected ? "border-primary bg-accent" : ""}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelected}
        onPointerDown={(e) => e.stopPropagation()}
        className="mt-0.5 size-4 shrink-0"
        aria-label={`Select ${name}`}
      />
      <div className="flex flex-col">
        <span>{name}</span>
        {skills.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {skills.join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}
