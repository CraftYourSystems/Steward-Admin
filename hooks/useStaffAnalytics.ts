import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useEmployeeEfficiency() {
  return useQuery({
    queryKey: ["staff-efficiency"],
    queryFn: async () => {
      const { data } = await api.get("/admin/staff-analytics/employee-efficiency");
      return data.data as { userId: string; name: string; totalHours: number; totalOrders: number; ordersPerHour: number; stationsCovered: string }[];
    }
  });
}

export function useOrderAccuracy() {
  return useQuery({
    queryKey: ["staff-order-accuracy"],
    queryFn: async () => {
      const { data } = await api.get("/admin/staff-analytics/order-accuracy");
      return data.data as { userId: string; name: string; totalOrders: number; correctedOrders: number; accuracyRate: number }[];
    }
  });
}

export function useScheduleAdherence() {
  return useQuery({
    queryKey: ["staff-schedule-adherence"],
    queryFn: async () => {
      const { data } = await api.get("/admin/staff-analytics/schedule-adherence");
      return data.data as { id: string; userId: string; name: string; clockIn: string; shiftStart: string | null; isLate: boolean; minutesLate: number; stationsCovered: string }[];
    }
  });
}
