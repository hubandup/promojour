import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StatsOverview {
  totalViews: number;
  totalClicks: number;
  clickRate: string;
  totalReach: number;
  viewsChange: string;
  clicksChange: string;
  clickRateChange: string;
  reachChange: string;
}

interface TopPromo {
  title: string;
  views: number;
  clicks: number;
  engagement: string;
}

interface PlatformStat {
  platform: string;
  posts: number;
  reach: number;
  engagement: string;
}

function calcChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const diff = ((current - previous) / previous) * 100;
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
}

export function useStats() {
  const [overview, setOverview] = useState<StatsOverview>({
    totalViews: 0, totalClicks: 0, clickRate: "0", totalReach: 0,
    viewsChange: "0%", clicksChange: "0%", clickRateChange: "0%", reachChange: "0%",
  });
  const [topPromos, setTopPromos] = useState<TopPromo[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Current month stats
      const { data: currentStats } = await supabase
        .from("promotion_stats")
        .select("views, clicks, unique_visitors, platform")
        .gte("date", startOfMonth.split("T")[0]);

      // Previous month stats
      const { data: prevStats } = await supabase
        .from("promotion_stats")
        .select("views, clicks, unique_visitors")
        .gte("date", startOfPrevMonth.split("T")[0])
        .lte("date", endOfPrevMonth.split("T")[0]);

      const curViews = (currentStats || []).reduce((s, r) => s + (r.views || 0), 0);
      const curClicks = (currentStats || []).reduce((s, r) => s + (r.clicks || 0), 0);
      const curReach = (currentStats || []).reduce((s, r) => s + (r.unique_visitors || 0), 0);
      const prevViews = (prevStats || []).reduce((s, r) => s + (r.views || 0), 0);
      const prevClicks = (prevStats || []).reduce((s, r) => s + (r.clicks || 0), 0);
      const prevReach = (prevStats || []).reduce((s, r) => s + (r.unique_visitors || 0), 0);
      const curRate = curViews > 0 ? (curClicks / curViews) * 100 : 0;
      const prevRate = prevViews > 0 ? (prevClicks / prevViews) * 100 : 0;

      setOverview({
        totalViews: curViews,
        totalClicks: curClicks,
        clickRate: curRate.toFixed(1),
        totalReach: curReach,
        viewsChange: calcChange(curViews, prevViews),
        clicksChange: calcChange(curClicks, prevClicks),
        clickRateChange: calcChange(curRate, prevRate),
        reachChange: calcChange(curReach, prevReach),
      });

      // Top 5 promotions by views
      const { data: promos } = await supabase
        .from("promotions")
        .select("title, views_count, clicks_count")
        .order("views_count", { ascending: false })
        .limit(5);

      setTopPromos(
        (promos || []).map((p) => ({
          title: p.title,
          views: p.views_count || 0,
          clicks: p.clicks_count || 0,
          engagement: p.views_count > 0 ? ((p.clicks_count || 0) / p.views_count * 100).toFixed(1) + "%" : "0%",
        }))
      );

      // Platform stats
      const platformMap: Record<string, { views: number; clicks: number; posts: number }> = {};
      const platformLabels: Record<string, string> = {
        instagram: "Instagram",
        facebook: "Facebook",
        google_business: "Google Business",
      };

      // Count publications per platform
      const { data: publications } = await supabase
        .from("publication_history")
        .select("platform")
        .eq("status", "success");

      for (const pub of publications || []) {
        if (!platformMap[pub.platform]) platformMap[pub.platform] = { views: 0, clicks: 0, posts: 0 };
        platformMap[pub.platform].posts++;
      }

      for (const stat of currentStats || []) {
        const p = stat.platform || "unknown";
        if (!platformMap[p]) platformMap[p] = { views: 0, clicks: 0, posts: 0 };
        platformMap[p].views += stat.views || 0;
        platformMap[p].clicks += stat.clicks || 0;
      }

      setPlatformStats(
        Object.entries(platformMap)
          .filter(([key]) => key !== "unknown")
          .map(([key, val]) => ({
            platform: platformLabels[key] || key,
            posts: val.posts,
            reach: val.views,
            engagement: val.views > 0 ? ((val.clicks / val.views) * 100).toFixed(1) + "%" : "0%",
          }))
          .sort((a, b) => b.reach - a.reach)
      );
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { overview, topPromos, platformStats, loading };
}
