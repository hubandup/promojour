import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InfoCardVariant = "primary" | "warning" | "success" | "info";

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: InfoCardVariant;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<InfoCardVariant, { card: string; iconBg: string }> = {
  primary: {
    card: "border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent",
    iconBg: "bg-gradient-to-br from-primary to-accent",
  },
  warning: {
    card: "border-yellow/30 bg-gradient-to-br from-yellow/10 via-orange/5 to-transparent",
    iconBg: "bg-gradient-to-br from-yellow to-orange",
  },
  success: {
    card: "border-green-500/30 bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent",
    iconBg: "bg-gradient-to-br from-green-500 to-green-400",
  },
  info: {
    card: "border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-400",
  },
};

export const InfoCard = ({
  icon: Icon,
  title,
  description,
  variant = "primary",
  children,
  className,
}: InfoCardProps) => {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("glass-card shadow-glow", styles.card, className)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md",
              styles.iconBg
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
