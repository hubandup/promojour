import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Tag, Store, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "promotion" | "store" | "campaign";
  url: string;
}

const typeConfig = {
  promotion: { icon: Tag, label: "Promotion", color: "text-primary" },
  store: { icon: Store, label: "Magasin", color: "text-blue-500" },
  campaign: { icon: CalendarDays, label: "Campagne", color: "text-accent" },
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const { organization } = useUserData();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2 || !organization) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const pattern = `%${q}%`;

      const [promos, stores, campaigns] = await Promise.all([
        supabase
          .from("promotions")
          .select("id, title, status")
          .ilike("title", pattern)
          .limit(5),
        supabase
          .from("stores")
          .select("id, name, city")
          .ilike("name", pattern)
          .limit(5),
        supabase
          .from("campaigns")
          .select("id, name, status")
          .ilike("name", pattern)
          .limit(5),
      ]);

      const mapped: SearchResult[] = [
        ...(promos.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: p.status,
          type: "promotion" as const,
          url: `/promotions/${p.id}`,
        })),
        ...(stores.data || []).map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: s.city || undefined,
          type: "store" as const,
          url: `/stores/${s.id}`,
        })),
        ...(campaigns.data || []).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.status,
          type: "campaign" as const,
          url: `/campaigns/${c.id}`,
        })),
      ];

      setResults(mapped);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(result.url);
  };

  return (
    <div className="relative flex-1 max-w-xs md:max-w-sm" onClick={(e) => e.stopPropagation()}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher..."
        className="pl-9 h-9 rounded-xl border-border/50 bg-muted/50 text-sm"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.length >= 2 && setOpen(true)}
      />

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.map((result) => {
            const config = typeConfig[result.type];
            const Icon = config.icon;
            return (
              <button
                key={`${result.type}-${result.id}`}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors text-sm"
                onClick={() => handleSelect(result)}
              >
                <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{config.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          Aucun résultat trouvé
        </div>
      )}
    </div>
  );
}
