import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Tag, Eye, Users, Plus, Instagram, Facebook } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { title: "Promotions actives", value: "12", change: "+3", icon: Tag, color: "text-primary" },
    { title: "Vues totales", value: "2,847", change: "+12%", icon: Eye, color: "text-accent" },
    { title: "Taux d'engagement", value: "8.3%", change: "+2.1%", icon: TrendingUp, color: "text-green-500" },
    { title: "Followers totaux", value: "1,234", change: "+45", icon: Users, color: "text-blue-500" },
  ];

  const recentPromos = [
    { title: "Réduction 30% sur les chaussures", status: "Actif", views: 523, engagement: "9.2%" },
    { title: "2 pour 1 sur les T-shirts", status: "Actif", views: 412, engagement: "7.8%" },
    { title: "Offre spéciale weekend", status: "Programmé", views: 0, engagement: "-" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos promotions</p>
        </div>
        <Button className="gradient-primary text-white shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500 font-medium">{stat.change}</span> vs mois dernier
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Promotions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Promotions récentes</CardTitle>
            <CardDescription>Vos 5 dernières promotions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPromos.map((promo, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{promo.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {promo.views} vues
                      </span>
                      <span>Engagement: {promo.engagement}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        promo.status === "Actif"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {promo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Media Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
              <CardDescription>Statut des connexions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">567 followers</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Facebook</p>
                    <p className="text-sm text-muted-foreground">667 followers</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-primary text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">Astuce du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90">
                Publiez vos promotions entre 18h et 20h pour maximiser l'engagement de votre audience !
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
