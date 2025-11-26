import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = "warning" | "info" | "success" | "error";

interface InfoAlertProps {
  type: AlertType;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const alertConfig = {
  warning: {
    bgColor: "bg-[hsl(167,100%,60%)]",
    textColor: "text-black",
    icon: AlertTriangle,
  },
  info: {
    bgColor: "bg-blue-500",
    textColor: "text-white",
    icon: Info,
  },
  success: {
    bgColor: "bg-green-500",
    textColor: "text-white",
    icon: CheckCircle,
  },
  error: {
    bgColor: "bg-red-500",
    textColor: "text-white",
    icon: XCircle,
  },
};

export const InfoAlert = ({
  type,
  message,
  dismissible = true,
  onDismiss,
  className,
}: InfoAlertProps) => {
  const [visible, setVisible] = useState(true);
  const config = alertConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <Alert
      className={cn(
        "border-0 shadow-lg relative",
        config.bgColor,
        className
      )}
    >
      <div className="flex items-start gap-4 pr-8">
        <Icon className={cn("h-7 w-7 flex-shrink-0 mt-0.5", config.textColor)} />
        <AlertDescription
          className={cn("font-medium text-base flex-1", config.textColor)}
        >
          {message}
        </AlertDescription>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-3 right-3 h-6 w-6 hover:bg-black/10",
              config.textColor,
              type === "warning" ? "hover:text-black" : "hover:text-white"
            )}
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};
