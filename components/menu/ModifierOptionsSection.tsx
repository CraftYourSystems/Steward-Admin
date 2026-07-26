import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ModifierOption } from "@/types";

interface ModifierOptionsSectionProps {
  options: ModifierOption[];
  onReorder: (result: DropResult) => void;
  onEdit: (option: ModifierOption) => void;
  onDelete: (optionId: string) => void;
  onAddClick: () => void;
  onToggleActive: (option: ModifierOption) => void;
}

export function ModifierOptionsSection({
  options,
  onReorder,
  onEdit,
  onDelete,
  onAddClick,
  onToggleActive,
}: ModifierOptionsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-fg">Options inside this Group</h3>
          <p className="text-[11px] text-fg-subtle">Set up sizing, prices, and visual list ordering.</p>
        </div>
        <Button type="button" size="sm" onClick={onAddClick}>
          Add Option
        </Button>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-white/5 rounded-lg text-[12px] text-fg-subtle bg-[#111112]">
          No options created inside this group.
        </div>
      ) : (
        <DragDropContext onDragEnd={onReorder}>
          <Droppable droppableId="modifier-options-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {options
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((opt, idx) => (
                    <Draggable
                      key={opt.id}
                      draggableId={opt.id}
                      index={idx}
                    >
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-white/5 bg-[#151517]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              {...dragProvided.dragHandleProps}
                              className="cursor-grab text-fg-subtle hover:text-fg transition-colors"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-fg flex items-center gap-2">
                                <span className={!opt.active ? "text-fg-subtle line-through" : ""}>
                                  {opt.name}
                                </span>
                                {!opt.active && (
                                  <Badge className="bg-white/5 text-fg-subtle border-none text-[8px] px-1 py-0 shadow-none">
                                    Disabled
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-accent mt-0.5 font-medium">
                                + {formatCurrency(opt.priceAdjustment)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleActive(opt)}
                              className="text-[10px] border-white/5 hover:bg-white/5 h-7"
                            >
                              {opt.active ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => onEdit(opt)}
                              className="h-7 w-7 border-white/5 hover:bg-white/5"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <button
                              type="button"
                              onClick={() => onDelete(opt.id)}
                              className="text-fg-subtle hover:text-danger p-1.5 rounded transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
