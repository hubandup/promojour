import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStores } from "@/hooks/use-stores";
import { MapPin, Phone, Mail, Clock, Edit, Plus, Search, Store as StoreIcon, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoreFormData {
  id?: string;
  name: string;
  description: string;
  city: string;
  phone: string;
  email: string;
  address_line1: string;
  postal_code: string;
}

const Stores = () => {
  const navigate = useNavigate();
  const { stores, loading, refetch } = useStores();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreFormData | null>(null);
  const [formData, setFormData] = useState<StoreFormData>({
    name: "",
    description: "",
    city: "",
    phone: "",
    email: "",
    address_line1: "",
    postal_code: "",
  });

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (store: any) => {
    setEditingStore(store);
    setFormData({
      id: store.id,
      name: store.name || "",
      description: store.description || "",
      city: store.city || "",
      phone: store.phone || "",
      email: store.email || "",
      address_line1: store.address_line1 || "",
      postal_code: store.postal_code || "",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingStore(null);
    setFormData({
      name: "",
      description: "",
      city: "",
      phone: "",
      email: "",
      address_line1: "",
      postal_code: "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingStore?.id) {
        // Update existing store
        const { error } = await supabase
          .from("stores")
          .update({
            name: formData.name,
            description: formData.description,
            city: formData.city,
            phone: formData.phone,
            email: formData.email,
            address_line1: formData.address_line1,
            postal_code: formData.postal_code,
          })
          .eq("id", editingStore.id);

        if (error) throw error;
        toast.success("Magasin modifié avec succès");
      } else {
        // Create new store
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non authentifié");

        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (!profile?.organization_id) throw new Error("Organisation introuvable");

        const { error } = await supabase
          .from("stores")
          .insert({
            ...formData,
            organization_id: profile.organization_id,
          });

        if (error) throw error;
        toast.success("Magasin créé avec succès");
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Magasins</h1>
          <p className="text-muted-foreground">
            Gérez votre réseau de {stores.length} magasin{stores.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleNew} className="gradient-primary text-white shadow-glow rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau magasin
        </Button>
      </div>

      {/* Search */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un magasin par nom ou ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-border/50 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stores Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card border-border/50">
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
      ) : filteredStores.length === 0 ? (
        <Card className="glass-card border-border/50">
          <CardContent className="p-12 text-center">
            <StoreIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? "Aucun magasin trouvé" : "Aucun magasin pour le moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <Card key={store.id} className="glass-card border-border/50 hover:shadow-md transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                    {store.city && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {store.city}
                      </CardDescription>
                    )}
                  </div>
                  {store.is_active && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                      Actif
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  {store.address_line1 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{store.address_line1}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{store.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => navigate(`/stores/${store.id}`)}
                    variant="outline"
                    size="icon"
                    className="rounded-xl hover:shadow-md transition-smooth"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleEdit(store)}
                    variant="outline"
                    size="icon"
                    className="rounded-xl hover:shadow-md transition-smooth"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStore ? "Modifier le magasin" : "Nouveau magasin"}</DialogTitle>
            <DialogDescription>
              {editingStore ? "Modifiez les informations du magasin" : "Créez un nouveau magasin"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du magasin *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Chausselandia Paris Centre"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du magasin..."
                className="rounded-xl min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="123 Rue de la Paix"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="75001"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ville *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Paris"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@magasin.fr"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.city}
              className="gradient-primary text-white shadow-glow rounded-xl"
            >
              {editingStore ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stores;
