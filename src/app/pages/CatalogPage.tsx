import { useState } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Filter, Grid, List } from "lucide-react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export function CatalogPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "Всі товари" },
    { id: "electronics", name: "Електроніка" },
    { id: "audio", name: "Аудіо" },
    { id: "wearables", name: "Носійні пристрої" },
    { id: "computers", name: "Комп'ютери" },
  ];

  const products = [
    {
      id: "prod-001",
      name: "Преміум бездротові навушники",
      price: 249.99,
      category: "audio",
      stock: 2,
      image: "https://images.unsplash.com/photo-1738920424218-3d28b951740a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBwcm9kdWN0fGVufDF8fHx8MTc3MjEwNDQ2MXww&ixlib=rb-4.1.0&q=80&w=1080",
      badge: "Новинка",
    },
    {
      id: "prod-002",
      name: "Професійний ноутбук",
      price: 1299.99,
      category: "computers",
      stock: 15,
      image: "https://images.unsplash.com/photo-1770048792336-e2ca27785b12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsYXB0b3AlMjBjb21wdXRlciUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyMTE2ODY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      badge: "Хіт продажів",
    },
    {
      id: "prod-003",
      name: "Розумний годинник",
      price: 399.99,
      category: "wearables",
      stock: 8,
      image: "https://images.unsplash.com/photo-1716234479503-c460b87bdf98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHdhdGNoJTIwd2VhcmFibGUlMjBkZXZpY2V8ZW58MXx8fHwxNzcyMTE2ODY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "prod-004",
      name: "Бездротові навушники Pro",
      price: 199.99,
      category: "audio",
      stock: 3,
      image: "https://images.unsplash.com/photo-1755182529034-189a6051faae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGVhcmJ1ZHMlMjBwcm9kdWN0JTIwd2hpdGV8ZW58MXx8fHwxNzcyMDcwMTA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      badge: "Новинка",
    },
    {
      id: "prod-005",
      name: "Смартфон Ultra",
      price: 899.99,
      category: "electronics",
      stock: 12,
      image: "https://images.unsplash.com/photo-1761906976176-0559a6d130dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwbW9kZXJuJTIwYmxhY2t8ZW58MXx8fHwxNzcyMTE2ODY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "prod-006",
      name: "Професійна камера",
      price: 1799.99,
      category: "electronics",
      stock: 5,
      image: "https://images.unsplash.com/photo-1751107996077-aee030806ca5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBkc2xyJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MjA0MzIzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      badge: "Хіт продажів",
    },
    {
      id: "prod-007",
      name: "Планшет Pro",
      price: 699.99,
      category: "computers",
      stock: 20,
      image: "https://images.unsplash.com/photo-1769603795371-ad63bd85d524?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZXQlMjBkZXZpY2UlMjBtb2Rlcm58ZW58MXx8fHwxNzcyMDQ5ODAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const getStockBadgeColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-700 border-red-200";
    if (stock <= 5) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getStockText = (stock: number) => {
    if (stock === 0) return "Немає в наявності";
    if (stock <= 5) return `Лише ${stock} шт.`;
    return "В наявності";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Каталог товарів</h1>
          <p className="text-gray-600">
            Відстежування товарів у реальному часі на всіх каналах
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Категорії</h2>
              </div>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-[#1e40af] text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Знайдено {filteredProducts.length} товар(ів)
              </p>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-[#1e40af]" : ""}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[#1e40af]" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid/List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div
                    className={
                      viewMode === "list"
                        ? "w-48 h-48 flex-shrink-0"
                        : "aspect-square"
                    }
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      {product.badge && (
                        <Badge variant="outline" className="flex-shrink-0">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-semibold text-[#1e40af] mb-3">
                      ${product.price}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={getStockBadgeColor(product.stock)}
                      >
                        {getStockText(product.stock)}
                      </Badge>
                      <Button
                        size="sm"
                        className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                        onClick={(e: { stopPropagation: () => void; }) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Купити
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
