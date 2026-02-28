// Seeded random number generator using date string
export const seededRandom = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getIndicator = (guessVal, targetVal) => {
  if (guessVal === targetVal) return { match: true };
  if (guessVal < targetVal) return { match: false, arrow: '↑' };
  return { match: false, arrow: '↓' };
};

export const getYear = (dateStr) => {
  if (!dateStr) return 0;
  return new Date(dateStr).getFullYear();
};

export const hasMatchingWord = (guessName, targetName) => {
  const guessWords = guessName.toLowerCase().split(/\s+/);
  const targetWords = targetName.toLowerCase().split(/\s+/);
  return guessWords.some(word => targetWords.includes(word));
};
