import { useState } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([
    {
      id: "prod-001",
      name: "Преміум бездротові навушники",
      price: 249.99,
      quantity: 1,
      stock: 2,
      image: "https://images.unsplash.com/photo-1738920424218-3d28b951740a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBwcm9kdWN0fGVufDF8fHx8MTc3MjEwNDQ2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ]);

  const updateQuantity = (id: string, newQuantity: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(item.stock, newQuantity)) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    navigate("/checkout", {
      state: {
        items: cartItems.map((item) => ({
          ...item,
          images: [item.image],
        })),
      },
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header cartCount={0} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-12 text-center">
            <ShoppingCart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Ваш кошик порожній
            </h2>
            <p className="text-gray-600 mb-6">
              Додайте товари до кошика, щоб продовжити покупки
            </p>
            <Button
              onClick={() => navigate("/catalog")}
              className="bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Перейти до каталогу
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={cartItems.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Кошик</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          В наявності: {item.stock} шт.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Price */}
                      <p className="text-xl font-semibold text-[#1e40af]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Підсумок замовлення
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Проміжний підсумок</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Доставка</span>
                  <span>Розраховується при оформленні</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Податок</span>
                  <span>Включено</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Всього</span>
                    <span className="text-[#1e40af]">
                      ${calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full py-6 text-lg bg-[#1e40af] hover:bg-[#1e3a8a] mb-3"
              >
                Перейти до оформлення
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/catalog")}
                className="w-full"
              >
                Продовжити покупки
              </Button>

              <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-900">
                  <strong>Гарантія резервування:</strong> Після переходу до
                  оформлення ваші товари будуть зарезервовані на 15 хвилин.
                </p>
              </Card>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
