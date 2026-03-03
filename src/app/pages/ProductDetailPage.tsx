import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ShoppingCart, Clock, Shield, Truck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { StockStatusBadge } from "../components/StockStatusBadge";
import { Header } from "../components/Header";
import { api } from "../lib/api";

type Product = { id: string; name: string; price: number; description: string; stock: number; image: string; badge?: string; features?: string[] };

export function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => { if (id) api<Product>(`/products/${id}`).then(setProduct).catch(() => setProduct(null)); }, [id]);
  const [quantity, setQuantity] = useState(1);

  if (!product) return <div className="min-h-screen bg-gray-50"><Header cartCount={0} /><div className="max-w-7xl mx-auto p-8">Товар не знайдено</div></div>;

  const images = [product.image];
  const features = product.features || [];

  const handleAddToCart = () => navigate("/checkout", { state: { items: [{ ...product, images, quantity }] } });

  return (
    <div className="min-h-screen bg-gray-50"><Header cartCount={0} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4"><div className="aspect-square bg-white rounded-lg shadow-md overflow-hidden"><img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" /></div>
          <div className="grid grid-cols-4 gap-2">{images.map((img, idx) => <button key={idx} onClick={() => setSelectedImage(idx)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? "border-[#1e40af] ring-2 ring-[#1e40af]/20" : "border-gray-200 hover:border-gray-300"}`}><img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" /></button>)}</div>
          <div className="grid grid-cols-3 gap-4 pt-4"><Card className="p-4 text-center"><Shield className="w-6 h-6 mx-auto mb-2 text-[#1e40af]" /><p className="text-xs text-gray-600">Безпечна оплата</p></Card><Card className="p-4 text-center"><Truck className="w-6 h-6 mx-auto mb-2 text-[#1e40af]" /><p className="text-xs text-gray-600">Швидка доставка</p></Card><Card className="p-4 text-center"><Clock className="w-6 h-6 mx-auto mb-2 text-[#1e40af]" /><p className="text-xs text-gray-600">Актуальні залишки</p></Card></div>
        </div>
        <div className="space-y-6"><div>{product.badge && <Badge variant="outline" className="mb-2">{product.badge}</Badge>}<h1 className="text-3xl font-semibold text-gray-900 mb-2">{product.name}</h1><p className="text-4xl font-semibold text-[#1e40af]">${product.price}</p></div>
          <StockStatusBadge stock={product.stock} />
          <div><h3 className="text-sm font-medium text-gray-900 mb-2">Опис</h3><p className="text-gray-600">{product.description}</p></div>
          <div><h3 className="text-sm font-medium text-gray-900 mb-2">Ключові характеристики</h3><ul className="space-y-2">{features.map((feature, idx) => <li key={idx} className="flex items-start gap-2 text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-[#1e40af] mt-2 flex-shrink-0" />{feature}</li>)}</ul></div>
          <div><label className="text-sm font-medium text-gray-900 mb-2 block">Кількість</label><div className="flex items-center gap-3"><Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button><span className="w-12 text-center font-medium">{quantity}</span><Button variant="outline" size="sm" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>+</Button></div></div>
          <Button className="w-full py-6 text-lg bg-[#1e40af] hover:bg-[#1e3a8a]" onClick={handleAddToCart} disabled={product.stock === 0}><ShoppingCart className="w-5 h-5 mr-2" />Додати до кошика</Button>
        </div></div></main></div>
  );
}
