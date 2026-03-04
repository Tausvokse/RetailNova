export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
};

const CART_STORAGE_KEY = "retailnova_cart";
const CART_OWNER_KEY = "retailnova_cart_owner";

function emitCartUpdated() {
  window.dispatchEvent(new Event("cart:updated"));
}

export function setCartOwner(ownerId: string) {
  const nextOwner = ownerId || "guest";
  const currentOwner = localStorage.getItem(CART_OWNER_KEY) || "guest";

  if (currentOwner !== nextOwner) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
    emitCartUpdated();
  }

  localStorage.setItem(CART_OWNER_KEY, nextOwner);
}

export function resetCartOwnerToGuest() {
  localStorage.setItem(CART_OWNER_KEY, "guest");
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
  emitCartUpdated();
}

export function getCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  emitCartUpdated();
}

export function addToCart(item: CartItem) {
  const items = getCartItems();
  const existing = items.find((cartItem) => cartItem.id === item.id);

  if (existing) {
    existing.quantity = Math.min(existing.stock, existing.quantity + item.quantity);
    setCartItems([...items]);
    return;
  }

  setCartItems([...items, item]);
}

export function clearCart() {
  setCartItems([]);
}

export function getCartCount(): number {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}
