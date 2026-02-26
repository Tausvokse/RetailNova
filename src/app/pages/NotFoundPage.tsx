import { useNavigate } from "react-router";
import { Home, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Header } from "../components/Header";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartCount={0} />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Сторінку не знайдено</h1>
          <p className="text-gray-600 mb-8">
            Сторінка, яку ви шукаєте, не існує або була переміщена.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] gap-2"
            size="lg"
          >
            <Home className="w-5 h-5" />
            Повернутися на головну
          </Button>
        </Card>
      </div>
    </div>
  );
}