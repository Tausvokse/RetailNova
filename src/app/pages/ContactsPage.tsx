import { Header } from "../components/Header";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export function ContactsPage() {
  const contactInfo = [
    {
      icon: Phone,
      title: "Телефон",
      details: ["+380 (44) 123-45-67", "+380 (99) 987-65-43"],
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Mail,
      title: "Електронна пошта",
      details: ["support@retailnova.ua", "info@retailnova.ua"],
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: MapPin,
      title: "Адреса",
      details: ["вул. Хрещатик, 1", "Київ, Україна, 01001"],
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Clock,
      title: "Години роботи",
      details: ["Пн-Пт: 9:00 - 18:00", "Сб-Нд: 10:00 - 16:00"],
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Дякуємо за ваше повідомлення! Ми зв'яжемося з вами найближчим часом.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#1e40af] to-[#1e3a8a] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">
              Зв'яжіться з нами
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Ми завжди раді відповісти на ваші запитання та допомогти вам
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <Card key={idx} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div
                    className={`w-16 h-16 ${info.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className={`w-8 h-8 ${info.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {info.title}
                  </h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-sm text-gray-600">
                      {detail}
                    </p>
                  ))}
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Надішліть нам повідомлення
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Ім'я</Label>
                    <Input id="firstName" placeholder="Іван" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Прізвище</Label>
                    <Input id="lastName" placeholder="Петренко" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Електронна пошта</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ivan.petrenko@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+380 (99) 123-45-67"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Тема</Label>
                  <Input
                    id="subject"
                    placeholder="Питання щодо замовлення"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Повідомлення</Label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent resize-none"
                    placeholder="Введіть ваше повідомлення..."
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-6 text-lg bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  Надіслати повідомлення
                </Button>
              </form>
            </Card>

            {/* Additional Info */}
            <div className="space-y-6">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Підтримка клієнтів
                </h2>
                <p className="text-gray-600 mb-6">
                  Наша команда підтримки працює цілодобово, щоб допомогти вам
                  з будь-якими питаннями або проблемами. Середній час
                  відповіді — менше 2 годин.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Онлайн-чат доступний
                      </p>
                      <p className="text-sm text-gray-600">
                        Пн-Пт: 9:00 - 21:00
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Електронна підтримка
                      </p>
                      <p className="text-sm text-gray-600">
                        Відповідь протягом 24 годин
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Phone className="w-3 h-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Телефонна підтримка
                      </p>
                      <p className="text-sm text-gray-600">
                        Цілодобово для невідкладних питань
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Часті запитання
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Перш ніж зв'язатися з нами, перегляньте наш розділ FAQ.
                  Можливо, ви знайдете відповідь на своє запитання швидше!
                </p>
                <Button variant="outline" className="w-full">
                  Переглянути FAQ
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Map Section Placeholder */}
        <section className="bg-gray-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 text-center">
              <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Відвідайте нас
              </h3>
              <p className="text-gray-600 mb-4">
                вул. Хрещатик, 1, Київ, Україна, 01001
              </p>
              <div className="bg-gray-300 h-64 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Карта розташування офісу</p>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
