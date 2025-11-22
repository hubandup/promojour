import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertCircle, Eye, Pencil, Trash2, BarChart3, LayoutGrid, List, X, Copy, Upload, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreatePromotionDialog } from "@/components/CreatePromotionDialog";
import { EditPromotionDialog } from "@/components/EditPromotionDialog";
import { ReelPreviewDialog } from "@/components/ReelPreviewDialog";
import { BulkImportPromotionsDialog } from "@/components/BulkImportPromotionsDialog";
import { PromotionsCalendar } from "@/components/PromotionsCalendar";
import { usePromotions } from "@/hooks/use-promotions";
import { useUserData } from "@/hooks/use-user-data";
import { useStores } from "@/hooks/use-stores";
import { useCampaigns } from "@/hooks/use-campaigns";
import { usePromotionalMechanics } from "@/hooks/use-promotional-mechanics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Promotions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "calendar">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [previewPromotion, setPreviewPromotion] = useState<any>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const { promotions, loading: promotionsLoading, refetch, deletePromotion } = usePromotions();
  const { organization, isFree, loading: userLoading } = useUserData();
  const { stores, loading: storesLoading } = useStores();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const { mechanics, isLoading: mechanicsLoading } = usePromotionalMechanics();

  const loading = promotionsLoading || userLoading || storesLoading || campaignsLoading || mechanicsLoading;

  const getMechanicName = (mechanicCode: string) => {
    const mechanic = mechanics.find(m => m.code === mechanicCode);
    return mechanic?.name || null;
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPromotions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPromotions.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${selectedIds.size} promotion(s) supprimée(s)`,
      });

      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
      await refetch();
    } catch (error) {
      console.error('Error deleting promotions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les promotions",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ status: newStatus as 'draft' | 'scheduled' | 'active' | 'expired' | 'archived' })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${selectedIds.size} promotion(s) mise(s) à jour`,
      });

      setSelectedIds(new Set());
      setBulkStatusDialogOpen(false);
      await refetch();
    } catch (error) {
      console.error('Error updating promotions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les promotions",
        variant: "destructive",
      });
    }
  };

  const handleDuplicatePromotion = async (promo: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const duplicatedPromo = {
        title: `${promo.title} (Copie)`,
        description: promo.description,
        category: promo.category,
        image_url: promo.image_url,
        video_url: promo.video_url,
        organization_id: promo.organization_id,
        store_id: promo.store_id,
        campaign_id: promo.campaign_id,
        start_date: promo.start_date,
        end_date: promo.end_date,
        status: 'draft' as const,
        can_be_modified_by_stores: promo.can_be_modified_by_stores,
        is_mandatory: promo.is_mandatory,
        attributes: promo.attributes,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('promotions')
        .insert(duplicatedPromo);

      if (error) throw error;

      toast({
        title: "Promotion dupliquée",
        description: "La promotion a été dupliquée avec succès.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer la promotion.",
        variant: "destructive",
      });
    }
  };

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
            {selectedIds.size > 0 && ` · ${selectedIds.size} sélectionnée(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-lg"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-lg"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="rounded-lg"
            >
              <CalendarIcon className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            variant="outline"
            onClick={() => setBulkImportOpen(true)}
            disabled={loading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import en masse
          </Button>
          <Button 
            className="gradient-primary text-white shadow-glow"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canCreatePromo || loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle promotion
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="glass-card border-primary/50 shadow-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="w-4 h-4 mr-2" />
                  Désélectionner tout
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} promotion(s) sélectionnée(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-[200px] rounded-xl">
                    <SelectValue placeholder="Changer le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="scheduled">Programmé</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Promotions List/Grid */}
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
      ) : viewMode === "calendar" ? (
        <PromotionsCalendar
          promotions={filteredPromotions}
          onPromotionClick={(promo) => {
            setSelectedPromotionId(promo.id);
            setEditDialogOpen(true);
          }}
        />
      ) : viewMode === "list" ? (
        <Card className="glass-card border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredPromotions.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Mécanique</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromotions.map((promo) => (
                <TableRow key={promo.id} className="border-border/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(promo.id)}
                      onCheckedChange={() => toggleSelection(promo.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {promo.image_url ? (
                        <img
                          src={promo.image_url}
                          alt={promo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{promo.title}</p>
                      {promo.description && (
                        <p className="text-sm text-muted-foreground truncate">{promo.description}</p>
                      )}
                      {promo.category && (
                        <Badge variant="outline" className="mt-1">{promo.category}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {promo.attributes?.mechanicType && getMechanicName(promo.attributes.mechanicType) && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {getMechanicName(promo.attributes.mechanicType)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {promo.attributes?.originalPrice && (
                      <div className="space-y-1">
                        {promo.attributes?.discountedPrice ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-muted-foreground line-through">
                                {parseFloat(promo.attributes.originalPrice).toFixed(2)}€
                              </span>
                              {promo.attributes.discountPercentage && (
                                <Badge className="bg-destructive text-destructive-foreground text-xs">
                                  -{promo.attributes.discountPercentage}%
                                </Badge>
                              )}
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {parseFloat(promo.attributes.discountedPrice).toFixed(2)}€
                            </div>
                          </>
                        ) : (
                          <div className="text-base font-semibold">
                            {parseFloat(promo.attributes.originalPrice).toFixed(2)}€
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Du:</span>
                        <span className="font-medium">
                          {format(new Date(promo.start_date), "dd/MM/yy", { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Au:</span>
                        <span className="font-medium">
                          {format(new Date(promo.end_date), "dd/MM/yy", { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(promo.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-muted-foreground" />
                        <span className="font-semibold">{promo.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{promo.clicks_count} clics</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setPreviewPromotion(promo);
                          setPreviewDialogOpen(true);
                        }}
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/promotions/${promo.id}`)}
                        title="Détails"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedPromotionId(promo.id);
                          setEditDialogOpen(true);
                        }}
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicatePromotion(promo)}
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => {
                          setPromotionToDelete(promo.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Image clicked, promotion ID:', promo.id);
                        setSelectedPromotionId(promo.id);
                        setEditDialogOpen(true);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center pointer-events-none">
                      <span className="text-white font-semibold text-sm bg-black/50 px-3 py-1 rounded-lg">
                        Cliquer pour modifier
                      </span>
                    </div>
                  </>
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('No image placeholder clicked, promotion ID:', promo.id);
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
                <div className="flex gap-2 flex-wrap">
                  {promo.category && (
                    <Badge variant="outline" className="w-fit">{promo.category}</Badge>
                  )}
                  {promo.attributes?.mechanicType && getMechanicName(promo.attributes.mechanicType) && (
                    <Badge variant="secondary" className="w-fit bg-primary/10 text-primary hover:bg-primary/20">
                      {getMechanicName(promo.attributes.mechanicType)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {promo.attributes?.originalPrice && (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <div className="flex items-baseline justify-between gap-2">
                        {promo.attributes?.discountedPrice ? (
                          <>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground line-through">
                                {parseFloat(promo.attributes.originalPrice).toFixed(2)}€
                              </span>
                              <span className="text-2xl font-bold text-primary">
                                {parseFloat(promo.attributes.discountedPrice).toFixed(2)}€
                              </span>
                            </div>
                            {promo.attributes.discountPercentage && (
                              <Badge className="bg-destructive text-destructive-foreground font-bold text-base px-3 py-1">
                                -{promo.attributes.discountPercentage}%
                              </Badge>
                            )}
                          </>
                        ) : promo.attributes?.discountPercentage ? (
                          <>
                            <span className="text-lg font-semibold">
                              {parseFloat(promo.attributes.originalPrice).toFixed(2)}€
                            </span>
                            <Badge className="bg-destructive text-destructive-foreground font-bold text-base px-3 py-1">
                              -{promo.attributes.discountPercentage}%
                            </Badge>
                          </>
                        ) : (
                          <span className="text-lg font-semibold">
                            {parseFloat(promo.attributes.originalPrice).toFixed(2)}€
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
                    size="icon" 
                    className="rounded-xl hover:shadow-md transition-smooth"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewPromotion(promo);
                      setPreviewDialogOpen(true);
                    }}
                    title="Voir"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl hover:shadow-md transition-smooth"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/promotions/${promo.id}`);
                    }}
                    title="Détails"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl hover:shadow-md transition-smooth"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPromotionId(promo.id);
                      setEditDialogOpen(true);
                    }}
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl hover:shadow-md transition-smooth"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicatePromotion(promo);
                    }}
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl hover:shadow-md transition-smooth hover:border-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPromotionToDelete(promo.id);
                      setDeleteDialogOpen(true);
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
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
        onSuccess={refetch}
      />
      
      {selectedPromotionId && (
        <EditPromotionDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange:', open);
            setEditDialogOpen(open);
            if (!open) {
              setSelectedPromotionId(null);
            }
          }}
          promotionId={selectedPromotionId}
          onSuccess={() => {
            console.log('Edit success, refreshing...');
            refetch();
            setSelectedPromotionId(null);
          }}
        />
      )}

      {previewPromotion && (
        <ReelPreviewDialog
          open={previewDialogOpen}
          onOpenChange={(open) => {
            setPreviewDialogOpen(open);
            if (!open) {
              setPreviewPromotion(null);
            }
          }}
          store={stores.find(s => s.id === previewPromotion.store_id) || null}
          promotion={previewPromotion}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPromotionToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (promotionToDelete) {
                  await deletePromotion(promotionToDelete);
                  setPromotionToDelete(null);
                  setDeleteDialogOpen(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression groupée</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedIds.size} promotion(s) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkImportPromotionsDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onImportComplete={refetch}
        organizationId={organization?.id || ""}
      />
    </div>
  );
};

export default Promotions;
