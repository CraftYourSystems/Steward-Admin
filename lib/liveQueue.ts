import type { KitchenOrder, KitchenOrderItem } from "@/types";

/**
 * Returns dynamic batch capacity based on category name.
 */
export function getCategoryCapacity(categoryName: string): number {
  const name = categoryName.toLowerCase();
  if (name.includes("bread") || name.includes("rotis") || name.includes("naan")) return 12;
  if (name.includes("beverage") || name.includes("drink") || name.includes("juice") || name.includes("lassi") || name.includes("chai")) return 15;
  if (name.includes("main") || name.includes("curry") || name.includes("biryani")) return 6;
  if (name.includes("dessert") || name.includes("sweet")) return 10;
  return 8; // default cap = 8
}

/**
 * Checks if the kitchen order item belongs to the selected category.
 */
export function isItemInCategory(item: KitchenOrderItem, categoryId: string): boolean {
  return (item.menuItem as any)?.categoryId === categoryId;
}

/**
 * Total quantity of items for a specific category in an order.
 */
export function categoryQuantityForOrder(order: KitchenOrder, categoryId: string): number {
  return order.items
    .filter((item) => isItemInCategory(item, categoryId))
    .reduce((sum, item) => sum + item.quantity, 0);
}

export interface LiveQueuePartition {
  current: KitchenOrder[];
  upcoming: KitchenOrder[];
}

/**
 * Partitions active orders into CURRENT / UPCOMING sections for the selected category.
 */
export function partitionLiveQueue(
  orders: KitchenOrder[],
  categoryId: string,
  capacity: number
): LiveQueuePartition {
  const categoryOrders = orders
    .filter((o) => categoryQuantityForOrder(o, categoryId) > 0)
    .slice() // clone
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const current: KitchenOrder[] = [];
  const upcoming: KitchenOrder[] = [];
  let cumulativeQty = 0;

  for (const order of categoryOrders) {
    const qty = categoryQuantityForOrder(order, categoryId);

    if (cumulativeQty + qty <= capacity) {
      current.push(order);
      cumulativeQty += qty;
    } else {
      upcoming.push(order);
    }
  }

  return { current, upcoming };
}

export interface AggregatedLiveItem {
  name: string;
  totalQuantity: number;
}

/**
 * Aggregates category-specific items from a list of orders.
 */
export function aggregateLiveItems(
  orders: KitchenOrder[],
  categoryId: string
): AggregatedLiveItem[] {
  const map = new Map<string, { display: string; qty: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      if (!isItemInCategory(item, categoryId)) continue;

      const key = item.name.trim().toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.qty += item.quantity;
      } else {
        map.set(key, {
          display: toTitleCase(item.name.trim()),
          qty: item.quantity,
        });
      }
    }
  }

  return Array.from(map.values())
    .map(({ display, qty }) => ({ name: display, totalQuantity: qty }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}
