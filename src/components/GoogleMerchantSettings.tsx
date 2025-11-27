import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useGoogleMerchant } from "@/hooks/use-google-merchant";

interface GoogleMerchantSettingsProps {
  storeId: string;
}

export function GoogleMerchantSettings({ storeId }: GoogleMerchantSettingsProps) {
  const { account, loading, syncing, initiateOAuth, updateMerchantAccountId, disconnect, syncToGoogle } = useGoogleMerchant(storeId);
  const [merchantAccountId, setMerchantAccountId] = useState("");

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = account?.is_connected && account?.google_merchant_account_id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Google Merchant Center
              {isConnected ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connecté
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Non connecté
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Synchronisez vos promotions avec Google Merchant Center pour les diffuser sur Google Shopping
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {account && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Compte Google</p>
                <p className="text-sm font-medium">{account.google_email || "Non disponible"}</p>
              </div>
              {account.google_merchant_account_id && (
                <div>
                  <p className="text-sm text-muted-foreground">ID Merchant Center</p>
                  <p className="text-sm font-medium">{account.google_merchant_account_id}</p>
                </div>
              )}
              {account.last_synced_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Dernière synchronisation</p>
                  <p className="text-sm font-medium">
                    {new Date(account.last_synced_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OAuth Connection */}
        {!account?.is_connected && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold mb-2">Étape 1 : Connecter votre compte Google</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Autorisez PromoJour à accéder à votre Merchant Center pour synchroniser vos promotions.
              </p>
              <Button onClick={initiateOAuth}>
                Connecter Google Merchant Center
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Prérequis :</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Compte Google Merchant Center créé</li>
                <li>API Content for Shopping activée</li>
                <li>Autorisations configurées dans Google Cloud Console</li>
              </ul>
            </div>
          </div>
        )}

        {/* Merchant Account ID Configuration */}
        {account?.is_connected && !account.google_merchant_account_id && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold mb-2">Étape 2 : Configurer votre ID Merchant Center</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Saisissez l'identifiant numérique de votre compte Merchant Center (visible dans l'URL ou les paramètres).
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="merchant-id">ID Merchant Center</Label>
                  <Input
                    id="merchant-id"
                    type="text"
                    placeholder="123456789"
                    value={merchantAccountId}
                    onChange={(e) => setMerchantAccountId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Exemple : 123456789 (nombre sans espaces)
                  </p>
                </div>
                <Button 
                  onClick={() => updateMerchantAccountId(merchantAccountId)}
                  disabled={!merchantAccountId.trim()}
                >
                  Enregistrer l'ID
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={disconnect}>
              Déconnecter
            </Button>
          </div>
        )}

        {/* Sync Controls */}
        {isConnected && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-semibold mb-2">Synchronisation</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Envoyez vos promotions actives vers Google Merchant Center.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={syncToGoogle}
                  disabled={syncing}
                >
                  {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {syncing ? "Synchronisation..." : "Synchroniser maintenant"}
                  <RefreshCw className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={disconnect}>
                  Déconnecter
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Informations :</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Seules les promotions avec le statut "active" sont synchronisées</li>
                <li>Les produits sont créés/mis à jour dans votre Merchant Center</li>
                <li>Les prix promotionnels et dates sont automatiquement appliqués</li>
                <li>Les codes-barres EAN sont inclus si disponibles</li>
              </ul>
            </div>
          </div>
        )}

        {/* Documentation Links */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Documentation</h4>
          <div className="space-y-2">
            <a
              href="https://merchants.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Google Merchant Center Console
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://console.cloud.google.com/apis/library/content.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Activer Content API for Shopping
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://developers.google.com/shopping-content/guides/quickstart"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Guide de démarrage Google
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
