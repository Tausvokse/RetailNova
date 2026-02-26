import { Header } from "../components/Header";
import { Card } from "../components/ui/card";
import { Shield, Clock, Truck, CheckCircle2, Users, Award } from "lucide-react";

export function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Надійність",
      description:
        "Ми гарантуємо безпеку ваших даних і транзакцій на всіх етапах покупки.",
    },
    {
      icon: Clock,
      title: "Точність у реальному часі",
      description:
        "Наша система відстежує залишки товарів у реальному часі на всіх каналах продажу.",
    },
    {
      icon: Truck,
      title: "Швидка доставка",
      description:
        "Ми працюємо з найкращими службами доставки для швидкого отримання замовлень.",
    },
    {
      icon: CheckCircle2,
      title: "Гарантія якості",
      description:
        "Всі товари проходять ретельну перевірку перед відправкою покупцю.",
    },
  ];

  const stats = [
    { value: "50,000+", label: "Задоволених клієнтів" },
    { value: "99.9%", label: "Точність залишків" },
    { value: "24/7", label: "Підтримка клієнтів" },
    { value: "100+", label: "Партнерських магазинів" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#1e40af] to-[#1e3a8a] text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold mb-6">
              Про RetailNova
            </h1>
            <p className="text-xl max-w-3xl mx-auto text-blue-100">
              Ми — омніканальна роздрібна мережа, яка вирішує проблему
              надмірних продажів через відстеження інвентаризації в реальному
              часі та систему жорстких резервувань з таймером.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Наша місія
              </h2>
              <p className="text-gray-600 mb-4">
                RetailNova створена для вирішення однієї з найбільших проблем
                у сучасній роздрібній торгівлі — подвійних продажів та
                надмірного продажу товарів. Ми використовуємо найновіші
                технології для забезпечення точної синхронізації залишків на
                всіх каналах продажу.
              </p>
              <p className="text-gray-600">
                Наша платформа забезпечує прозорість і довіру між продавцем і
                покупцем, гарантуючи, що кожен товар у кошику дійсно
                доступний для покупки. Це не просто магазин — це технологічне
                рішення для надійних покупок.
              </p>
            </div>
            <Card className="p-8 bg-blue-50 border-blue-200">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#1e40af] rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Клієнтоорієнтованість
                    </h3>
                    <p className="text-sm text-gray-600">
                      Ваше задоволення — наш пріоритет номер один
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#1e40af] rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Інновації
                    </h3>
                    <p className="text-sm text-gray-600">
                      Постійно вдосконалюємо наші технології
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-4xl font-semibold text-[#1e40af] mb-2">
                    {stat.value}
                  </p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Наші цінності
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Принципи, якими ми керуємося у роботі для забезпечення
              найкращого сервісу
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <Card key={idx} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-[#1e40af]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Technology Section */}
        <section className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6">
                Технологія запобігання надмірним продажам
              </h2>
              <p className="text-gray-600 mb-8">
                Наша система використовує розподілені блокування та таймери
                резервування для забезпечення того, що товари не будуть
                продані двічі. Коли ви додаєте товар до кошика та переходите
                до оформлення, система створює жорстке резервування з
                15-хвилинним таймером TTL (Time To Live).
              </p>
              <Card className="p-6 bg-white border-[#1e40af] text-left">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Як це працює:
                </h3>
                <ol className="space-y-3 text-gray-600">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1e40af] text-white flex items-center justify-center flex-shrink-0 text-sm">
                      1
                    </span>
                    <span>
                      Синхронізація залишків у реальному часі на всіх каналах
                      продажу
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1e40af] text-white flex items-center justify-center flex-shrink-0 text-sm">
                      2
                    </span>
                    <span>
                      Жорстке резервування товарів при переході до оформлення
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1e40af] text-white flex items-center justify-center flex-shrink-0 text-sm">
                      3
                    </span>
                    <span>
                      Таймер з обмеженням часу для завершення покупки
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1e40af] text-white flex items-center justify-center flex-shrink-0 text-sm">
                      4
                    </span>
                    <span>
                      Автоматичне підтвердження та резервування на складі
                    </span>
                  </li>
                </ol>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
