import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Promotion } from "@/hooks/use-promotions";

interface PromotionsCalendarProps {
  promotions: Promotion[];
  onPromotionClick?: (promotion: Promotion) => void;
}

export function PromotionsCalendar({ promotions, onPromotionClick }: PromotionsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPromotionsForDay = (day: Date) => {
    return promotions.filter(promo => {
      const startDate = new Date(promo.start_date);
      const endDate = new Date(promo.end_date);
      return day >= startDate && day <= endDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "scheduled":
        return "bg-blue-500";
      case "expired":
        return "bg-gray-400";
      default:
        return "bg-muted";
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <Card className="glass-card border-border/50">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-xl"
            >
              Aujourd'hui
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, dayIdx) => {
            const dayPromotions = getPromotionsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);

            return (
              <div
                key={dayIdx}
                className={cn(
                  "min-h-[120px] p-2 rounded-xl border transition-smooth",
                  isCurrentMonth
                    ? "bg-background/50 border-border/50"
                    : "bg-muted/20 border-border/20 opacity-50",
                  isDayToday && "ring-2 ring-primary/50 border-primary/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isDayToday
                        ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                        : ""
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayPromotions.length > 0 && (
                    <Badge variant="secondary" className="h-5 text-xs">
                      {dayPromotions.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {dayPromotions.slice(0, 3).map((promo) => (
                    <button
                      key={promo.id}
                      onClick={() => onPromotionClick?.(promo)}
                      className={cn(
                        "w-full text-left p-1.5 rounded-lg text-xs transition-smooth",
                        "hover:shadow-md cursor-pointer",
                        "border border-border/30"
                      )}
                      style={{
                        background: `linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            getStatusColor(promo.status)
                          )}
                        />
                        <span className="truncate font-medium text-foreground">
                          {promo.title}
                        </span>
                      </div>
                    </button>
                  ))}
                  {dayPromotions.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center pt-1">
                      +{dayPromotions.length - 3} de plus
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Actif</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">Programmé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-muted-foreground">Expiré</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
