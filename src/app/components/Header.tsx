import { ShoppingCart, User, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { useState } from "react";

interface HeaderProps {
  cartCount?: number;
}

export function Header({ cartCount = 0 }: HeaderProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#1e40af] rounded" />
            <span className="text-xl font-semibold text-gray-900">RetailNova</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/catalog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Каталог
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              Про нас
            </Link>
            <Link to="/contacts" className="text-gray-600 hover:text-gray-900 transition-colors">
              Контакти
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/cart")}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="hidden md:flex"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 space-y-2 border-t mt-4">
            <Link
              to="/catalog"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Каталог
            </Link>
            <Link
              to="/about"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Про нас
            </Link>
            <Link
              to="/contacts"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Контакти
            </Link>
            <Link
              to="/profile"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Профіль
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}