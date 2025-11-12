const DEFAULT_THRESHOLD = 0.95;

const toStringSafe = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const normalizeName = (value) => {
  const str = toStringSafe(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return str;
};

const levenshteinDistance = (a, b) => {
  if (a === b) return 0;

  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  let prevRow = new Array(lenB + 1);
  let currRow = new Array(lenB + 1);

  for (let j = 0; j <= lenB; j += 1) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= lenA; i += 1) {
    currRow[0] = i;
    const charA = a.charCodeAt(i - 1);

    for (let j = 1; j <= lenB; j += 1) {
      const charB = b.charCodeAt(j - 1);
      const cost = charA === charB ? 0 : 1;

      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }

    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[lenB];
};

const similarityScore = (a, b) => {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0 && lenB === 0) return 1;
  if (lenA === 0 || lenB === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(lenA, lenB);

  return (maxLen - distance) / maxLen;
};

const createFuzzyFinder = (records, options = {}) => {
  const threshold = typeof options.threshold === 'number' ? options.threshold : DEFAULT_THRESHOLD;

  const entries = [];
  const exactMap = new Map();

  records.forEach((record) => {
    const name = record?.name;
    const value = record?.value ?? record?.image_url ?? record?.url;

    if (!name || !value) return;

    const normalized = normalizeName(name);
    if (!normalized) return;

    entries.push({ normalized, value });
    if (!exactMap.has(normalized)) {
      exactMap.set(normalized, value);
    }
  });

  return (inputName) => {
    if (!inputName) return null;

    const target = normalizeName(inputName);
    if (!target) return null;

    if (exactMap.has(target)) {
      return exactMap.get(target);
    }

    let bestValue = null;
    let bestScore = 0;

    for (const entry of entries) {
      const score = similarityScore(target, entry.normalized);
      if (score > bestScore) {
        bestScore = score;
        bestValue = entry.value;
      }
    }

    return bestScore >= threshold ? bestValue : null;
  };
};

module.exports = {
  DEFAULT_THRESHOLD,
  normalizeName,
  similarityScore,
  createFuzzyFinder,
};

