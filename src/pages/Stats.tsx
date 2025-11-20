import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, MousePointer, Users } from "lucide-react";

const Stats = () => {
  const topPromos = [
    { title: "Réduction 30% chaussures", views: 523, clicks: 87, engagement: "9.2%" },
    { title: "2 pour 1 T-shirts", views: 412, clicks: 65, engagement: "7.8%" },
    { title: "Soldes accessoires", views: 389, clicks: 54, engagement: "6.9%" },
    { title: "Bundle produits", views: 301, clicks: 42, engagement: "6.5%" },
    { title: "Offre fidélité", views: 287, clicks: 38, engagement: "6.1%" },
  ];

  const platformStats = [
    { platform: "Instagram", posts: 24, reach: 3420, engagement: "8.1%" },
    { platform: "Facebook", posts: 18, reach: 2890, engagement: "7.3%" },
    { platform: "Google Business", posts: 15, reach: 1560, engagement: "5.9%" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground">Suivez les performances de vos promotions</p>
      </div>

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
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">8,234</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">+12.5%</span> vs mois dernier
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
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">1,456</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">+8.2%</span> vs mois dernier
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
            <div className="text-3xl font-bold text-green-500">17.7%</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">+2.1%</span> vs mois dernier
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
            <div className="text-3xl font-bold text-blue-500">5,642</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary font-semibold">+15.3%</span> vs mois dernier
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
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Performance par plateforme</CardTitle>
            <CardDescription>Comparaison des réseaux sociaux</CardDescription>
          </CardHeader>
          <CardContent>
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
                          className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full shadow-glow animate-pulse"
                          style={{ width: `${(stat.reach / 3500) * 100}%` }}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;