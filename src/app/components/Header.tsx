import { ShoppingCart, User, Menu, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { api, clearToken, getToken, getIsAdmin, clearIsAdmin } from "../lib/api";
import { getCartCount, resetCartOwnerToGuest } from "../lib/cart";

interface HeaderProps {
  cartCount?: number;
}

export function Header({ cartCount }: HeaderProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState<number>(cartCount ?? 0);

  useEffect(() => {
    setIsAuthed(Boolean(getToken()));
    setIsAdmin(getIsAdmin());
  }, []);

  useEffect(() => {
    setCartItemsCount(typeof cartCount === "number" ? cartCount : getCartCount());

    const updateCartCount = () => {
      if (typeof cartCount === "number") {
        setCartItemsCount(cartCount);
        return;
      }
      setCartItemsCount(getCartCount());
    };

    window.addEventListener("cart:updated", updateCartCount);
    return () => window.removeEventListener("cart:updated", updateCartCount);
  }, [cartCount]);

  const handleLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST" }, true);
    } catch {
      // ignore network logout errors
    }
    clearToken();
    clearIsAdmin();
    resetCartOwnerToGuest();
    setIsAuthed(false);
    setIsAdmin(false);
    navigate("/catalog");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#1e40af] rounded" />
            <span className="text-xl font-semibold text-gray-900">RetailNova</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/catalog" className="text-gray-600 hover:text-gray-900 transition-colors">Каталог</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">Про нас</Link>
            <Link to="/contacts" className="text-gray-600 hover:text-gray-900 transition-colors">Контакти</Link>
            <Link to="/support" className="text-gray-600 hover:text-gray-900 transition-colors">Підтримка</Link>
            {isAdmin && <Link to="/admin/tickets" className="text-gray-600 hover:text-gray-900 transition-colors">Admin</Link>}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/cart")} className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] text-white text-xs rounded-full flex items-center justify-center">{cartItemsCount}</span>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(isAuthed ? "/profile" : "/auth") } className="hidden md:flex">
              <User className="w-5 h-5" />
            </Button>
            {isAuthed ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
                <LogOut className="w-4 h-4 mr-1" /> Вийти
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => navigate("/auth")}>Увійти</Button>
            )}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 space-y-2 border-t mt-4">
            <Link to="/catalog" className="block py-2 text-gray-600" onClick={() => setIsMenuOpen(false)}>Каталог</Link>
            <Link to="/about" className="block py-2 text-gray-600" onClick={() => setIsMenuOpen(false)}>Про нас</Link>
            <Link to="/contacts" className="block py-2 text-gray-600" onClick={() => setIsMenuOpen(false)}>Контакти</Link>
            <Link to="/support" className="block py-2 text-gray-600" onClick={() => setIsMenuOpen(false)}>Підтримка</Link>
            {isAdmin && <Link to="/admin/tickets" className="block py-2 text-gray-600" onClick={() => setIsMenuOpen(false)}>Admin</Link>}
            <Link to="/profile" className="block py-2 text-gray-600" onClick={() => setIsMenuOpen(false)}>Профіль</Link>
          </nav>
        )}
      </div>
    </header>
  );
}