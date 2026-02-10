import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, MousePointer, Users, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InfoCard } from "@/components/InfoCard";
import { useStats } from "@/hooks/use-stats";
import { exportToExcel, exportToCSV } from "@/lib/export-utils";

const Stats = () => {
  const { overview, topPromos, platformStats, loading } = useStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const maxReach = Math.max(...platformStats.map(s => s.reach), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">Suivez les performances de vos promotions</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={topPromos.length === 0 && platformStats.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              const data = [
                { Métrique: "Impressions", Valeur: overview.totalViews, "Évolution": overview.viewsChange },
                { Métrique: "Clics", Valeur: overview.totalClicks, "Évolution": overview.clicksChange },
                { Métrique: "Taux de clic (%)", Valeur: overview.clickRate, "Évolution": overview.clickRateChange },
                { Métrique: "Portée", Valeur: overview.totalReach, "Évolution": overview.reachChange },
                ...topPromos.map(p => ({ Métrique: `Top - ${p.title}`, Valeur: p.views, "Évolution": p.engagement })),
                ...platformStats.map(p => ({ Métrique: `Plateforme - ${p.platform}`, Valeur: p.reach, "Évolution": p.engagement })),
              ];
              exportToExcel(data, "statistiques");
            }}>
              Export Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const data = [
                { Métrique: "Impressions", Valeur: overview.totalViews, "Évolution": overview.viewsChange },
                { Métrique: "Clics", Valeur: overview.totalClicks, "Évolution": overview.clicksChange },
                { Métrique: "Taux de clic (%)", Valeur: overview.clickRate, "Évolution": overview.clickRateChange },
                { Métrique: "Portée", Valeur: overview.totalReach, "Évolution": overview.reachChange },
                ...topPromos.map(p => ({ Métrique: `Top - ${p.title}`, Valeur: p.views, "Évolution": p.engagement })),
                ...platformStats.map(p => ({ Métrique: `Plateforme - ${p.platform}`, Valeur: p.reach, "Évolution": p.engagement })),
              ];
              exportToCSV(data, "statistiques");
            }}>
              Export CSV (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <InfoCard
        icon={BarChart3}
        title="Analysez vos performances"
        description="Les statistiques vous permettent de mesurer l'impact de vos promotions sur vos différents canaux de distribution. Utilisez ces données pour optimiser vos futures campagnes."
        variant="info"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-border/50 hover:shadow-glass transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Impressions totales</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{overview.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">{overview.viewsChange}</span> vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 hover:shadow-glass transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clics totaux</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{overview.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">{overview.clicksChange}</span> vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 hover:shadow-glass transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de clic</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{overview.clickRate}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">{overview.clickRateChange}</span> vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 hover:shadow-glass transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portée totale</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{overview.totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">{overview.reachChange}</span> vs mois dernier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Promotions */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Top 5 Promotions</CardTitle>
            <CardDescription>Meilleures performances ce mois-ci</CardDescription>
          </CardHeader>
          <CardContent>
            {topPromos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {topPromos.map((promo, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md hover:border-primary/20 transition-smooth">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{promo.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          {promo.views}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MousePointer className="w-3.5 h-3.5" />
                          {promo.clicks}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-bold text-primary">{promo.engagement}</div>
                      <div className="text-xs text-muted-foreground">engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Performance par plateforme</CardTitle>
            <CardDescription>Comparaison des réseaux sociaux</CardDescription>
          </CardHeader>
          <CardContent>
            {platformStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-6">
                {platformStats.map((stat, idx) => (
                  <div key={idx} className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{stat.platform}</span>
                      <span className="text-muted-foreground font-medium">{stat.posts} publications</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
                            style={{ width: `${(stat.reach / maxReach) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <div className="text-sm font-bold text-primary">{stat.reach}</div>
                        <div className="text-xs text-muted-foreground">portée</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Engagement:</span>
                      <span className="font-semibold text-primary">{stat.engagement}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
