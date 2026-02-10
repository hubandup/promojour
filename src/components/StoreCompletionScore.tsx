import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface StoreCompletionScoreProps {
  store: {
    name: string;
    description: string | null;
    cover_image_url: string | null;
    address_line1: string | null;
    phone: string | null;
    email: string | null;
    website_url: string | null;
    opening_hours: any;
    google_maps_url: string | null;
  } | null;
}

export const StoreCompletionScore = ({ store }: StoreCompletionScoreProps) => {
  if (!store) return null;

  const fields = [
    { label: "Nom", filled: !!store.name },
    { label: "Description", filled: !!store.description },
    { label: "Couverture", filled: !!store.cover_image_url },
    { label: "Adresse", filled: !!store.address_line1 },
    { label: "Téléphone", filled: !!store.phone },
    { label: "Email", filled: !!store.email },
    { label: "Site web", filled: !!store.website_url },
    { label: "Horaires", filled: store.opening_hours && Object.values(store.opening_hours).some((h: any) => !h.closed) },
    { label: "Google Maps", filled: !!store.google_maps_url },
  ];

  const filledCount = fields.filter((f) => f.filled).length;
  const score = Math.round((filledCount / fields.length) * 100);
  const isComplete = score === 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-orange-500" />
          )}
          <span className="text-sm font-medium">
            Profil {isComplete ? "complet" : `${score}% complété`}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{filledCount}/{fields.length}</span>
      </div>
      <Progress value={score} className="h-2" />
      {!isComplete && (
        <div className="flex flex-wrap gap-1.5">
          {fields
            .filter((f) => !f.filled)
            .map((f) => (
              <span
                key={f.label}
                className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20"
              >
                {f.label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};
