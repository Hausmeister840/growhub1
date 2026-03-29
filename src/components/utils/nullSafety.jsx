// Null Safety Utilities

export const safe = (fn, fallback = null) => {
  try {
    return fn() ?? fallback;
  } catch {
    return fallback;
  }
};

export const safeGet = (obj, path, fallback = null) => {
  if (!obj) return fallback;
  
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null) return fallback;
    result = result[key];
  }
  
  return result ?? fallback;
};

export const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  return [];
};

export const safeString = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (value != null) return String(value);
  return fallback;
};

export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

export const safeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  return fallback;
};

export const safeObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
};

export const hasValue = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const firstValid = (...values) => {
  return values.find(v => hasValue(v)) ?? values[values.length - 1];
};