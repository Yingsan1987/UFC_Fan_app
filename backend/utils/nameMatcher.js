const DEFAULT_THRESHOLD = 0.90; // Lowered from 0.95 to 0.90 (90%) to catch more matches with special characters

const toStringSafe = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Validate if an image URL is valid (not a placeholder)
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const urlLower = url.toLowerCase().trim();
  
  // Reject placeholder/relative paths
  if (urlLower.includes('no-profile-image')) return false;
  if (urlLower.includes('placeholder')) return false;
  if (urlLower.includes('no-image')) return false;
  if (urlLower.startsWith('/themes/')) return false;
  if (urlLower.startsWith('/assets/')) return false;
  if (urlLower.length < 10) return false; // Too short to be a valid URL
  
  // Must be a full URL (starts with http:// or https://) or at least contain a domain
  if (urlLower.startsWith('http://') || urlLower.startsWith('https://')) {
    // Additional check: make sure it's not a placeholder URL
    if (urlLower.includes('.png') && urlLower.split('/').length < 4) return false;
    return true;
  }
  
  // If it's not a full URL, reject it (relative paths are not valid for img src)
  return false;
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
    
    // Validate image URL - skip if it's a placeholder or invalid
    if (!isValidImageUrl(value)) return;

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

    // Try exact match first
    if (exactMap.has(target)) {
      return exactMap.get(target);
    }

    // Try fuzzy match
    let bestValue = null;
    let bestScore = 0;
    let bestMatch = null;

    for (const entry of entries) {
      const score = similarityScore(target, entry.normalized);
      if (score > bestScore) {
        bestScore = score;
        bestValue = entry.value;
        bestMatch = entry.normalized;
      }
    }

    // Log if close match found but below threshold
    if (bestScore > 0 && bestScore < threshold && bestScore >= threshold - 0.1) {
      console.log(`⚠️ Close match for "${inputName}" (normalized: "${target}"): "${bestMatch}" (score: ${(bestScore * 100).toFixed(1)}%, threshold: ${(threshold * 100).toFixed(1)}%)`);
    }

    return bestScore >= threshold ? bestValue : null;
  };
};

module.exports = {
  DEFAULT_THRESHOLD,
  normalizeName,
  similarityScore,
  createFuzzyFinder,
  isValidImageUrl,
};

