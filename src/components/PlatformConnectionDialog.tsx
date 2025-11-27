import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: {
    name: string;
    logo: React.ReactNode;
    description: string;
    isConnected?: boolean;
    isComingSoon?: boolean;
    steps?: {
      title: string;
      description: string;
      action?: {
        label: string;
        onClick: () => void;
      };
    }[];
    about?: {
      title: string;
      items: string[];
    };
    links?: {
      label: string;
      url: string;
    }[];
    onConnect?: () => void;
  };
}

export function PlatformConnectionDialog({
  open,
  onOpenChange,
  platform,
}: PlatformConnectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {platform.logo}
              </div>
              <div>
                <DialogTitle className="text-2xl mb-1">{platform.name}</DialogTitle>
                <p className="text-muted-foreground text-sm">
                  {platform.description}
                </p>
              </div>
            </div>
            <Badge
              variant={platform.isConnected ? "default" : "secondary"}
              className={cn(
                "flex-shrink-0",
                platform.isConnected && "bg-green-500/10 text-green-700 border-green-500/20"
              )}
            >
              {platform.isComingSoon
                ? "Prochainement"
                : platform.isConnected
                ? "Connecté"
                : "Non connecté"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Steps */}
          {platform.steps && !platform.isComingSoon && (
            <div className="space-y-4">
              {platform.steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-xl border bg-card p-6 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {step.description}
                      </p>
                      {step.action && (
                        <Button
                          onClick={step.action.onClick}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {step.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Coming Soon Message */}
          {platform.isComingSoon && (
            <div className="rounded-xl border bg-muted/50 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Fonctionnalité à venir</h3>
              <p className="text-muted-foreground text-sm">
                Cette intégration sera bientôt disponible. Nous vous tiendrons informé dès son lancement.
              </p>
            </div>
          )}

          {/* About section */}
          {platform.about && !platform.isComingSoon && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{platform.about.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {platform.about.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links */}
          {platform.links && !platform.isComingSoon && (
            <div className="space-y-2 pt-2 border-t">
              {platform.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {link.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
