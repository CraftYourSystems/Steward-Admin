import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuItemModifierGroup } from "@/types";

interface MenuItemModifiersSectionProps {
  attachedGroups: MenuItemModifierGroup[];
  onReorder: (result: DropResult) => void;
  onDetach: (groupId: string) => void;
  onAddClick: () => void;
}

export function MenuItemModifiersSection({
  attachedGroups,
  onReorder,
  onDetach,
  onAddClick,
}: MenuItemModifiersSectionProps) {
  return (
    <div className="space-y-3.5 pt-2">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
          Modifier Groups
        </div>
        <Button type="button" size="sm" onClick={onAddClick}>
          Attach Group
        </Button>
      </div>

      {attachedGroups.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/5 rounded-lg text-[12px] text-fg-subtle bg-[#111112]">
          No modifier groups attached to this item yet.
        </div>
      ) : (
        <DragDropContext onDragEnd={onReorder}>
          <Droppable droppableId="attached-modifiers-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {attachedGroups
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((link, idx) => {
                    const group = link.modifierGroup;
                    if (!group) return null;

                    return (
                      <Draggable
                        key={group.id}
                        draggableId={group.id}
                        index={idx}
                      >
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-[#151517]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                {...dragProvided.dragHandleProps}
                                className="cursor-grab text-fg-subtle hover:text-fg transition-colors"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12px] font-medium text-fg truncate">
                                  {group.name}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {link.required ? (
                                    <Badge className="bg-danger/10 text-danger border-none text-[9px] px-1 py-0 shadow-none">
                                      Required
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-fg-muted/10 text-fg-muted border-none text-[9px] px-1 py-0 shadow-none">
                                      Optional
                                    </Badge>
                                  )}
                                  <Badge className="bg-white/5 text-fg border-none text-[9px] px-1 py-0 shadow-none">
                                    Min: {link.minimumSelections}
                                  </Badge>
                                  <Badge className="bg-white/5 text-fg border-none text-[9px] px-1 py-0 shadow-none">
                                    Max: {link.maximumSelections}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onDetach(group.id)}
                              className="text-fg-subtle hover:text-danger p-1 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
