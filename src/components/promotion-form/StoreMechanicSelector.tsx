import { Tag, Percent, Package, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface MechanicOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const STORE_MECHANICS: MechanicOption[] = [
  { value: "price_discount", label: "Remise de prix", icon: <Tag className="w-5 h-5" /> },
  { value: "percentage_discount", label: "Pourcentage", icon: <Percent className="w-5 h-5" /> },
  { value: "bundle_offer", label: "Offre groupée", icon: <Package className="w-5 h-5" /> },
  { value: "free_offer", label: "Gratuit", icon: <Gift className="w-5 h-5" /> },
];

interface StoreMechanicSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function StoreMechanicSelector({ value, onChange }: StoreMechanicSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {STORE_MECHANICS.map((mechanic) => (
        <button
          key={mechanic.value}
          type="button"
          onClick={() => onChange(mechanic.value)}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium",
            value === mechanic.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {mechanic.icon}
          <span className="text-xs leading-tight text-center">{mechanic.label}</span>
        </button>
      ))}
    </div>
  );
}
