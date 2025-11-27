import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useGoogleMerchant, MerchantAccountOption } from "@/hooks/use-google-merchant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleMerchantSettingsProps {
  storeId: string;
}

export function GoogleMerchantSettings({ storeId }: GoogleMerchantSettingsProps) {
  const { 
    account, 
    loading, 
    syncing, 
    loadingAccounts,
    initiateOAuth, 
    selectMerchantAccount, 
    refreshAccounts,
    disconnect, 
    syncToGoogle 
  } = useGoogleMerchant(storeId);
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isConnected = account?.is_connected;
  const hasSelectedAccount = account?.google_merchant_account_id;
  const availableAccounts = account?.available_accounts || [];
  const canSync = isConnected && hasSelectedAccount;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Google Merchant Center</h3>
          <p className="text-sm text-muted-foreground">
            Diffusez vos promotions sur Google Shopping
          </p>
        </div>
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
      </div>

      {/* Not Connected - Step 1 */}
      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">Étape 1 : Connecter votre compte Google</p>
              <p className="text-sm">
                Autorisez PromoJour à accéder à vos comptes Google Merchant Center.
              </p>
              <Button onClick={initiateOAuth} className="mt-2">
                Connecter mon compte Google
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connected - Show Account Info */}
      {isConnected && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Compte Google</Label>
              <p className="text-sm font-medium">{account.google_email || "Non disponible"}</p>
            </div>

            {/* Account Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Compte Merchant Center</Label>
              {availableAccounts.length === 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-sm font-medium mb-2">
                      Aucun compte Merchant Center trouvé
                    </p>
                    <p className="text-xs mb-3">
                      Créez un compte sur{" "}
                      <a 
                        href="https://merchants.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Google Merchant Center
                      </a>
                      , puis rafraîchissez la liste.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={refreshAccounts}
                      disabled={loadingAccounts}
                    >
                      {loadingAccounts && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Rafraîchir les comptes
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedAccountId || account.google_merchant_account_id}
                    onValueChange={(value) => {
                      setSelectedAccountId(value);
                      selectMerchantAccount(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAccounts.map((acc: MerchantAccountOption) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={refreshAccounts}
                      disabled={loadingAccounts}
                    >
                      {loadingAccounts && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Rafraîchir
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {hasSelectedAccount && (
              <div>
                <Label className="text-xs text-muted-foreground">ID du compte sélectionné</Label>
                <p className="text-sm font-medium font-mono">{account.google_merchant_account_id}</p>
              </div>
            )}

            {account.last_synced_at && (
              <div>
                <Label className="text-xs text-muted-foreground">Dernière synchronisation</Label>
                <p className="text-sm">
                  {new Date(account.last_synced_at).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* Sync Actions */}
          {canSync && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="text-sm font-medium mb-2">Prêt à synchroniser</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Vos promotions actives seront envoyées vers Google Shopping.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={syncToGoogle}
                    disabled={syncing}
                    size="sm"
                  >
                    {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {syncing ? "Synchronisation..." : "Synchroniser maintenant"}
                    <RefreshCw className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={disconnect}
                  >
                    Déconnecter
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isConnected && !hasSelectedAccount && availableAccounts.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm">
                  Sélectionnez un compte Merchant Center pour activer la synchronisation.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {!canSync && hasSelectedAccount && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={disconnect}>
                Déconnecter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="pt-4 border-t space-y-2">
        <p className="text-xs font-semibold">À propos de Google Merchant Center</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Diffusez vos promotions sur Google Shopping</li>
          <li>Synchronisation à la demande depuis PromoJour</li>
          <li>Un compte Google avec un Merchant Center est requis</li>
          <li>Les codes-barres EAN sont automatiquement inclus</li>
        </ul>
        <div className="pt-2 space-y-1">
          <a
            href="https://merchants.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-primary hover:underline"
          >
            Créer un compte Merchant Center
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://support.google.com/merchants"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-primary hover:underline"
          >
            Documentation Google
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
