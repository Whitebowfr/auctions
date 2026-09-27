// bundleUtils.js

// Image support removed — bundles no longer include images in lightweight backend

/**
 * Process bulk import text for bundles and convert to bundle objects
 * @param {string} bulkText - CSV-style text input with bundle data
 * @returns {Array} - Array of bundle objects
 */
export const processBulkBundleImport = (bulkText: string) => {
  const lines = bulkText.split('\n').filter(line => line.trim());

  return lines.map((line) => {
    const [name, description, startingPrice, category, notes] = line.split(';').map(item => item?.trim() || '');

    return {
      name: name || `Lot sans nom`,
      description: description || '',
      startingPrice: parseFloat(startingPrice) || 0,
      category: category || '',
      notes: notes || ''
    };
  });
};

export const bundleWithSuffixSorter = (a: number | string, b: number | string) => {
  const parse = (val: string | number) => {
    if (val === null || val === undefined) return { base: 0, suffix: 0 };
    const str = String(val).trim();
    const match = str.match(/^(\d+)([a-zA-Z]*)$/);
    if (!match) return { base: 0, suffix: 0 };
    const base = parseInt(match[1], 10);
    const sufMap = { 'bis': 1, 'ter': 2, 'quater': 3 };
    const sufKey = (match[2] || '').toLowerCase();
    return { base, suffix: sufMap[sufKey] || 0 };
  };
  const aParsed = parse(a);
  const bParsed = parse(b);
  if (aParsed.base !== bParsed.base) return aParsed.base - bParsed.base;
  return aParsed.suffix - bParsed.suffix;
};
