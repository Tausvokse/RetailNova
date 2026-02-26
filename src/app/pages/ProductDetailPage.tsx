import { useState } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Clock, Shield, Truck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { StockStatusBadge } from "../components/StockStatusBadge";
import { Header } from "../components/Header";

export function ProductDetailPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Mock product data
  const product = {
    id: "prod-001",
    name: "Преміум бездротові навушники",
    price: 249.99,
    description:
      "Насолоджуйтесь чудовою якістю звуку з нашими преміум бездротовими навушниками. Активне шумозаглушення, 30 годин автономної роботи та преміальна м'яка підкладка для комфортного прослуховування весь день.",
    stock: 2,
    images: [
      "https://images.unsplash.com/photo-1738920424218-3d28b951740a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBwcm9kdWN0fGVufDF8fHx8MTc3MjEwNDQ2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    features: [
      "Активне шумозаглушення",
      "30 годин автономної роботи",
      "Bluetooth 5.0",
      "Преміальна м'яка підкладка",
      "Вбудований мікрофон",
    ],
  };

  const handleAddToCart = () => {
    // Navigate to checkout with product data
    navigate("/checkout", {
      state: {
        items: [
          {
            ...product,
            quantity,
          },
        ],
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header cartCount={0} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail gallery */}
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? "border-[#1e40af] ring-2 ring-[#1e40af]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <Card className="p-4 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-[#1e40af]" />
                <p className="text-xs text-gray-600">Безпечна оплата</p>
              </Card>
              <Card className="p-4 text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-[#1e40af]" />
                <p className="text-xs text-gray-600">Швидка доставка</p>
              </Card>
              <Card className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-[#1e40af]" />
                <p className="text-xs text-gray-600">Актуальні залишки</p>
              </Card>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">Новинка</Badge>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-4xl font-semibold text-[#1e40af]">${product.price}</p>
            </div>

            {/* Stock Status Badge - Key Feature */}
            <StockStatusBadge stock={product.stock} />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Опис</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Ключові характеристики</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1e40af] mt-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Кількість</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                className="w-full py-6 text-lg bg-[#1e40af] hover:bg-[#1e3a8a]"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Додати до кошика
              </Button>

              {/* Additional Info */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Синхронізація інвентаризації в реальному часі:</strong> Наша система оновлює залишки товарів на всіх каналах майже в реальному часі, щоб запобігти надмірним продажам.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}