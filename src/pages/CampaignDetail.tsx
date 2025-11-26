import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp, Image } from "lucide-react";
import { format, eachDayOfInterval, startOfDay, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "@/hooks/use-campaigns";
import type { Promotion } from "@/hooks/use-promotions";

interface CampaignWithPromotions extends Campaign {
  promotions: Promotion[];
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<CampaignWithPromotions | null>(null);
  const [loading, setLoading] = useState(true);
  const [distributionSchedule, setDistributionSchedule] = useState<Record<string, Promotion[]>>({});

  useEffect(() => {
    if (id) {
      fetchCampaignDetail();
    }
  }, [id]);

  const fetchCampaignDetail = async () => {
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;

      const { data: promotions, error: promosError } = await supabase
        .from('promotions')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

      if (promosError) throw promosError;

      const campaignWithPromos: CampaignWithPromotions = {
        ...campaignData,
        promotions: promotions || [],
      };

      setCampaign(campaignWithPromos);
      generateDistributionSchedule(campaignWithPromos);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la campagne",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDistributionSchedule = (camp: CampaignWithPromotions) => {
    if (!camp.promotions.length) return;

    const startDate = new Date(camp.start_date);
    const endDate = new Date(camp.end_date);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const schedule: Record<string, Promotion[]> = {};
    let promoIndex = 0;
    let promos = [...camp.promotions];

    if (camp.random_order) {
      promos = promos.sort(() => Math.random() - 0.5);
    }

    days.forEach((day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dailyPromos: Promotion[] = [];
      
      for (let i = 0; i < camp.daily_promotion_count; i++) {
        if (promoIndex < promos.length) {
          dailyPromos.push(promos[promoIndex]);
          promoIndex++;
        }
      }
      
      if (dailyPromos.length > 0) {
        schedule[dayKey] = dailyPromos;
      }
    });

    setDistributionSchedule(schedule);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success';
      case 'scheduled': return 'bg-info/20 text-info';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'draft': return 'bg-warning/20 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'scheduled': return 'Planifiée';
      case 'completed': return 'Terminée';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-muted-foreground">Campagne introuvable</p>
        <Button onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux campagnes
        </Button>
      </div>
    );
  }

  const totalScheduledDays = Object.keys(distributionSchedule).length;
  const totalDistributions = Object.values(distributionSchedule).reduce((sum, promos) => sum + promos.length, 0);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge className={getStatusColor(campaign.status)}>
              {getStatusLabel(campaign.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {format(new Date(campaign.start_date), 'dd MMMM yyyy', { locale: fr })} - {format(new Date(campaign.end_date), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promotions associées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {campaign.promotions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jours de diffusion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {totalScheduledDays}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diffusions totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {totalDistributions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendrier de distribution
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {campaign.daily_promotion_count} promotion(s) par jour • Ordre {campaign.random_order ? 'aléatoire' : 'séquentiel'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(distributionSchedule).map(([dateKey, promos]) => (
              <div key={dateKey} className="p-4 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-start gap-4">
                  <div className="text-sm font-medium min-w-32 text-primary">
                    {format(new Date(dateKey), 'EEEE dd MMMM', { locale: fr })}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {promos.map((promo) => (
                      <div key={promo.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/5 transition-smooth">
                        {promo.image_url ? (
                          <img 
                            src={promo.image_url} 
                            alt={promo.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{promo.title}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {promo.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Toutes les promotions associées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {campaign.promotions.map((promo) => (
              <div key={promo.id} className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-accent/5 transition-smooth">
                {promo.image_url ? (
                  <img 
                    src={promo.image_url} 
                    alt={promo.title}
                    className="w-full aspect-square object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-3">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <h4 className="font-medium text-sm mb-2 line-clamp-2">{promo.title}</h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(promo.start_date), 'dd/MM/yyyy', { locale: fr })}</span>
                  <Badge variant="outline" className="text-xs">{promo.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
