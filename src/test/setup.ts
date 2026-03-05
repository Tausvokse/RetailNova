import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Очищаем DOM после каждого теста, чтобы компоненты не накладывались друг на друга
afterEach(() => {
  cleanup();
});