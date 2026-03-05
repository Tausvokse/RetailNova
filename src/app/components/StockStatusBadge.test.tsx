import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StockStatusBadge } from './StockStatusBadge';

describe('StockStatusBadge Component', () => {
  it('повинен відображати статус "Немає в наявності", коли stock === 0', () => {
    render(<StockStatusBadge stock={0} />);
    
    expect(screen.getByText('Немає в наявності')).toBeInTheDocument();
    expect(screen.getByText('Цей товар наразі недоступний')).toBeInTheDocument();
  });

  it('повинен відображати статус "Немає в наявності" з інформацією про тимчасовий резерв, коли stock === 0 та є temporarilyReserved', () => {
    render(<StockStatusBadge stock={0} temporarilyReserved={3} />);
    
    expect(screen.getByText('Немає в наявності')).toBeInTheDocument();
    expect(screen.getByText('3 тимчасово зарезервовано.')).toBeInTheDocument();
  });

  it('повинен відображати статус "Залишилось лише X шт.", коли stock > 0 та stock <= 5', () => {
    render(<StockStatusBadge stock={4} />);
    
    expect(screen.getByText('Залишилось лише 4 шт.')).toBeInTheDocument();
    expect(screen.getByText('Замовляйте скоріше')).toBeInTheDocument();
  });

  it('повинен відображати статус "Залишилось лише X шт." з інформацією про тимчасовий резерв, коли stock <= 5', () => {
    render(<StockStatusBadge stock={2} temporarilyReserved={1} />);
    
    expect(screen.getByText('Залишилось лише 2 шт.')).toBeInTheDocument();
    expect(screen.getByText('1 тимчасово зарезервовано.')).toBeInTheDocument();
  });

  it('повинен відображати статус "В наявності", коли stock > 5', () => {
    render(<StockStatusBadge stock={10} />);
    
    expect(screen.getByText('В наявності')).toBeInTheDocument();
    expect(screen.getByText('Готовий до відправки')).toBeInTheDocument();
  });

  it('повинен відображати статус "В наявності" з інформацією про тимчасовий резерв, коли stock > 5', () => {
    render(<StockStatusBadge stock={15} temporarilyReserved={5} />);
    
    expect(screen.getByText('В наявності')).toBeInTheDocument();
    expect(screen.getByText('5 тимчасово зарезервовано.')).toBeInTheDocument();
  });
});