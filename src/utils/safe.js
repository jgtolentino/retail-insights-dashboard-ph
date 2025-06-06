export const safe = value => {
  if (!value) return '';
  if (typeof value === 'object') {
    if (value.label) return value.label;
    if (value.name) return value.name;
    if (value.value !== undefined) return String(value.value);
    if (value.title) return value.title;
    if (value.text) return value.text;
    return '';
  }
  return String(value);
};

export const safeOptions = items => {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') return { label: item, value: item };
    if (item && typeof item === 'object') {
      if (item.label && item.value !== undefined) return item;
      return {
        label: item.label || item.name || item.title || String(item.value || item),
        value: item.value !== undefined ? item.value : item.id || item.name || item,
      };
    }
    return { label: String(item), value: item };
  });
};
