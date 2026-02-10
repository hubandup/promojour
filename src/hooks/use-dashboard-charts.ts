import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface DailyView {
  date: string;
  vues: number;
  clics: number;
}

interface StatusCount {
  status: string;
  count: number;
}

const statusLabels: Record<string, string> = {
  active: "Actif",
  scheduled: "Programmé",
  expired: "Expiré",
  draft: "Brouillon",
  archived: "Archivé",
};

const statusColors: Record<string, string> = {
  active: "hsl(var(--primary))",
  scheduled: "hsl(210, 80%, 55%)",
  expired: "hsl(0, 60%, 50%)",
  draft: "hsl(var(--muted-foreground))",
  archived: "hsl(30, 60%, 50%)",
};

export function useDashboardCharts() {
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      // Daily views over 30 days
      const { data: stats } = await supabase
        .from("promotion_stats")
        .select("date, views, clicks")
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: true });

      // Aggregate by date
      const dateMap: Record<string, { vues: number; clics: number }> = {};
      // Fill all 30 days
      for (let i = 30; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        dateMap[d] = { vues: 0, clics: 0 };
      }
      for (const s of stats || []) {
        if (dateMap[s.date]) {
          dateMap[s.date].vues += s.views || 0;
          dateMap[s.date].clics += s.clicks || 0;
        }
      }
      setDailyViews(
        Object.entries(dateMap).map(([date, val]) => ({
          date: format(new Date(date), "dd/MM"),
          vues: val.vues,
          clics: val.clics,
        }))
      );

      // Promotion status distribution
      const { data: promos } = await supabase
        .from("promotions")
        .select("status");

      const countMap: Record<string, number> = {};
      for (const p of promos || []) {
        countMap[p.status] = (countMap[p.status] || 0) + 1;
      }
      setStatusDistribution(
        Object.entries(countMap).map(([status, count]) => ({
          status: statusLabels[status] || status,
          count,
          fill: statusColors[status] || "hsl(var(--muted))",
        }))
      );
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  return { dailyViews, statusDistribution, loading };
}
