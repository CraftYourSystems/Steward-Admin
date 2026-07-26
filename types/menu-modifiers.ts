import { MenuItem } from "./index";

export interface ModifierOption {
  id: string;
  modifierGroupId: string;
  name: string;
  priceAdjustment: string; // decimal from backend
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemModifierGroup {
  menuItemId: string;
  modifierGroupId: string;
  required: boolean;
  minimumSelections: number;
  maximumSelections: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  menuItem?: MenuItem;
  modifierGroup?: ModifierGroup;
}

export interface ModifierGroup {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  options?: ModifierOption[];
  menuItems?: MenuItemModifierGroup[];
}
