import { useLocation, useNavigate, useParams } from "react-router";
import { CheckCircle2, Package, Truck, Home, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Header } from "../components/Header";

export function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { items = [], total = 0 } = location.state || {};

  const orderStages = [
    { id: "confirmed", label: "Підтверджено", icon: CheckCircle2, status: "active" },
    { id: "packing", label: "Пакування", icon: Package, status: "pending" },
    { id: "shipped", label: "Відправлено", icon: Truck, status: "pending" },
    { id: "delivered", label: "Доставлено", icon: Home, status: "pending" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header cartCount={0} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message - Key Feature */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-16 h-16 text-[#22c55e]" />
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">
            Дякуємо! Замовлення #{orderId} автоматично підтверджено.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ваші товари успішно зарезервовані та відправлені на склад для пакування.
          </p>
        </div>

        {/* Order Status Tracker - Status Tracker Feature */}
        <Card className="p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-8">Статус замовлення</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-[#22c55e] transition-all duration-500"
                style={{ width: "25%" }}
              />
            </div>

            {/* Status Steps */}
            <div className="relative grid grid-cols-4 gap-4">
              {orderStages.map((stage, idx) => {
                const Icon = stage.icon;
                const isActive = stage.status === "active";
                const isPending = stage.status === "pending";

                return (
                  <div key={stage.id} className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all ${
                        isActive
                          ? "bg-[#22c55e] text-white ring-4 ring-green-100"
                          : isPending
                          ? "bg-gray-200 text-gray-400"
                          : "bg-[#22c55e] text-white"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <p
                      className={`text-sm font-medium text-center ${
                        isActive ? "text-[#22c55e]" : isPending ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {stage.label}
                    </p>
                    {isActive && (
                      <span className="text-xs text-green-600 mt-1 font-medium">Активний</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Деталі замовлення</h2>
          
          <div className="space-y-4 mb-6">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600 mt-1">Кількість: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Всього</span>
              <span className="text-[#22c55e]">${total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Auto-Confirmation Info */}
        <Card className="p-6 bg-green-50 border-green-200 mb-8">
          <div className="flex gap-4">
            <CheckCircle2 className="w-6 h-6 text-[#22c55e] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Автоматичне підтвердження замовлення</h3>
              <p className="text-sm text-green-800">
                Ваше замовлення було автоматично підтверджено після завершення оплати. Це гарантує, що ваші товари негайно резервуються в нашій системі складу, запобігаючи будь-якій можливості надмірних продажів. Ви отримаєте інформацію про відстеження, коли ваше замовлення буде відправлено.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            Продовжити покупки
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            className="gap-2 bg-[#1e40af] hover:bg-[#1e3a8a]"
            onClick={() => alert("Функціонал відстеження замовлення буде реалізовано тут")}
          >
            <Package className="w-4 h-4" />
            Відстежити замовлення
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Питання щодо вашого замовлення?{" "}
            <a href="#" className="text-[#1e40af] hover:underline">
              Зверніться до нашої служби підтримки
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}