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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SocialConnectionsManager } from "@/components/SocialConnectionsManager";
import { AutoPublishSettings } from "@/components/AutoPublishSettings";
import { ProOnboardingChecklist } from "@/components/ProOnboardingChecklist";
import { StoreCompletionScore } from "@/components/StoreCompletionScore";
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
  Camera,
  X,
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

const defaultHours = {
  lundi: { open: "09:00", close: "19:00", closed: false },
  mardi: { open: "09:00", close: "19:00", closed: false },
  mercredi: { open: "09:00", close: "19:00", closed: false },
  jeudi: { open: "09:00", close: "19:00", closed: false },
  vendredi: { open: "09:00", close: "19:00", closed: false },
  samedi: { open: "10:00", close: "18:00", closed: false },
  dimanche: { open: "00:00", close: "00:00", closed: true },
};

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

  useEffect(() => {
    if (storeData) {
      const storeWithHours = {
        ...storeData,
        opening_hours: storeData.opening_hours || defaultHours,
      };
      setStore(storeWithHours);
      setFormData(storeWithHours);
      fetchOrgLogo(storeData.organization_id);
      fetchPromotions(storeData.id);
    }
  }, [storeData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success === "social_connected") {
      toast.success("Compte connecté avec succès !");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error === "oauth_denied") {
      toast.error("Connexion annulée");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const fetchOrgLogo = async (organizationId: string) => {
    try {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("logo_url")
        .eq("id", organizationId)
        .single();

      if (orgData?.logo_url) setOrgLogo(orgData.logo_url);
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${store.id}-cover-${Date.now()}.${fileExt}`;
      const filePath = `stores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("promotion-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("promotion-images").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("stores")
        .update({ cover_image_url: publicUrl })
        .eq("id", store.id);

      if (updateError) throw updateError;

      setFormData({ ...formData!, cover_image_url: publicUrl });
      setStore({ ...store, cover_image_url: publicUrl });
      toast.success("Image de couverture mise à jour");
      refetch();
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
    setFormData({
      ...formData,
      opening_hours: {
        ...hours,
        [day]: { ...hours[day], [field]: value },
      },
    });
  };

  const downloadQRCode = (format: "svg" | "png") => {
    if (!qrRef.current || !store) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const fileName = `qr-${store.name.toLowerCase().replace(/\s+/g, "-")}.${format}`;

    if (format === "svg") {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.href = svgUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);
      toast.success("QR Code SVG téléchargé");
    } else {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
          toast.success("QR Code PNG téléchargé");
        });
      };

      img.src = url;
    }
  };

  if (storeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
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
      {/* Hero Cover Section */}
      <div className="relative rounded-2xl overflow-hidden group">
        <div className="h-48 md:h-56 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/10">
          {store.cover_image_url ? (
            <img
              src={store.cover_image_url}
              alt="Couverture"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Aucune image de couverture</p>
            </div>
          )}
        </div>

        {/* Cover upload button overlay */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl shadow-lg"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="w-4 h-4 mr-1.5" />
          {uploading ? "Upload..." : "Changer la couverture"}
        </Button>

        {/* Store info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              {orgLogo && (
                <img
                  src={orgLogo}
                  alt="Logo"
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white/50 shadow-lg"
                />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {store.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {store.city && (
                    <span className="text-white/80 text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {store.city}
                    </span>
                  )}
                  {store.is_active && (
                    <Badge className="bg-green-500/80 text-white border-0 text-xs">Actif</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`/magasin/${store.id}/magasin`, "_blank")}
                className="rounded-xl shadow-lg"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Voir le frontend</span>
              </Button>
              {isEditing ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(store);
                    }}
                    className="rounded-xl shadow-lg"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="gradient-primary text-white shadow-glow rounded-xl"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gradient-primary text-white shadow-glow rounded-xl"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pro Onboarding Checklist */}
      <ProOnboardingChecklist store={store} onNavigateTab={(tab) => { setActiveTab(tab); if (!isEditing) setIsEditing(true); }} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-xl">
              <TabsTrigger value="info" className="rounded-xl text-xs sm:text-sm">Infos</TabsTrigger>
              <TabsTrigger value="hours" className="rounded-xl text-xs sm:text-sm">Horaires</TabsTrigger>
              <TabsTrigger value="promotions" className="rounded-xl text-xs sm:text-sm">
                Promos {promotions.length > 0 && `(${promotions.length})`}
              </TabsTrigger>
              <TabsTrigger value="social" className="rounded-xl text-xs sm:text-sm">
                <Share2 className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
                Social
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-xl text-xs sm:text-sm">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6 mt-4">
              {/* Informations générales */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Informations générales</CardTitle>
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
                        <Textarea
                          value={formData?.description || ""}
                          onChange={(e) => setFormData({ ...formData!, description: e.target.value })}
                          className="rounded-xl min-h-[80px]"
                          placeholder="Décrivez votre magasin en quelques mots..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Téléphone
                          </Label>
                          <Input
                            value={formData?.phone || ""}
                            onChange={(e) => setFormData({ ...formData!, phone: e.target.value })}
                            className="rounded-xl"
                            placeholder="+33 1 23 45 67 89"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
                          </Label>
                          <Input
                            type="email"
                            value={formData?.email || ""}
                            onChange={(e) => setFormData({ ...formData!, email: e.target.value })}
                            className="rounded-xl"
                            placeholder="contact@magasin.fr"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Site web
                        </Label>
                        <Input
                          value={formData?.website_url || ""}
                          onChange={(e) => setFormData({ ...formData!, website_url: e.target.value })}
                          className="rounded-xl"
                          placeholder="https://www.monmagasin.fr"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {store.description && (
                        <p className="text-sm text-muted-foreground">{store.description}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InfoItem icon={Phone} label="Téléphone" value={store.phone} />
                        <InfoItem icon={Mail} label="Email" value={store.email} />
                        <InfoItem icon={Globe} label="Site web" value={store.website_url} isLink />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Adresse & Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Adresse</Label>
                        <Input
                          value={formData?.address_line1 || ""}
                          onChange={(e) => setFormData({ ...formData!, address_line1: e.target.value })}
                          className="rounded-xl"
                          placeholder="123 Rue de la Paix"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Complément</Label>
                        <Input
                          value={formData?.address_line2 || ""}
                          onChange={(e) => setFormData({ ...formData!, address_line2: e.target.value })}
                          className="rounded-xl"
                          placeholder="Bâtiment, étage..."
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
                        <Label>Lien Google Maps</Label>
                        <Input
                          value={formData?.google_maps_url || ""}
                          onChange={(e) => setFormData({ ...formData!, google_maps_url: e.target.value })}
                          className="rounded-xl"
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="font-medium">
                          {store.address_line1 || "Adresse non renseignée"}
                        </p>
                        {store.address_line2 && <p className="text-sm">{store.address_line2}</p>}
                        <p className="text-sm text-muted-foreground">
                          {store.postal_code} {store.city}
                        </p>
                        {store.google_maps_url && (
                          <a
                            href={store.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Voir sur Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Horaires Tab */}
            <TabsContent value="hours" className="mt-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Horaires d'ouverture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(hours).map(([day, schedule]: [string, any]) => (
                      <div
                        key={day}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-24">
                          <p className="font-medium capitalize text-sm">{day}</p>
                        </div>
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!schedule.closed}
                                onChange={(e) => updateHours(day, "closed", !e.target.checked)}
                                className="rounded"
                              />
                              <Label className="text-xs">Ouvert</Label>
                            </div>
                            {!schedule.closed && (
                              <>
                                <Input
                                  type="time"
                                  value={schedule.open}
                                  onChange={(e) => updateHours(day, "open", e.target.value)}
                                  className="w-28 rounded-xl text-sm"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="time"
                                  value={schedule.close}
                                  onChange={(e) => updateHours(day, "close", e.target.value)}
                                  className="w-28 rounded-xl text-sm"
                                />
                              </>
                            )}
                            {schedule.closed && (
                              <span className="text-muted-foreground text-sm">Fermé</span>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            {schedule.closed ? (
                              <Badge variant="secondary" className="text-xs">
                                Fermé
                              </Badge>
                            ) : (
                              <span className="text-sm font-medium">
                                {schedule.open} - {schedule.close}
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

            {/* Promotions Tab */}
            <TabsContent value="promotions" className="mt-4">
              <Card className="glass-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Promotions actives</CardTitle>
                    <CardDescription>
                      {loadingPromotions
                        ? "Chargement..."
                        : `${promotions.length} promotion(s) active(s)`}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate("/promotions")}
                    className="gradient-primary text-white shadow-glow rounded-xl"
                  >
                    Voir tout
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingPromotions ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-3">Aucune promotion active</p>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/promotions")}
                        className="rounded-xl"
                      >
                        Créer une promotion
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {promotions.slice(0, 5).map((promo) => (
                        <div
                          key={promo.id}
                          className="flex items-center gap-4 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/promotions/${promo.id}`)}
                        >
                          {promo.image_url && (
                            <img
                              src={promo.image_url}
                              alt={promo.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{promo.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {promo.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-700 border-green-500/20 text-xs flex-shrink-0"
                          >
                            Active
                          </Badge>
                        </div>
                      ))}
                      {promotions.length > 5 && (
                        <p className="text-xs text-center text-muted-foreground">
                          +{promotions.length - 5} autres promotions
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="mt-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Connexions sociales
                  </CardTitle>
                  <CardDescription>Gérez vos comptes sociaux et la publication automatique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SocialConnectionsManager storeId={store.id} />
                  <div className="border-t pt-4">
                    <AutoPublishSettings storeId={store.id} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques</CardTitle>
                  <CardDescription>Performance du magasin</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">Statistiques à venir</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Completion Score */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Complétude du profil</CardTitle>
            </CardHeader>
            <CardContent>
              <StoreCompletionScore store={store} />
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <QrCode className="w-4 h-4 text-primary" />
                QR Code du magasin
              </CardTitle>
              <CardDescription className="text-xs">Partagez votre magasin facilement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div ref={qrRef} className="bg-white p-4 rounded-xl flex items-center justify-center">
                <QRCodeSVG
                  value={`${window.location.origin}/magasin/${store.id}`}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => downloadQRCode("svg")}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs"
                >
                  SVG
                </Button>
                <Button
                  onClick={() => downloadQRCode("png")}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs"
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

/* Small info item component for read mode */
const InfoItem = ({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | null;
  isLink?: boolean;
}) => (
  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline truncate block"
          >
            {value.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground italic">Non renseigné</p>
      )}
    </div>
  </div>
);

export default MyStore;
