// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "KITCHEN_STAFF" | "WAITER";

export type OrderStatus =
  | "NEW"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "COUNTER_PICKUP";

export type KitchenType = "MAIN" | "TIME_TAKING" | "READY_TO_SERVE";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface BranchSummary {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface QrCode {
  id: string;
  branchId: string;
  code: string;
  name: string | null;
  tableNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  restaurantId: string | null;
  currentBranchId?: string | null;
  assignedBranchId?: string | null;
  avatarUrl?: string | null;
  authProvider?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    restaurantCode?: string;
  };
  currentBranch?: BranchSummary | null;
  accessibleBranches?: BranchSummary[];
  requiresBranchSelection?: boolean;
  branchSelectionToken?: string;
  branches?: BranchSummary[];
  expiresIn?: number;
  csrfToken?: string;
}

export interface StaffLoginResponse {
  accessToken: string;
  user: User;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    restaurantCode: string;
  };
  currentBranchId?: string | null;
  csrfToken?: string;
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  restaurantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  kitchenType: KitchenType;
  isAvailable: boolean;
  isPopular: boolean;
  isVeg: boolean;
  calories: number | null;
  prepTimeMins: number;
  sortOrder: number;
  category: { id: string; name: string };
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemFormData {
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  kitchenType: KitchenType;
  isAvailable: boolean;
  isPopular: boolean;
  isVeg: boolean;
  calories?: number;
  prepTimeMins: number;
  sortOrder: number;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  name: string;
  quantity: number;
  price: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  tableNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  estimatedMins: number;
  createdAt: string;
  startedPreparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}

export interface OrderFilters {
  status?: OrderStatus | "";
  orderType?: OrderType | "";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancellationRate: number;
  avgPrepTimeMins: number;
  avgKitchenDelayMins?: number;
  revenuePerCustomer?: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface TopItem {
  menuItemId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface HourlyDataPoint {
  hour: number;
  count: number;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// ── Advanced Analytics ────────────────────────────────────────────────────────

export interface ItemPerformanceItem {
  menuItemId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  percentage: number;
  marginPercentage?: number;
}

export interface ItemPerformanceData {
  bestSellers: ItemPerformanceItem[];
  worstSellers: ItemPerformanceItem[];
  totalItemsSold: number;
}

export interface InsightsDayStats {
  orders: number;
  revenue: number;
  completed: number;
  cancelled: number;
  avgPrepMins: number;
  avgOrderValue: number;
}

export interface TodaysInsightsData {
  today: InsightsDayStats;
  yesterday: InsightsDayStats;
  changes: {
    revenue: number;
    orders: number;
    avgPrepMins: number;
    avgOrderValue: number;
  };
}

export interface PeakHourEntry {
  hour: number;
  orders: number;
  revenue: number;
  isPeak: boolean;
  isQuiet: boolean;
}

export interface HeatmapEntry {
  dayOfWeek: number;
  hour: number;
  orders: number;
  intensity: number;
}

export interface PeakHourData {
  distribution: PeakHourEntry[];
  heatmap?: HeatmapEntry[];
  peakHour: number | null;
  peakOrders: number;
  peakRevenue: number;
  quietHours: number[];
  avgOrdersPerHour: number;
}

export interface HealthScoreData {
  score: number;
  grade: string;
  breakdown: {
    cancellation: { score: number; max: number; rate: number };
    prepTime: { score: number; max: number; avgMins: number };
    salesTrend: {
      score: number;
      max: number;
      thisWeekRevenue: number;
      lastWeekRevenue: number;
      growthPct: number | null;
    };
  };
  periodLabel: string;
}

export interface ItemCombination {
  itemA: { id: string; name: string };
  itemB: { id: string; name: string };
  frequency: number;
  percentage: number;
}

// ─── Kitchen ─────────────────────────────────────────────────────────────────

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number | string;
  notes?: string;
  menuItem?: Pick<MenuItem, "id" | "name" | "kitchenType">;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber?: string | null;
  status: OrderStatus;
  createdAt: string;
  /** Timestamp when status moved to PREPARING — used for kitchen timer */
  startedPreparingAt?: string | null;
  notes?: string | null;
  totalAmount: number | string;
  items: KitchenOrderItem[];
  paymentMethod?: string;
  paymentStatus?: string;
  delayReason?: string | null;
}

// Active states shown on the kanban board
export const ACTIVE_KITCHEN_STATUSES: OrderStatus[] = ["NEW", "PREPARING", "READY"];

// Status flow for the kanban board
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  NEW:       ["PREPARING"],
  PREPARING: ["READY"],
  READY:     ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

// Button labels for each transition
export const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  NEW:       "Start Preparing",
  PREPARING: "Mark Ready",
  READY:     "Complete",
};
