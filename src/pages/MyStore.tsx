import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SocialConnectionsManager } from "@/components/SocialConnectionsManager";
import { AutoPublishSettings } from "@/components/AutoPublishSettings";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { useStoreManagerStore } from "@/hooks/use-store-manager-store";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  QrCode,
  Edit,
  ExternalLink,
  Save,
  Share2,
} from "lucide-react";

interface Store {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  opening_hours: any;
  is_active: boolean;
}

const MyStore = () => {
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { store: storeData, loading: storeLoading, refetch } = useStoreManagerStore();
  const [store, setStore] = useState<Store | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Store | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const { connections, loading: connectionsLoading } = useSocialConnections(store?.id);

  const defaultHours = {
    lundi: { open: "09:00", close: "19:00", closed: false },
    mardi: { open: "09:00", close: "19:00", closed: false },
    mercredi: { open: "09:00", close: "19:00", closed: false },
    jeudi: { open: "09:00", close: "19:00", closed: false },
    vendredi: { open: "09:00", close: "19:00", closed: false },
    samedi: { open: "10:00", close: "18:00", closed: false },
    dimanche: { open: "00:00", close: "00:00", closed: true },
  };

  useEffect(() => {
    if (storeData) {
      const storeWithHours = {
        ...storeData,
        opening_hours: storeData.opening_hours || defaultHours
      };
      setStore(storeWithHours);
      setFormData(storeWithHours);
      fetchOrgLogo(storeData.organization_id);
      fetchPromotions(storeData.id);
    }
  }, [storeData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'social_connected') {
      toast.success('Compte connecté avec succès !');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'oauth_denied') {
      toast.error('Connexion annulée');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchOrgLogo = async (organizationId: string) => {
    try {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("logo_url")
        .eq("id", organizationId)
        .single();
      
      if (orgData?.logo_url) {
        setOrgLogo(orgData.logo_url);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchPromotions = async (storeId: string) => {
    try {
      setLoadingPromotions(true);
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .or(`store_id.eq.${storeId},store_id.is.null`)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les promotions");
    } finally {
      setLoadingPromotions(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !store) return;

    try {
      const hoursToSave = formData.opening_hours || defaultHours;
      
      const { error } = await supabase
        .from("stores")
        .update({
          name: formData.name,
          description: formData.description,
          cover_image_url: formData.cover_image_url,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          postal_code: formData.postal_code,
          city: formData.city,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
          website_url: formData.website_url,
          google_maps_url: formData.google_maps_url,
          opening_hours: hoursToSave,
        })
        .eq("id", store.id);

      if (error) throw error;
      
      const updatedFormData = { ...formData, opening_hours: hoursToSave };
      toast.success("Magasin modifié avec succès");
      setStore(updatedFormData);
      setFormData(updatedFormData);
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !store) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}-cover-${Date.now()}.${fileExt}`;
      const filePath = `stores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promotion-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('promotion-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData!, cover_image_url: publicUrl });
      toast.success("Image de couverture uploadée");
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const updateHours = (day: string, field: string, value: string | boolean) => {
    if (!formData) return;
    const hours = formData.opening_hours || defaultHours;
    const updatedHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    };
    setFormData({
      ...formData,
      opening_hours: updatedHours,
    });
  };

  const downloadQRCode = (format: 'svg' | 'png') => {
    if (!qrRef.current || !store) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const storeUrl = `${window.location.origin}/magasin/${store.id}`;
    const fileName = `qr-${store.name.toLowerCase().replace(/\s+/g, '-')}.${format}`;

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);
      toast.success('QR Code SVG téléchargé');
    } else {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
          toast.success('QR Code PNG téléchargé');
        });
      };

      img.src = url;
    }
  };

  if (storeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucun magasin assigné</p>
      </div>
    );
  }

  const hours = store.opening_hours || defaultHours;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{store.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {store.city && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {store.city}
                </p>
              )}
              {store.is_active && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  Actif
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open(`/magasin/${store.id}/magasin`, '_blank')}
            className="rounded-xl"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Voir le frontend
          </Button>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">
                Annuler
              </Button>
              <Button onClick={handleSave} className="gradient-primary text-white shadow-glow rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="gradient-primary text-white shadow-glow rounded-xl">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-xl">
              <TabsTrigger value="info" className="rounded-xl">Informations</TabsTrigger>
              <TabsTrigger value="hours" className="rounded-xl">Horaires</TabsTrigger>
              <TabsTrigger value="promotions" className="rounded-xl">
                Promotions {promotions.length > 0 && `(${promotions.length})`}
              </TabsTrigger>
              <TabsTrigger value="social" className="rounded-xl">
                <Share2 className="w-4 h-4 mr-2" />
                Connexions
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-xl">Statistiques</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              {/* Visuels */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Visuels</CardTitle>
                  <CardDescription>Logo de l'enseigne et image de couverture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orgLogo && (
                    <div className="space-y-2">
                      <Label>Logo de l'enseigne</Label>
                      <div className="flex items-center gap-4">
                        <img src={orgLogo} alt="Logo enseigne" className="w-16 h-16 rounded-lg object-cover border border-border" />
                        <p className="text-sm text-muted-foreground">Logo de l'organisation</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Image de couverture</Label>
                    {formData?.cover_image_url && (
                      <div className="w-full h-48 rounded-xl overflow-hidden border border-border mb-2">
                        <img
                          src={formData.cover_image_url}
                          alt="Couverture"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {isEditing && (
                      <>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploading}
                          className="rounded-xl"
                        >
                          {uploading ? "Upload en cours..." : "Changer l'image de couverture"}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informations générales */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                  <CardDescription>Coordonnées et détails du magasin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Nom du magasin</Label>
                        <Input
                          value={formData?.name || ""}
                          onChange={(e) => setFormData({ ...formData!, name: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={formData?.description || ""}
                          onChange={(e) => setFormData({ ...formData!, description: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Téléphone</Label>
                          <Input
                            value={formData?.phone || ""}
                            onChange={(e) => setFormData({ ...formData!, phone: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={formData?.email || ""}
                            onChange={(e) => setFormData({ ...formData!, email: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Site web</Label>
                        <Input
                          value={formData?.website_url || ""}
                          onChange={(e) => setFormData({ ...formData!, website_url: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{store.phone || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{store.email || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Site web</p>
                          <p className="font-medium">{store.website_url || "Non renseigné"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Adresse</CardTitle>
                  <CardDescription>Localisation du magasin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Adresse ligne 1</Label>
                        <Input
                          value={formData?.address_line1 || ""}
                          onChange={(e) => setFormData({ ...formData!, address_line1: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Adresse ligne 2</Label>
                        <Input
                          value={formData?.address_line2 || ""}
                          onChange={(e) => setFormData({ ...formData!, address_line2: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Code postal</Label>
                          <Input
                            value={formData?.postal_code || ""}
                            onChange={(e) => setFormData({ ...formData!, postal_code: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ville</Label>
                          <Input
                            value={formData?.city || ""}
                            onChange={(e) => setFormData({ ...formData!, city: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{store.address_line1 || "Adresse non renseignée"}</p>
                        {store.address_line2 && <p>{store.address_line2}</p>}
                        <p>{store.postal_code} {store.city}</p>
                        <p>{store.country}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Horaires Tab */}
            <TabsContent value="hours">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Horaires d'ouverture</CardTitle>
                  <CardDescription>Définissez les horaires pour chaque jour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(hours).map(([day, schedule]: [string, any]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-24">
                          <p className="font-medium capitalize">{day}</p>
                        </div>
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!schedule.closed}
                                onChange={(e) => updateHours(day, 'closed', !e.target.checked)}
                                className="rounded"
                              />
                              <Label>Ouvert</Label>
                            </div>
                            {!schedule.closed && (
                              <>
                                <Input
                                  type="time"
                                  value={schedule.open}
                                  onChange={(e) => updateHours(day, 'open', e.target.value)}
                                  className="w-32 rounded-xl"
                                />
                                <span>-</span>
                                <Input
                                  type="time"
                                  value={schedule.close}
                                  onChange={(e) => updateHours(day, 'close', e.target.value)}
                                  className="w-32 rounded-xl"
                                />
                              </>
                            )}
                            {schedule.closed && <span className="text-muted-foreground">Fermé</span>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {schedule.closed ? (
                              <span className="text-muted-foreground">Fermé</span>
                            ) : (
                              <span>{schedule.open} - {schedule.close}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Promotions Tab */}
            <TabsContent value="promotions">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Promotions actives</CardTitle>
                  <CardDescription>
                    {loadingPromotions ? "Chargement..." : `${promotions.length} promotion(s) active(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPromotions ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  ) : promotions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune promotion active</p>
                  ) : (
                    <div className="space-y-4">
                      {promotions.map((promo) => (
                        <div key={promo.id} className="p-4 border border-border rounded-xl">
                          <h4 className="font-semibold">{promo.title}</h4>
                          <p className="text-sm text-muted-foreground">{promo.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Connections Tab */}
            <TabsContent value="social">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Connexions</CardTitle>
                  <CardDescription>Gérez vos comptes sociaux</CardDescription>
                </CardHeader>
                <CardContent>
                  <SocialConnectionsManager storeId={store.id} />
                  <div className="mt-6">
                    <AutoPublishSettings storeId={store.id} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                  <CardDescription>Performance du magasin</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">Statistiques à venir</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - QR Code */}
        <div className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code du magasin
              </CardTitle>
              <CardDescription>Partagez votre magasin facilement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div ref={qrRef} className="bg-white p-4 rounded-xl flex items-center justify-center">
                <QRCodeSVG
                  value={`${window.location.origin}/magasin/${store.id}`}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => downloadQRCode('svg')}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  SVG
                </Button>
                <Button
                  onClick={() => downloadQRCode('png')}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  PNG
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyStore;
