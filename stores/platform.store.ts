import { create } from 'zustand';

export interface PlatformRestaurant {
  id: string;
  name: string;
  slug: string;
  restaurantCode: string;
}

interface PlatformStore {
  /** The restaurant the Super Admin is currently viewing, or null if on platform view */
  selectedRestaurant: PlatformRestaurant | null;
  /** Enter a restaurant's context — all API calls will include x-restaurant-id */
  enterRestaurant: (restaurant: PlatformRestaurant) => void;
  /** Exit back to platform view */
  exitRestaurant: () => void;
}

export const usePlatformStore = create<PlatformStore>((set) => ({
  selectedRestaurant: null,
  enterRestaurant: (restaurant) => set({ selectedRestaurant: restaurant }),
  exitRestaurant: () => set({ selectedRestaurant: null }),
}));
