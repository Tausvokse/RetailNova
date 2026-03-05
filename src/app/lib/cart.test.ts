import { describe, it, expect, beforeEach } from 'vitest';
import { 
  addToCart, 
  getCartItems, 
  clearCart, 
  getCartCount, 
  setCartOwner, 
  resetCartOwnerToGuest,
  getStorage,
  CartItem 
} from './cart';

describe('Cart Utility Functions', () => {
  beforeEach(() => {
    // Використовуємо наш універсальний адаптер сховища для очищення даних перед кожним тестом
    getStorage().clear();
  });

  it('повинен повертати порожній масив, якщо кошик порожній', () => {
    const items = getCartItems();
    expect(items).toEqual([]);
  });

  it('повинен додавати новий товар до кошика', () => {
    const newItem: CartItem = {
      id: 'prod-1',
      name: 'Тестовий товар',
      price: 100,
      quantity: 1,
      stock: 5,
      image: 'test.jpg'
    };

    addToCart(newItem);
    const items = getCartItems();
    
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(newItem);
  });

  it('повинен збільшувати кількість існуючого товару, не перевищуючи stock', () => {
    const item: CartItem = {
      id: 'prod-2',
      name: 'Товар 2',
      price: 50,
      quantity: 2,
      stock: 4,
      image: 'test2.jpg'
    };

    addToCart(item);
    addToCart({ ...item, quantity: 1 });
    
    const items = getCartItems();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(3);

    // Спроба додати більше, ніж є на складі
    addToCart({ ...item, quantity: 5 });
    const itemsAfterMax = getCartItems();
    expect(itemsAfterMax[0].quantity).toBe(4); // Обмежено значенням stock (4)
  });

  it('повинен правильно рахувати загальну кількість товарів', () => {
    addToCart({ id: '1', name: 'A', price: 10, quantity: 2, stock: 10, image: '' });
    addToCart({ id: '2', name: 'B', price: 20, quantity: 3, stock: 10, image: '' });
    
    expect(getCartCount()).toBe(5);
  });

  it('повинен очищати кошик', () => {
    addToCart({ id: '1', name: 'A', price: 10, quantity: 1, stock: 10, image: '' });
    clearCart();
    expect(getCartItems()).toEqual([]);
    expect(getCartCount()).toBe(0);
  });

  it('повинен змінювати власника кошика та очищати дані при зміні користувача', () => {
    addToCart({ id: '1', name: 'A', price: 10, quantity: 1, stock: 10, image: '' });
    
    setCartOwner('user-123');
    // Оскільки змінився власник з guest на user-123, кошик має очиститись
    expect(getCartItems()).toEqual([]);
    expect(getStorage().getItem('retailnova_cart_owner')).toBe('user-123');
  });

  it('не повинен очищати кошик, якщо власник не змінився', () => {
    setCartOwner('user-123');
    addToCart({ id: '1', name: 'A', price: 10, quantity: 1, stock: 10, image: '' });
    
    setCartOwner('user-123');
    expect(getCartCount()).toBe(1);
  });

  it('повинен скидати власника на guest', () => {
    setCartOwner('user-123');
    addToCart({ id: '1', name: 'A', price: 10, quantity: 1, stock: 10, image: '' });
    
    resetCartOwnerToGuest();
    expect(getStorage().getItem('retailnova_cart_owner')).toBe('guest');
    expect(getCartItems()).toEqual([]);
  });
});