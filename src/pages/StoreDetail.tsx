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
import { ManualPublishTest } from "@/components/ManualPublishTest";
import { GoogleMerchantSettings } from "@/components/GoogleMerchantSettings";
import { PlatformConnectionDialog } from "@/components/PlatformConnectionDialog";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { useGoogleMerchant } from "@/hooks/use-google-merchant";
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
import googleMerchantLogo from "@/assets/google-merchant-center.svg";
import googleMyBusinessLogo from "@/assets/google-my-business.png";
import whatsappLogo from "@/assets/whatsapp.svg";

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
  const [activeTab, setActiveTab] = useState("info");
  const [openPlatformDialog, setOpenPlatformDialog] = useState<string | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingHours, setEditingHours] = useState(false);

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

  const [hours, setHours] = useState(defaultHours);

  const { connections = [], loading: connectionsLoading } = useSocialConnections(id);
  const { account: googleMerchantAccount, initiateOAuth: initiateGoogleOAuth } = useGoogleMerchant(id!);

  useEffect(() => {
    fetchStore();
    fetchPromotions();
  }, [id]);

  useEffect(() => {
    if (store) {
      setHours(store.opening_hours || defaultHours);
    }
  }, [store]);

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

  const handleSaveInfo = async () => {
    if (!formData || !id) return;

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          email: formData.email,
          website_url: formData.website_url,
          google_maps_url: formData.google_maps_url,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          postal_code: formData.postal_code,
          city: formData.city,
          country: formData.country,
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Informations modifiées avec succès");
      setStore({ ...store, ...formData });
      setEditingInfo(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleSaveHours = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          opening_hours: hours,
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Horaires modifiés avec succès");
      setStore({ ...store, opening_hours: hours });
      setEditingHours(false);
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
    const updatedHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    };
    setHours(updatedHours);
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle>Informations générales</CardTitle>
                    <CardDescription>Coordonnées et détails du magasin</CardDescription>
                  </div>
                  {editingInfo ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingInfo(false);
                          setFormData(store);
                        }}
                        className="rounded-xl"
                      >
                        Annuler
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveInfo}
                        className="rounded-xl bg-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingInfo(true)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingInfo ? (
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Adresse</CardTitle>
                  {editingInfo ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingInfo(false);
                          setFormData(store);
                        }}
                        className="rounded-xl"
                      >
                        Annuler
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveInfo}
                        className="rounded-xl bg-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingInfo(true)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingInfo ? (
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle>Horaires d'ouverture</CardTitle>
                    <CardDescription>Définissez les horaires hebdomadaires</CardDescription>
                  </div>
                  {editingHours ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingHours(false);
                          setHours(store.opening_hours || defaultHours);
                        }}
                        className="rounded-xl"
                      >
                        Annuler
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveHours}
                        className="rounded-xl bg-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingHours(true)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(hours).map(([day, dayHours]: [string, any]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-24 font-medium text-sm capitalize">{day}</div>
                        {editingHours ? (
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

            <TabsContent value="social" className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">Connexions aux plateformes</h2>
                  <p className="text-muted-foreground">
                    Connectez vos comptes pour diffuser automatiquement vos promotions
                  </p>
                </div>

                {/* Grid des plateformes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Facebook */}
                  <Card className="glass-card border-border/50 hover:shadow-lg transition-smooth cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#1877F2]/10 flex items-center justify-center">
                            <Facebook className="h-6 w-6 text-[#1877F2]" />
                          </div>
                          <div>
                            <div className="font-semibold">Facebook</div>
                            <div className="text-xs text-muted-foreground">
                              {connections?.find(c => c.platform === 'facebook')?.is_connected && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 mt-1">
                                  Connecté
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Publiez vos promotions sur votre page Facebook
                      </p>
                      <Button 
                        onClick={() => setOpenPlatformDialog('facebook')}
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Connecter
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Instagram */}
                  <Card className="glass-card border-border/50 hover:shadow-lg transition-smooth cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] flex items-center justify-center">
                            <Instagram className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">Instagram</div>
                            <div className="text-xs text-muted-foreground">
                              {connections?.find(c => c.platform === 'instagram')?.is_connected && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 mt-1">
                                  Connecté
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Publiez vos promotions en Reels sur Instagram
                      </p>
                      <Button 
                        onClick={() => setOpenPlatformDialog('instagram')}
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Connecter
                      </Button>
                    </CardContent>
                  </Card>

                  {/* WhatsApp */}
                  <Card className="glass-card border-border/50 opacity-60">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                            <img src={whatsappLogo} alt="WhatsApp" className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-semibold">WhatsApp</div>
                            <Badge variant="secondary" className="text-xs mt-1">Prochainement</Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Publiez vos promotions sur WhatsApp Business
                      </p>
                      <Button 
                        disabled
                        variant="outline" 
                        className="w-full"
                      >
                        Prochainement
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Google Merchant Center */}
                  <Card className="glass-card border-border/50 hover:shadow-lg transition-smooth cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#4285F4]/10 flex items-center justify-center">
                            <img src={googleMerchantLogo} alt="Google Merchant Center" className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-semibold">Google Merchant Center</div>
                            <div className="text-xs text-muted-foreground">
                              {googleMerchantAccount?.is_connected && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 mt-1">
                                  Connecté
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Synchronisez vos promotions avec Google Shopping pour les diffuser sur les résultats de recherche Google
                      </p>
                      <Button 
                        onClick={() => setOpenPlatformDialog('google-merchant')}
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Connecter
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Google My Business */}
                  <Card className="glass-card border-border/50 opacity-60">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#4285F4]/10 flex items-center justify-center">
                            <img src={googleMyBusinessLogo} alt="Google My Business" className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-semibold">Google My Business</div>
                            <Badge variant="secondary" className="text-xs mt-1">Prochainement</Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Synchronisez votre fiche d'établissement avec Google
                      </p>
                      <Button 
                        disabled
                        variant="outline" 
                        className="w-full"
                      >
                        Prochainement
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Platform Connection Dialogs */}
              <PlatformConnectionDialog
                open={openPlatformDialog === 'facebook'}
                onOpenChange={(open) => !open && setOpenPlatformDialog(null)}
                platform={{
                  name: "Facebook",
                  logo: <Facebook className="h-8 w-8 text-[#1877F2]" />,
                  description: "Publiez vos promotions sur votre page Facebook",
                  isConnected: connections?.find(c => c.platform === 'facebook')?.is_connected,
                  steps: [
                    {
                      title: "Étape 1 : Connecter votre compte Facebook",
                      description: "Autorisez PromoJour à accéder à votre page Facebook.",
                      action: {
                        label: "Connecter mon compte Facebook",
                        onClick: () => {
                          window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-oauth-init?store_id=${id}`;
                        }
                      }
                    }
                  ],
                  about: {
                    title: "À propos de Facebook",
                    items: [
                      "Diffusez vos promotions sur votre page Facebook",
                      "Publication automatique depuis PromoJour",
                      "Un compte Facebook Business est requis",
                      "Les visuels et descriptions sont automatiquement inclus"
                    ]
                  }
                }}
              />

              <PlatformConnectionDialog
                open={openPlatformDialog === 'instagram'}
                onOpenChange={(open) => !open && setOpenPlatformDialog(null)}
                platform={{
                  name: "Instagram",
                  logo: <Instagram className="h-8 w-8 text-white" />,
                  description: "Publiez vos promotions en Reels sur Instagram",
                  isConnected: connections?.find(c => c.platform === 'instagram')?.is_connected,
                  steps: [
                    {
                      title: "Étape 1 : Connecter votre compte Instagram",
                      description: "Autorisez PromoJour à accéder à votre compte Instagram Business.",
                      action: {
                        label: "Connecter mon compte Instagram",
                        onClick: () => {
                          window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-oauth-init?store_id=${id}`;
                        }
                      }
                    }
                  ],
                  about: {
                    title: "À propos d'Instagram",
                    items: [
                      "Diffusez vos promotions en Reels sur Instagram",
                      "Publication automatique depuis PromoJour",
                      "Un compte Instagram Business connecté à une page Facebook est requis",
                      "Les vidéos et visuels sont automatiquement inclus"
                    ]
                  }
                }}
              />

              <PlatformConnectionDialog
                open={openPlatformDialog === 'google-merchant'}
                onOpenChange={(open) => !open && setOpenPlatformDialog(null)}
                platform={{
                  name: "Google Merchant Center",
                  logo: <img src={googleMerchantLogo} alt="Google Merchant Center" className="h-8 w-8" />,
                  description: "Synchronisez avec Google Shopping",
                  isConnected: googleMerchantAccount?.is_connected,
                  steps: [
                    {
                      title: "Étape 1 : Connecter votre compte Google",
                      description: "Autorisez PromoJour à accéder à vos comptes Google Merchant Center.",
                      action: {
                        label: "Connecter mon compte Google",
                        onClick: () => initiateGoogleOAuth()
                      }
                    }
                  ],
                  about: {
                    title: "À propos de Google Merchant Center",
                    items: [
                      "Diffusez vos promotions sur Google Shopping",
                      "Synchronisation à la demande depuis PromoJour",
                      "Un compte Google avec un Merchant Center est requis",
                      "Les codes-barres EAN sont automatiquement inclus"
                    ]
                  },
                  links: [
                    {
                      label: "Créer un compte Merchant Center",
                      url: "https://merchants.google.com/"
                    },
                    {
                      label: "Documentation Google",
                      url: "https://support.google.com/merchants/"
                    }
                  ]
                }}
              />
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
