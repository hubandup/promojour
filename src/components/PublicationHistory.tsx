import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Facebook, Instagram } from "lucide-react";
import { usePublicationHistory } from "@/hooks/use-publication-history";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PublicationHistoryProps {
  promotionId: string;
}

export function PublicationHistory({ promotionId }: PublicationHistoryProps) {
  const { data: history, isLoading } = usePublicationHistory(promotionId);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-5 h-5 text-[#1877F2]" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-[#E4405F]" />;
      default:
        return null;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      default:
        return platform;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Historique des publications</CardTitle>
          <CardDescription>Toutes les publications automatiques sur les réseaux sociaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Historique des publications</CardTitle>
          <CardDescription>Toutes les publications automatiques sur les réseaux sociaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune publication automatique pour cette promotion</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>Historique des publications</CardTitle>
        <CardDescription>Toutes les publications automatiques sur les réseaux sociaux</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                {getPlatformIcon(item.platform)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{getPlatformName(item.platform)}</h4>
                    {item.status === 'success' ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Réussi
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Échoué
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.published_at), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </div>
                {item.status === 'success' && item.post_id && (
                  <p className="text-xs text-muted-foreground mt-1">ID du post: {item.post_id}</p>
                )}
                {item.status === 'error' && item.error_message && (
                  <p className="text-xs text-red-500 mt-1">Erreur: {item.error_message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
