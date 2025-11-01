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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Impressions totales</CardTitle>
            <Eye className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,234</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium">+12.5%</span> vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clics totaux</CardTitle>
            <MousePointer className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,456</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium">+8.2%</span> vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de clic</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17.7%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium">+2.1%</span> vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portée totale</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,642</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium">+15.3%</span> vs mois dernier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Promotions */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Promotions</CardTitle>
            <CardDescription>Meilleures performances ce mois-ci</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPromos.map((promo, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{promo.title}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {promo.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointer className="w-3 h-3" />
                        {promo.clicks}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">{promo.engagement}</div>
                    <div className="text-xs text-muted-foreground">engagement</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par plateforme</CardTitle>
            <CardDescription>Comparaison des réseaux sociaux</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {platformStats.map((stat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.platform}</span>
                    <span className="text-muted-foreground">{stat.posts} publications</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ width: `${(stat.reach / 3500) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{stat.reach}</div>
                      <div className="text-xs text-muted-foreground">portée</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Engagement: {stat.engagement}</span>
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
