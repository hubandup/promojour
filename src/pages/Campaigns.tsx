import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, TrendingUp, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCampaigns } from "@/hooks/use-campaigns";
import { CreateCampaignDialog } from "@/components/CreateCampaignDialog";
import { EditCampaignDialog } from "@/components/EditCampaignDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Campaigns = () => {
  const { campaigns, loading, refetch } = useCampaigns();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const handleEditClick = (campaign: any) => {
    setSelectedCampaign(campaign);
    setEditDialogOpen(true);
  };

  const mockCampaigns = [
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
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Brouillon</Badge>;
      case "completed":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Terminé</Badge>;
      case "archived":
        return <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100">Archivé</Badge>;
      default:
        return <Badge>Terminé</Badge>;
    }
  };

  const displayCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campagnes</h1>
          <p className="text-muted-foreground">Automatisez vos publications de promotions</p>
        </div>
        <Button 
          className="gradient-primary text-white shadow-glow"
          onClick={() => setCreateDialogOpen(true)}
        >
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : displayCampaigns.length === 0 ? (
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground mb-4">Aucune campagne pour le moment</p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="gradient-primary text-white shadow-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première campagne
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayCampaigns.map((campaign) => (
            <Card key={campaign.id} className="glass-card border-border/50 hover:shadow-glass hover:border-primary/20 transition-smooth group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="group-hover:text-primary transition-smooth">{campaign.name}</CardTitle>
                    <CardDescription className="mt-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {"start_date" in campaign 
                        ? `${format(new Date(campaign.start_date), "dd/MM/yyyy")} - ${format(new Date(campaign.end_date), "dd/MM/yyyy")}`
                        : `${campaign.startDate} - ${campaign.endDate}`}
                    </CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Promotion Images Preview */}
                  {"promotions" in campaign && campaign.promotions && campaign.promotions.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Promotions associées</div>
                      <div className="grid grid-cols-6 gap-2">
                        {campaign.promotions.slice(0, 6).map((promo) => (
                          <div 
                            key={promo.id}
                            className="aspect-square rounded-lg border border-border/50 bg-muted/30 overflow-hidden hover:border-primary/50 transition-smooth"
                          >
                            {promo.image_url ? (
                              <img 
                                src={promo.image_url} 
                                alt={promo.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                                <Calendar className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-border/50 transition-smooth hover:shadow-md">
                      <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {"daily_promotion_count" in campaign ? campaign.daily_promotion_count : campaign.promosPerDay}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-medium">Promos / jour</div>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-border/50 transition-smooth hover:shadow-md">
                      <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {"promotions" in campaign && campaign.promotions ? campaign.promotions.length : ("totalPromos" in campaign ? campaign.totalPromos : 0)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-medium">Total promotions</div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-xl hover:shadow-md transition-smooth"
                      onClick={() => handleEditClick(campaign)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
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
      )}

      <CreateCampaignDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <EditCampaignDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refetch}
        campaign={selectedCampaign}
      />
    </div>
  );
};

export default Campaigns;
