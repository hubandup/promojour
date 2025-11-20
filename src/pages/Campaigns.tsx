import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Campaigns = () => {
  const campaigns = [
    {
      id: 1,
      name: "Soldes d'Hiver 2025",
      startDate: "01/01/2025",
      endDate: "31/01/2025",
      promosPerDay: 3,
      totalPromos: 15,
      status: "active",
    },
    {
      id: 2,
      name: "Saint-Valentin",
      startDate: "07/02/2025",
      endDate: "14/02/2025",
      promosPerDay: 2,
      totalPromos: 8,
      status: "scheduled",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">En cours</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Programmé</Badge>;
      default:
        return <Badge>Terminé</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campagnes</h1>
          <p className="text-muted-foreground">Automatisez vos publications de promotions</p>
        </div>
        <Button className="gradient-primary text-white shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Info Card */}
      <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent shadow-glow">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Qu'est-ce qu'une campagne ?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Une campagne vous permet de planifier la publication automatique de plusieurs promotions sur une période définie. 
                Définissez le nombre de promotions par jour et laissez PromoJour gérer la diffusion !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="glass-card border-border/50 hover:shadow-glass hover:border-primary/20 transition-smooth group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="group-hover:text-primary transition-smooth">{campaign.name}</CardTitle>
                  <CardDescription className="mt-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {campaign.startDate} - {campaign.endDate}
                  </CardDescription>
                </div>
                {getStatusBadge(campaign.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-border/50 transition-smooth hover:shadow-md">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{campaign.promosPerDay}</div>
                    <div className="text-sm text-muted-foreground mt-2 font-medium">Promos / jour</div>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-border/50 transition-smooth hover:shadow-md">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{campaign.totalPromos}</div>
                    <div className="text-sm text-muted-foreground mt-2 font-medium">Total promotions</div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl hover:shadow-md transition-smooth">
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl hover:shadow-md transition-smooth">
                    Statistiques
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;
