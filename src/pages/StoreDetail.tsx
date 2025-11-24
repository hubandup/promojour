import { useParams, useNavigate } from "react-router-dom";
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
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  Instagram,
  Facebook,
  QrCode,
  ArrowLeft,
  Edit,
  Eye,
  ExternalLink,
  MousePointer,
  TrendingUp,
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

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Store | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  // Horaires par défaut
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
    fetchStore();
    fetchPromotions();
  }, [id]);

  useEffect(() => {
    // Check for OAuth callback success/error
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'social_connected') {
      toast.success('Compte connecté avec succès !');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'oauth_denied') {
      toast.error('Connexion annulée');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);


  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Initialize opening_hours with defaultHours if null
      const storeWithHours = {
        ...data,
        opening_hours: data.opening_hours || defaultHours
      };
      
      setStore(storeWithHours);
      setFormData(storeWithHours);

      // Fetch organization logo
      if (data.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("logo_url")
          .eq("id", data.organization_id)
          .single();
        
        if (orgData?.logo_url) {
          setOrgLogo(orgData.logo_url);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger le magasin");
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoadingPromotions(true);
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .or(`store_id.eq.${id},store_id.is.null`)
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
    if (!formData) return;

    try {
      // Initialize opening_hours with defaultHours if null
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
        .eq("id", id);

      if (error) throw error;
      
      const updatedFormData = { ...formData, opening_hours: hoursToSave };
      toast.success("Magasin modifié avec succès");
      setStore(updatedFormData);
      setFormData(updatedFormData);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-cover-${Date.now()}.${fileExt}`;
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
      // Download SVG
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
      // Download PNG
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

  if (loading) {
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
        <p className="text-muted-foreground">Magasin introuvable</p>
        <Button onClick={() => navigate("/stores")} className="mt-4">
          Retour aux magasins
        </Button>
      </div>
    );
  }

  const hours = store.opening_hours || defaultHours;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/stores")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
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
          <Tabs defaultValue="info" className="w-full">
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
              {/* Logo enseigne + Cover Image */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Visuels</CardTitle>
                  <CardDescription>Logo de l'enseigne et image de couverture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo enseigne (read-only) */}
                  {orgLogo && (
                    <div className="space-y-2">
                      <Label>Logo de l'enseigne</Label>
                      <div className="flex items-center gap-4">
                        <img src={orgLogo} alt="Logo enseigne" className="w-16 h-16 rounded-lg object-cover border border-border" />
                        <p className="text-sm text-muted-foreground">Logo de l'organisation</p>
                      </div>
                    </div>
                  )}

                  {/* Cover image upload */}
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
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL Google Maps</Label>
                        <Input
                          value={formData?.google_maps_url || ""}
                          onChange={(e) => setFormData({ ...formData!, google_maps_url: e.target.value })}
                          className="rounded-xl"
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {store.description && (
                        <p className="text-muted-foreground">{store.description}</p>
                      )}
                      <div className="space-y-3">
                        {store.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                        {store.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{store.email}</span>
                          </div>
                        )}
                        {store.website_url && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <a href={store.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {store.website_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Adresse</CardTitle>
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
                        <Label>Adresse ligne 2 (complément)</Label>
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
                      <div className="space-y-2">
                        <Label>Pays</Label>
                        <Input
                          value={formData?.country || ""}
                          onChange={(e) => setFormData({ ...formData!, country: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        {store.address_line1 && <p>{store.address_line1}</p>}
                        {store.address_line2 && <p>{store.address_line2}</p>}
                        <p>
                          {store.postal_code} {store.city}
                        </p>
                        {store.country && <p>{store.country}</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hours" className="space-y-6">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Horaires d'ouverture</CardTitle>
                  <CardDescription>Définissez les horaires hebdomadaires</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(hours).map(([day, dayHours]: [string, any]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-24 font-medium text-sm capitalize">{day}</div>
                        {isEditing ? (
                          <>
                            <Input
                              type="time"
                              value={dayHours.open || "09:00"}
                              onChange={(e) => updateHours(day, "open", e.target.value)}
                              disabled={dayHours.closed}
                              className="w-32 rounded-xl"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              type="time"
                              value={dayHours.close || "19:00"}
                              onChange={(e) => updateHours(day, "close", e.target.value)}
                              disabled={dayHours.closed}
                              className="w-32 rounded-xl"
                            />
                            <Button
                              variant={dayHours.closed ? "outline" : "ghost"}
                              size="sm"
                              onClick={() => updateHours(day, "closed", !dayHours.closed)}
                              className="rounded-xl"
                            >
                              {dayHours.closed ? "Fermé" : "Ouvert"}
                            </Button>
                          </>
                        ) : (
                          <div className="text-muted-foreground">
                            {dayHours.closed ? (
                              <span className="text-red-500">Fermé</span>
                            ) : (
                              <span>
                                {dayHours.open} - {dayHours.close}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotions" className="space-y-6">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Promotions actives</CardTitle>
                  <CardDescription>
                    Promotions visibles dans ce magasin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPromotions ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Aucune promotion active pour ce magasin
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {promotions.map((promo) => (
                        <Card key={promo.id} className="border-border/50 hover:shadow-md transition-smooth">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {promo.image_url && (
                                <img
                                  src={promo.image_url}
                                  alt={promo.title}
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold">{promo.title}</h3>
                                    {promo.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {promo.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                    Actif
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {promo.views_count || 0} vues
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MousePointer className="w-3 h-3" />
                                    {promo.clicks_count || 0} clics
                                  </div>
                                  {promo.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {promo.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <SocialConnectionsManager storeId={store.id} />
              <AutoPublishSettings storeId={store.id} />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">1,247</p>
                        <p className="text-sm text-muted-foreground">Vues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                        <MousePointer className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">89</p>
                        <p className="text-sm text-muted-foreground">Clics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">7.1%</p>
                        <p className="text-sm text-muted-foreground">Conversion</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Promotions actives</CardTitle>
                  <CardDescription>{promotions.length} promotion{promotions.length > 1 ? 's' : ''} en cours dans ce magasin</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Statistiques détaillées à venir...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
              <CardDescription>Connexions actives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md transition-smooth">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="text-xs text-muted-foreground">231 abonnés</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  Connecté
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md transition-smooth">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Facebook</p>
                    <p className="text-xs text-muted-foreground">456 j'aime</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  Connecté
                </Badge>
              </div>

              <Button variant="outline" className="w-full rounded-xl hover:shadow-md transition-smooth mt-2">
                Gérer les connexions
              </Button>
            </CardContent>
          </Card>

          <Card className="gradient-primary text-white border-0 shadow-glow">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code du magasin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={qrRef}
                className="aspect-square bg-white rounded-xl flex items-center justify-center mb-4 shadow-md p-4"
              >
                <QRCodeSVG
                  value={`${window.location.origin}/magasin/${store.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => downloadQRCode('svg')}
                  variant="secondary" 
                  className="flex-1 rounded-xl hover:shadow-md transition-smooth"
                >
                  SVG
                </Button>
                <Button 
                  onClick={() => downloadQRCode('png')}
                  variant="secondary" 
                  className="flex-1 rounded-xl hover:shadow-md transition-smooth"
                >
                  PNG
                </Button>
              </div>
              <p className="text-xs text-white/70 mt-3 text-center">
                Code unique pour ce magasin
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
