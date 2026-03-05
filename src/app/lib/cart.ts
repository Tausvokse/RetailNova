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

const inMemoryStorage = new Map<string, string>();

export function getStorage() {
  const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  
  return {
    getItem: (key: string): string | null => {
      try {
        if (isBrowser) return window.localStorage.getItem(key);
      } catch (e) { 
      }
      return inMemoryStorage.get(key) || null;
    },
    setItem: (key: string, value: string): void => {
      try {
        if (isBrowser) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch (e) {
      }
      inMemoryStorage.set(key, value);
    },
    removeItem: (key: string): void => {
      try {
        if (isBrowser) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch (e) {
      }
      inMemoryStorage.delete(key);
    },
    clear: (): void => {
      try {
        if (isBrowser) {
          if (typeof window.localStorage.clear === 'function') {
            window.localStorage.clear();
          } else {
            window.localStorage.removeItem(CART_STORAGE_KEY);
            window.localStorage.removeItem(CART_OWNER_KEY);
          }
          return;
        }
      } catch (e) {
        // Ігноруємо
      }
      inMemoryStorage.clear();
    }
  };
}

function emitCartUpdated() {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof Event !== "undefined") {
    try {
      window.dispatchEvent(new Event("cart:updated"));
    } catch (e) {
    }
  }
}

export function setCartOwner(ownerId: string) {
  const nextOwner = ownerId || "guest";
  const storage = getStorage();
  const currentOwner = storage.getItem(CART_OWNER_KEY) || "guest";

  if (currentOwner !== nextOwner) {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
    emitCartUpdated();
  }

  storage.setItem(CART_OWNER_KEY, nextOwner);
}

export function resetCartOwnerToGuest() {
  const storage = getStorage();
  storage.setItem(CART_OWNER_KEY, "guest");
  storage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
  emitCartUpdated();
}

export function getCartItems(): CartItem[] {
  try {
    const storage = getStorage();
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItem[]) {
  const storage = getStorage();
  storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
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