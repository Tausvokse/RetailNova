import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Clock, CreditCard, Truck, MapPin, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Header } from "../components/Header";

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("standard");

  const items = location.state?.items || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowExpiredModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTotal = () => {
    return items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  };

  const handlePlaceOrder = () => {
    const orderId = "RN-" + Math.floor(Math.random() * 10000);
    navigate(`/order-success/${orderId}`, {
      state: {
        orderId,
        items,
        total: calculateTotal(),
      },
    });
  };

  const handleRefreshAvailability = () => {
    navigate("/");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header cartCount={0} />
        <div className="flex items-center justify-center pt-20">
          <Card className="p-8 text-center max-w-md">
            <p className="text-gray-600 mb-4">Ваш кошик порожній</p>
            <Button onClick={() => navigate("/")}>Продовжити покупки</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Timer Banner - Key Feature */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <Clock className="w-5 h-5 animate-pulse" />
          <p className="font-semibold text-lg">
            Товари тимчасово зарезервовані. Будь ласка, завершіть оформлення замовлення за{" "}
            <span className="font-mono text-xl">{formatTime(timeLeft)}</span>
          </p>
        </div>
      </div>

      {/* Header */}
      <Header cartCount={items.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Оформлення замовлення</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center text-sm">
                  1
                </div>
                Контактна інформація
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Ім'я</Label>
                    <Input id="firstName" placeholder="Іван" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Прізвище</Label>
                    <Input id="lastName" placeholder="Петренко" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Електронна пошта</Label>
                  <Input id="email" type="email" placeholder="ivan.petrenko@example.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" type="tel" placeholder="+380 (99) 123-45-67" />
                </div>
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center text-sm">
                  2
                </div>
                Адреса доставки
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Вулиця та номер будинку</Label>
                  <Input id="address" placeholder="вул. Хрещатик, 1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Місто</Label>
                    <Input id="city" placeholder="Київ" />
                  </div>
                  <div>
                    <Label htmlFor="state">Область</Label>
                    <Input id="state" placeholder="Київська" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zip">Поштовий індекс</Label>
                  <Input id="zip" placeholder="01001" />
                </div>
              </div>
            </Card>

            {/* Delivery Method */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center text-sm">
                  3
                </div>
                Спосіб доставки
              </h2>
              <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="standard" id="standard" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">Стандартна доставка</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">5-7 робочих днів • Безкоштовно</p>
                    </div>
                    <span className="font-semibold">$0.00</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="express" id="express" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">Експрес доставка</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">2-3 робочих дні</p>
                    </div>
                    <span className="font-semibold">$15.00</span>
                  </label>
                </div>
              </RadioGroup>
            </Card>

            {/* Payment */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center text-sm">
                  4
                </div>
                Оплата
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Номер картки</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Термін дії</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" type="password" maxLength={3} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary Sidebar - Key Feature */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Підсумок замовлення</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600">Кіл-ть: {item.quantity}</p>
                      <p className="font-semibold text-[#1e40af]">${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Проміжний підсумок</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Доставка</span>
                  <span>{deliveryMethod === "express" ? "$15.00" : "Безкоштовно"}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                  <span>Всього</span>
                  <span className="text-[#1e40af]">
                    ${(calculateTotal() + (deliveryMethod === "express" ? 15 : 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full py-6 text-lg bg-[#1e40af] hover:bg-[#1e3a8a]"
                onClick={handlePlaceOrder}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Оформити замовлення
              </Button>

              <Card className="mt-4 p-3 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-900">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Ваші товари зарезервовані з жорстким обмеженням часу. Завершіть оформлення до закінчення таймера.
                </p>
              </Card>
            </Card>
          </div>
        </div>
      </div>

      {/* Expired Reservation Modal - Alternative State */}
      <Dialog open={showExpiredModal} onOpenChange={setShowExpiredModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Clock className="w-6 h-6" />
              Час резервування закінчився
            </DialogTitle>
            <DialogDescription className="pt-4">
              Час вашого резервування минув. Товари повернуто на загальний склад. Будь ласка, оновіть наявність і спробуйте знову.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              className="w-full bg-[#1e40af] hover:bg-[#1e3a8a]"
              onClick={handleRefreshAvailability}
            >
              Оновити наявність
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowExpiredModal(false)}>
              Скасувати
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}