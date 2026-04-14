import { seededRandom, getTodayString, getYesterdayString, getIndicator, getYear, hasMatchingWord, calculateScore } from './utils';

describe('seededRandom', () => {
  test('returns the same value for the same seed', () => {
    expect(seededRandom('2025-01-15')).toBe(seededRandom('2025-01-15'));
  });

  test('returns different values for different seeds', () => {
    expect(seededRandom('2025-01-15')).not.toBe(seededRandom('2025-01-16'));
  });

  test('returns a non-negative integer', () => {
    const result = seededRandom('test-seed');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  test('handles empty string', () => {
    const result = seededRandom('');
    expect(result).toBe(0);
  });
});

describe('getTodayString', () => {
  test('returns a string in YYYY-MM-DD format', () => {
    const result = getTodayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('matches the current date', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(getTodayString()).toBe(expected);
  });
});

describe('getYesterdayString', () => {
  test('returns a string in YYYY-MM-DD format', () => {
    const result = getYesterdayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('is exactly one day before today', () => {
    const today = new Date(getTodayString());
    const yesterday = new Date(getYesterdayString());
    const diffMs = today.getTime() - yesterday.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(1);
  });
});

describe('getIndicator', () => {
  test('returns match: true when values are equal', () => {
    expect(getIndicator(100, 100)).toEqual({ match: true });
  });

  test('returns up arrow when guess is lower than target', () => {
    expect(getIndicator(50, 100)).toEqual({ match: false, arrow: '↑' });
  });

  test('returns down arrow when guess is higher than target', () => {
    expect(getIndicator(200, 100)).toEqual({ match: false, arrow: '↓' });
  });

  test('handles zero values', () => {
    expect(getIndicator(0, 0)).toEqual({ match: true });
    expect(getIndicator(0, 1)).toEqual({ match: false, arrow: '↑' });
  });

  test('handles null values', () => {
    // null < number is true in JS, null == null is true
    expect(getIndicator(null, null)).toEqual({ match: true });
    expect(getIndicator(null, 100)).toEqual({ match: false, arrow: '↑' });
  });
});

describe('getYear', () => {
  test('extracts year from a date string', () => {
    expect(getYear('2023-01-15')).toBe(2023);
  });

  test('returns 0 for null input', () => {
    expect(getYear(null)).toBe(0);
  });

  test('returns 0 for undefined input', () => {
    expect(getYear(undefined)).toBe(0);
  });

  test('returns 0 for empty string', () => {
    expect(getYear('')).toBe(0);
  });

  test('handles various date formats', () => {
    expect(getYear('2007-02-26T00:00:00.000Z')).toBe(2007);
    expect(getYear('January 1, 2020')).toBe(2020);
  });
});

describe('hasMatchingWord', () => {
  test('returns true when names share a word', () => {
    expect(hasMatchingWord('Rune scimitar', 'Rune platebody')).toBe(true);
  });

  test('returns false when names share no words', () => {
    expect(hasMatchingWord('Abyssal whip', 'Dragon scimitar')).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(hasMatchingWord('rune SCIMITAR', 'Rune platebody')).toBe(true);
  });

  test('handles single-word names', () => {
    expect(hasMatchingWord('Coins', 'Coins')).toBe(true);
    expect(hasMatchingWord('Coins', 'Bones')).toBe(false);
  });

  test('does not match partial words', () => {
    // "run" should not match "rune"
    expect(hasMatchingWord('Run', 'Rune platebody')).toBe(false);
  });
});

describe('calculateScore', () => {
  test('returns 1000 for 1 guess', () => {
    expect(calculateScore(1)).toBe(1000);
  });

  test('returns 500 for 2 guesses', () => {
    expect(calculateScore(2)).toBe(500);
  });

  test('returns 250 for 3 guesses', () => {
    expect(calculateScore(3)).toBe(250);
  });

  test('returns 125 for 4 guesses', () => {
    expect(calculateScore(4)).toBe(125);
  });

  test('floors at 50 for 6+ guesses', () => {
    expect(calculateScore(6)).toBe(50);
    expect(calculateScore(10)).toBe(50);
    expect(calculateScore(100)).toBe(50);
  });

  test('score decreases as guesses increase', () => {
    expect(calculateScore(1)).toBeGreaterThan(calculateScore(2));
    expect(calculateScore(2)).toBeGreaterThan(calculateScore(3));
    expect(calculateScore(3)).toBeGreaterThan(calculateScore(4));
  });
});
