import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreatePromotionDialog } from "@/components/CreatePromotionDialog";

const Promotions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const promotions = [
    {
      id: 1,
      title: "Réduction 30% sur les chaussures",
      category: "Mode",
      status: "active",
      startDate: "01/01/2025",
      endDate: "15/01/2025",
      views: 523,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
    },
    {
      id: 2,
      title: "2 pour 1 sur les T-shirts",
      category: "Mode",
      status: "active",
      startDate: "05/01/2025",
      endDate: "20/01/2025",
      views: 412,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
    },
    {
      id: 3,
      title: "Offre spéciale weekend",
      category: "Générale",
      status: "scheduled",
      startDate: "25/01/2025",
      endDate: "27/01/2025",
      views: 0,
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Actif</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Programmé</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Expiré</Badge>;
      default:
        return <Badge>Brouillon</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">Gérez toutes vos promotions</p>
        </div>
        <Button 
          className="gradient-primary text-white shadow-glow"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une promotion..."
                className="pl-11 rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl border-border/50 hover:shadow-md transition-smooth">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <Card key={promo.id} className="glass-card border-border/50 hover:shadow-glass hover:border-primary/20 transition-smooth overflow-hidden group">
            <div className="h-48 overflow-hidden relative">
              <img
                src={promo.image}
                alt={promo.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth"></div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{promo.title}</CardTitle>
                {getStatusBadge(promo.status)}
              </div>
              <CardDescription>{promo.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Début:</span>
                  <span className="font-semibold">{promo.startDate}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Fin:</span>
                  <span className="font-semibold">{promo.endDate}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                  <span className="text-muted-foreground">Vues:</span>
                  <span className="font-bold text-primary">{promo.views}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl hover:shadow-md transition-smooth">
                  Modifier
                </Button>
                <Button variant="outline" size="sm" className="flex-1 rounded-xl hover:shadow-md transition-smooth">
                  Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreatePromotionDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
};

export default Promotions;
