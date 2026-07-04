"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { usePlatformStore, type PlatformRestaurant } from "@/stores/platform.store";
import {
  Shield, Store, Users, ShoppingCart, IndianRupee,
  Search, ArrowRight, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#27272a] bg-[#18181b] p-5 transition-colors hover:border-[#3f3f46]">
      {/* Subtle gradient accent at top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-600/60 via-violet-500/30 to-transparent" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa]">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-[#27272a]" />
          ) : (
            <p className="mt-1.5 text-2xl font-semibold text-fg">{value}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Platform Page ────────────────────────────────────────────────────────────

export default function PlatformPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const res = await api.get("/platform/stats");
      return res.data.data;
    },
  });

  // ── Restaurants ───────────────────────────────────────────────────────────
  const { data: restaurantsData, isLoading: restaurantsLoading } = useQuery({
    queryKey: ["platform-restaurants", debouncedSearch, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get("/platform/restaurants", { params });
      return res.data.data;
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEnterRestaurant = (restaurant: PlatformRestaurant) => {
    usePlatformStore.getState().enterRestaurant(restaurant);
    router.push("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch { /* ignore */ }
    useAuthStore.getState().clearAuth();
    usePlatformStore.getState().exitRestaurant();
    router.push("/login");
  };

  const restaurants = restaurantsData?.restaurants ?? [];
  const totalPages = restaurantsData?.totalPages ?? 1;
  const totalCount = restaurantsData?.total ?? 0;

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#27272a] bg-[#18181b]/60 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-fg">Platform Overview</h1>
              <p className="text-[12px] text-[#a1a1aa]">
                Welcome back, {user?.firstName ?? "Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2 text-[13px] font-medium text-[#a1a1aa] transition-colors hover:border-[#3f3f46] hover:text-fg"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Restaurants" value={stats?.totalRestaurants ?? 0} icon={Store} loading={statsLoading} />
          <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} loading={statsLoading} />
          <StatCard label="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingCart} loading={statsLoading} />
          <StatCard label="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={IndianRupee} loading={statsLoading} />
        </div>

        {/* ── Restaurants ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#27272a] bg-[#18181b] overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center justify-between border-b border-[#27272a] px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-fg">Restaurants</h2>
              {!restaurantsLoading && (
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-400">
                  {totalCount}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants..."
                className="h-9 w-64 rounded-lg border border-[#27272a] bg-[#09090b] pl-9 pr-3 text-[13px] text-fg placeholder-[#52525b] outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#27272a] text-[11px] font-medium uppercase tracking-wider text-[#71717a]">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Users</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {restaurantsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#27272a]/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-4 w-20 animate-pulse rounded bg-[#27272a]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#71717a]">
                      {debouncedSearch ? "No restaurants match your search." : "No restaurants found."}
                    </td>
                  </tr>
                ) : (
                  restaurants.map((r: Record<string, unknown>) => (
                    <tr
                      key={r.id as string}
                      className="border-b border-[#27272a]/50 transition-colors hover:bg-[#27272a]/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-[11px] font-bold text-violet-400">
                            {(r.name as string)?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-fg">{r.name as string}</p>
                            <p className="text-[11px] text-[#71717a]">{r.slug as string}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-[#27272a] px-2 py-0.5 text-[12px] font-mono text-[#a1a1aa]">
                          {r.restaurantCode as string}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-[#a1a1aa]">{(r._count as Record<string, number>)?.users ?? r.userCount ?? "—"}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#a1a1aa]">{(r._count as Record<string, number>)?.orders ?? r.orderCount ?? "—"}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#a1a1aa]">{r.createdAt ? formatDate(r.createdAt as string) : "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() =>
                            handleEnterRestaurant({
                              id: r.id as string,
                              name: r.name as string,
                              slug: r.slug as string,
                              restaurantCode: r.restaurantCode as string,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-violet-500 active:scale-[0.97]"
                        >
                          Enter
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#27272a] px-5 py-3">
              <p className="text-[12px] text-[#71717a]">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272a] text-[#a1a1aa] transition-colors hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272a] text-[#a1a1aa] transition-colors hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
