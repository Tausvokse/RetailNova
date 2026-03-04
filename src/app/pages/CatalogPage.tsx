import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Filter, Grid, List } from "lucide-react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import { addToCart, getCartCount } from "../lib/cart";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  temporarilyReserved?: number;
  image: string;
  badge?: string;
};

export function CatalogPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const data = await api<Product[]>(`/products${selectedCategory === "all" ? "" : `?category=${selectedCategory}`}`);
        if (!cancelled) {
          setProducts(data);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || "Не вдалося оновити каталог.");
          setProducts([]);
        }
      }
    };

    loadProducts();
    const intervalId = setInterval(loadProducts, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [selectedCategory]);

  const categories = [
    { id: "all", name: "Всі товари" },
    { id: "electronics", name: "Електроніка" },
    { id: "audio", name: "Аудіо" },
    { id: "wearables", name: "Носійні пристрої" },
    { id: "computers", name: "Комп'ютери" },
  ];

  const getStockBadgeColor = (stock: number) => stock === 0 ? "bg-red-100 text-red-700 border-red-200" : stock <= 5 ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-green-100 text-green-700 border-green-200";
  const getStockText = (stock: number, temporarilyReserved = 0) => {
    const mainText = stock === 0 ? "Немає в наявності" : stock <= 5 ? `Лишилось ${stock}` : `В наявності ${stock}`;
    return temporarilyReserved > 0 ? `${mainText}. ${temporarilyReserved} тимчасово зарезервовано` : mainText;
  };

  return <div className="min-h-screen bg-gray-50"><Header cartCount={getCartCount()} />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8"><h1 className="text-3xl font-semibold text-gray-900 mb-2">Каталог товарів</h1><p className="text-gray-600">Відкритий каталог без авторизації</p></div>
      {error && <Card className="mb-6 p-4 border-red-200 bg-red-50 text-red-700">{error}</Card>}
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0"><Card className="p-6"><div className="flex items-center gap-2 mb-4"><Filter className="w-5 h-5 text-gray-600" /><h2 className="font-semibold text-gray-900">Категорії</h2></div><div className="space-y-2">{categories.map((cat) => <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${selectedCategory === cat.id ? "bg-[#1e40af] text-white" : "hover:bg-gray-100 text-gray-700"}`}>{cat.name}</button>)}</div></Card></aside>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6"><p className="text-gray-600">Знайдено {products.length} товар(ів)</p><div className="flex gap-2"><Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-[#1e40af]" : ""}><Grid className="w-4 h-4" /></Button><Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-[#1e40af]" : ""}><List className="w-4 h-4" /></Button></div></div>
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {products.map((product) => <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${viewMode === "list" ? "flex" : ""}`} onClick={() => navigate(`/product/${product.id}`)}>
              <div className={viewMode === "list" ? "w-48 h-48 flex-shrink-0" : "aspect-square"}><img src={product.image} alt={product.name} className="w-full h-full object-cover" /></div>
              <div className="p-4 flex-1"><div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-semibold text-gray-900">{product.name}</h3>{product.badge && <Badge variant="outline" className="flex-shrink-0">{product.badge}</Badge>}</div><p className="text-2xl font-semibold text-[#1e40af] mb-3">${product.price}</p><div className="flex items-center justify-between gap-2"><Badge variant="outline" className={getStockBadgeColor(product.stock)}>{getStockText(product.stock, product.temporarilyReserved)}</Badge><Button size="sm" className="bg-[#1e40af] hover:bg-[#1e3a8a]" onClick={(e: React.MouseEvent) => { e.stopPropagation(); addToCart({ id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock, image: product.image }); navigate("/cart"); }} disabled={product.stock === 0}><ShoppingCart className="w-4 h-4 mr-1" />Додати</Button></div></div>
            </Card>)}
          </div>
        </div>
      </div>
    </main></div>;
}
