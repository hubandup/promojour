import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePromotionDialog } from "@/components/CreatePromotionDialog";
import { EditPromotionDialog } from "@/components/EditPromotionDialog";
import { usePromotions } from "@/hooks/use-promotions";
import { useUserData } from "@/hooks/use-user-data";
import { useStores } from "@/hooks/use-stores";
import { useCampaigns } from "@/hooks/use-campaigns";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Promotions = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);

  const { promotions, loading: promotionsLoading, refetch } = usePromotions();
  const { organization, isFree, loading: userLoading } = useUserData();
  const { stores, loading: storesLoading } = useStores();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

  const loading = promotionsLoading || userLoading || storesLoading || campaignsLoading;

  // Filtrer les promotions
  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch = promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || promo.status === statusFilter;
    const matchesStore = storeFilter === "all" || promo.store_id === storeFilter;
    const matchesCampaign = campaignFilter === "all" || promo.campaign_id === campaignFilter;
    
    return matchesSearch && matchesStatus && matchesStore && matchesCampaign;
  });

  // Vérifier les limites d'abonnement
  const maxPromotions = organization?.max_promotions;
  const canCreatePromo = loading || maxPromotions === null || promotions.length < maxPromotions;
  const isNearLimit = !loading && maxPromotions && maxPromotions !== null && promotions.length >= maxPromotions * 0.8;
  const isAtLimit = !loading && maxPromotions && maxPromotions !== null && promotions.length >= maxPromotions;

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
          <p className="text-muted-foreground">
            {loading ? "Chargement..." : `${filteredPromotions.length} promotion${filteredPromotions.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button 
          className="gradient-primary text-white shadow-glow"
          onClick={() => setCreateDialogOpen(true)}
          disabled={!canCreatePromo || loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      {/* Alerts */}
      {isNearLimit && !isAtLimit && (
        <Alert className="glass-card border-border/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Attention : Vous approchez de la limite de votre abonnement ({promotions.length}/{maxPromotions} promotions).
            {isFree && " Passez à un abonnement supérieur pour créer plus de promotions."}
          </AlertDescription>
        </Alert>
      )}

      {isAtLimit && (
        <Alert variant="destructive" className="glass-card">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Limite atteinte : Vous avez atteint le maximum de {maxPromotions} promotions pour votre abonnement.
            Veuillez passer à un abonnement supérieur ou supprimer des promotions existantes.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-11 rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl border-border/50 bg-background/50">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="scheduled">Programmé</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>

            {stores.length > 1 && (
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50">
                  <SelectValue placeholder="Magasin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les magasins</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {campaigns.length > 0 && (
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50">
                  <SelectValue placeholder="Campagne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les campagnes</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promotions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-border/50">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPromotions.length === 0 ? (
        <Card className="glass-card border-border/50 p-12 text-center">
          <p className="text-muted-foreground">Aucune promotion trouvée</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo) => (
            <Card key={promo.id} className="glass-card border-border/50 hover:shadow-glass hover:border-primary/20 transition-smooth overflow-hidden group">
              <div className="h-48 overflow-hidden relative bg-gradient-to-br from-muted/50 to-muted">
                {promo.image_url ? (
                  <>
                    <img
                      src={promo.image_url}
                      alt={promo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500 cursor-pointer"
                      onClick={() => {
                        setSelectedPromotionId(promo.id);
                        setEditDialogOpen(true);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                      <span className="text-white font-semibold text-sm bg-black/50 px-3 py-1 rounded-lg">
                        Cliquer pour modifier
                      </span>
                    </div>
                  </>
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setSelectedPromotionId(promo.id);
                      setEditDialogOpen(true);
                    }}
                  >
                    <div className="text-center text-muted-foreground">
                      <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">Cliquer pour ajouter une image</p>
                    </div>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{promo.title}</CardTitle>
                  {getStatusBadge(promo.status)}
                </div>
                {promo.description && (
                  <CardDescription className="line-clamp-2">{promo.description}</CardDescription>
                )}
                {promo.category && (
                  <Badge variant="outline" className="w-fit">{promo.category}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Début:</span>
                    <span className="font-semibold">
                      {format(new Date(promo.start_date), "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Fin:</span>
                    <span className="font-semibold">
                      {format(new Date(promo.end_date), "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                    <span className="text-muted-foreground">Vues:</span>
                    <span className="font-bold text-primary">{promo.views_count}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                    <span className="text-muted-foreground">Clics:</span>
                    <span className="font-bold text-primary">{promo.clicks_count}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 rounded-xl hover:shadow-md transition-smooth"
                    onClick={() => {
                      setSelectedPromotionId(promo.id);
                      setEditDialogOpen(true);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 rounded-xl hover:shadow-md transition-smooth"
                    onClick={() => navigate(`/promotions/${promo.id}`)}
                  >
                    Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreatePromotionDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
      
      {selectedPromotionId && (
        <EditPromotionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          promotionId={selectedPromotionId}
          onSuccess={() => {
            refetch();
            setSelectedPromotionId(null);
          }}
        />
      )}
    </div>
  );
};

export default Promotions;
