import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, MousePointer, Share2, Calendar, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { EditPromotionDialog } from "@/components/EditPromotionDialog";
import { PublicationHistory } from "@/components/PublicationHistory";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";

const PromotionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [promotion, setPromotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPromotion();
    }
  }, [id]);

  const fetchPromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      console.log('Promotion detail fetched:', data); // Debug: vérifier les données
      setPromotion(data);
    } catch (error) {
      console.error('Error fetching promotion:', error);
      toast.error("Erreur lors du chargement de la promotion");
    } finally {
      setLoading(false);
    }
  };

  const performanceData = [
    { date: "01/01", views: 45, clicks: 8 },
    { date: "02/01", views: 68, clicks: 12 },
    { date: "03/01", views: 92, clicks: 15 },
    { date: "04/01", views: 71, clicks: 11 },
    { date: "05/01", views: 83, clicks: 14 },
    { date: "06/01", views: 97, clicks: 16 },
    { date: "07/01", views: 67, clicks: 11 },
  ];

  const platformData = [
    { platform: "Instagram", impressions: 234 },
    { platform: "Facebook", impressions: 189 },
    { platform: "Google", impressions: 100 },
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

  const chartConfig = {
    views: {
      label: "Vues",
      color: "hsl(var(--primary))",
    },
    clicks: {
      label: "Clics",
      color: "hsl(var(--accent))",
    },
  };

  const conversionRate = promotion?.clicks_count && promotion?.views_count 
    ? ((promotion.clicks_count / promotion.views_count) * 100).toFixed(1) 
    : "0";

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Promotion introuvable</h2>
        <Button onClick={() => navigate("/promotions")}>
          Retour aux promotions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/promotions")}
          className="rounded-xl hover:shadow-md transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{promotion.title}</h1>
            {getStatusBadge(promotion.status)}
          </div>
          <p className="text-muted-foreground">{promotion.category || "Non catégorisé"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl hover:shadow-md transition-smooth">
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          <Button 
            className="gradient-primary text-white shadow-glow"
            onClick={() => setEditDialogOpen(true)}
          >
            Modifier
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image and Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-border/50 overflow-hidden">
            <div className="aspect-square overflow-hidden">
              <img
                src={promotion.image_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"}
                alt={promotion.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Période:</span>
                  <span className="font-semibold">
                    {format(new Date(promotion.start_date), "dd/MM/yyyy", { locale: fr })} - {format(new Date(promotion.end_date), "dd/MM/yyyy", { locale: fr })}
                  </span>
                </div>
                {promotion.description && (
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{promotion.description}</p>
                  </div>
                )}
                {promotion.attributes?.cta_ean_code && (
                  <div className="p-4 rounded-xl bg-white border border-border/50">
                    <p className="text-sm text-muted-foreground mb-3">Code-barres EAN</p>
                    <BarcodeDisplay 
                      eanCode={promotion.attributes.cta_ean_code} 
                      size="medium" 
                      showText={true}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card border-border/50 hover:shadow-glass transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vues totales</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {promotion.views_count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total des vues
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50 hover:shadow-glass transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clics</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {promotion.clicks_count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total des clics
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50 hover:shadow-glass transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taux de conversion</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Taux de conversion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Performance sur 7 jours</CardTitle>
              <CardDescription>Évolution des vues et clics</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--accent))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Platform Performance */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Performance par plateforme</CardTitle>
              <CardDescription>Impressions par canal de diffusion</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="platform" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="impressions"
                      fill="hsl(var(--primary))"
                      radius={[8, 8, 0, 0]}
                      className="fill-primary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Publication History */}
          <PublicationHistory promotionId={id || ""} />
        </div>
      </div>

      <EditPromotionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        promotionId={id || ""}
        onSuccess={() => {
          console.log('Promotion updated, refreshing data...');
          fetchPromotion();
          setEditDialogOpen(false);
        }}
      />
    </div>
  );
};

export default PromotionDetail;
