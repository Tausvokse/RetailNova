import { useState } from "react";
import { Header } from "../components/Header";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, Package, MapPin, CreditCard, Bell, Shield } from "lucide-react";

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", name: "Профіль", icon: User },
    { id: "orders", name: "Замовлення", icon: Package },
    { id: "addresses", name: "Адреси", icon: MapPin },
    { id: "payment", name: "Оплата", icon: CreditCard },
    { id: "notifications", name: "Сповіщення", icon: Bell },
    { id: "security", name: "Безпека", icon: Shield },
  ];

  const orders = [
    {
      id: "RN-1234",
      date: "25 лютого 2026",
      status: "Доставлено",
      total: 249.99,
      items: 1,
    },
    {
      id: "RN-1235",
      date: "20 лютого 2026",
      status: "В дорозі",
      total: 1299.99,
      items: 1,
    },
    {
      id: "RN-1236",
      date: "15 лютого 2026",
      status: "Підтверджено",
      total: 399.99,
      items: 2,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Особиста інформація
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Ім'я</Label>
                    <Input id="firstName" defaultValue="Іван" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Прізвище</Label>
                    <Input id="lastName" defaultValue="Петренко" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Електронна пошта</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="ivan.petrenko@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    defaultValue="+380 (99) 123-45-67"
                  />
                </div>
                <div>
                  <Label htmlFor="birthday">Дата народження</Label>
                  <Input id="birthday" type="date" defaultValue="1990-01-15" />
                </div>
                <Button className="bg-[#1e40af] hover:bg-[#1e3a8a]">
                  Зберегти зміни
                </Button>
              </div>
            </div>
          </div>
        );

      case "orders":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Історія замовлень
            </h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Замовлення #{order.id}
                      </p>
                      <p className="text-sm text-gray-600">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === "Доставлено"
                            ? "bg-green-100 text-green-700"
                            : order.status === "В дорозі"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Товарів: {order.items}
                      </p>
                      <p className="font-semibold text-[#1e40af]">
                        ${order.total}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Переглянути деталі
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case "addresses":
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Адреси доставки
              </h2>
              <Button className="bg-[#1e40af] hover:bg-[#1e3a8a]">
                Додати адресу
              </Button>
            </div>
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-900">
                        Домашня адреса
                      </p>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        За замовчуванням
                      </span>
                    </div>
                    <p className="text-gray-600">Іван Петренко</p>
                    <p className="text-gray-600">вул. Хрещатик, 1</p>
                    <p className="text-gray-600">Київ, Київська область, 01001</p>
                    <p className="text-gray-600">+380 (99) 123-45-67</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Редагувати
                    </Button>
                    <Button variant="outline" size="sm">
                      Видалити
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case "payment":
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Способи оплати
              </h2>
              <Button className="bg-[#1e40af] hover:bg-[#1e3a8a]">
                Додати картку
              </Button>
            </div>
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        •••• •••• •••• 1234
                      </p>
                      <p className="text-sm text-gray-600">Дійсна до 12/26</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Редагувати
                    </Button>
                    <Button variant="outline" size="sm">
                      Видалити
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Налаштування сповіщень
            </h2>
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Email сповіщення
                    </p>
                    <p className="text-sm text-gray-600">
                      Отримувати оновлення про замовлення на email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-[#1e40af] rounded focus:ring-[#1e40af]"
                  />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">SMS сповіщення</p>
                    <p className="text-sm text-gray-600">
                      Отримувати важливі оновлення через SMS
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-[#1e40af] rounded focus:ring-[#1e40af]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Маркетингові розсилки
                    </p>
                    <p className="text-sm text-gray-600">
                      Отримувати спеціальні пропозиції та знижки
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-[#1e40af] rounded focus:ring-[#1e40af]"
                  />
                </div>
              </Card>
            </div>
          </div>
        );

      case "security":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Безпека акаунту
            </h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Зміна пароля
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Поточний пароль</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Новий пароль</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">
                      Підтвердіть новий пароль
                    </Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="bg-[#1e40af] hover:bg-[#1e3a8a]">
                    Оновити пароль
                  </Button>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Двофакторна автентифікація
                </h3>
                <p className="text-gray-600 mb-4">
                  Додайте додатковий рівень безпеки до вашого акаунту
                </p>
                <Button variant="outline">Увімкнути 2FA</Button>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Мій профіль
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                <p className="font-semibold text-gray-900">Іван Петренко</p>
                <p className="text-sm text-gray-600">ivan.petrenko@example.com</p>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? "bg-[#1e40af] text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-8">{renderContent()}</Card>
          </div>
        </div>
      </main>
    </div>
  );
}
