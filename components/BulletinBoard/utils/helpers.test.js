import { getRandomPosition } from './helpers.js';
import { CARD_DIMENSIONS } from './constants.js';

describe('getRandomPosition', () => {
  test('returned x and y are within bounds for board size', () => {
    const boardW = 800;
    const boardH = 600;
    const iterations = 20;
    const cardW = CARD_DIMENSIONS.width;
    const cardH = CARD_DIMENSIONS.height;

    const minX = 10;
    const maxX = boardW - cardW - 80;
    const minY = 0;
    const maxY = boardH - cardH - 100;
    const safeMaxX = Math.max(minX + 10, maxX);
    const safeMaxY = Math.max(minY + 10, maxY);

    for (let i = 0; i < iterations; i++) {
      const { x, y } = getRandomPosition(boardW, boardH);
      expect(x).toBeGreaterThanOrEqual(minX);
      expect(x).toBeLessThanOrEqual(safeMaxX);
      expect(y).toBeGreaterThanOrEqual(minY);
      expect(y).toBeLessThanOrEqual(safeMaxY);
    }
  });

  test('respects custom card dimensions', () => {
    const boardW = 500;
    const boardH = 400;
    const cardW = 100;
    const cardH = 50;
    const iterations = 20;

    const minX = 10;
    const maxX = boardW - cardW - 80;
    const minY = 0;
    const maxY = boardH - cardH - 100;
    const safeMaxX = Math.max(minX + 10, maxX);
    const safeMaxY = Math.max(minY + 10, maxY);

    for (let i = 0; i < iterations; i++) {
      const { x, y } = getRandomPosition(boardW, boardH, cardW, cardH);
      expect(x).toBeGreaterThanOrEqual(minX);
      expect(x).toBeLessThanOrEqual(safeMaxX);
      expect(y).toBeGreaterThanOrEqual(minY);
      expect(y).toBeLessThanOrEqual(safeMaxY);
    }
  });
});
