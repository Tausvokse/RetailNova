import { AlertCircle } from "lucide-react";
import { Card } from "./ui/card";

interface StockStatusBadgeProps {
  stock: number;
}

export function StockStatusBadge({ stock }: StockStatusBadgeProps) {
  if (stock === 0) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div>
            <p className="font-medium text-red-900">Немає в наявності</p>
            <p className="text-sm text-red-700">Цей товар наразі недоступний</p>
          </div>
        </div>
      </Card>
    );
  }

  if (stock <= 5) {
    return (
      <Card className="p-4 border-orange-200 bg-orange-50">
        <div className="flex items-center gap-3">
          {/* Pulsing dot animation */}
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-[#f97316] animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#f97316] animate-ping opacity-75" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-700" />
              <p className="font-medium text-orange-900">
                Залишилось лише {stock} {stock > 1 ? "товари" : "товар"} - Замовляйте скоріше!
              </p>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Синхронізація в реальному часі • Оновлено щойно
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-green-200 bg-green-50">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
        <div>
          <p className="font-medium text-green-900">В наявності</p>
          <p className="text-sm text-green-700">Готовий до відправки • Відстеження інвентаризації в реальному часі</p>
        </div>
      </div>
    </Card>
  );
}