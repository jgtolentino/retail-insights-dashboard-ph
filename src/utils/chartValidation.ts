export const validateChartData = (data: any[], requiredFields: string[]) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { isValid: false, error: 'No data available' };
  }

  const hasRequiredFields = data.every(item =>
    requiredFields.every(field => item && typeof item === 'object' && field in item)
  );

  if (!hasRequiredFields) {
    return {
      isValid: false,
      error: `Missing required fields: ${requiredFields.join(', ')}`,
    };
  }

  return { isValid: true };
};

export const sanitizeNumericData = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const formatSafeData = (data: any[]) => {
  return data.map(item => ({
    ...item,
    value: sanitizeNumericData(item.value || item.amount || item.total_amount || 0),
    count: sanitizeNumericData(item.count || item.transactions || 0),
    label: String(item.label || item.name || item.id || 'Unknown'),
  }));
};
