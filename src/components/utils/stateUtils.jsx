// Efficient state comparison utilities

export function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  
  if (!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

export function arrayShallowEqual(arr1, arr2) {
  if (arr1 === arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}

export function hasArrayChanged(prevArray, nextArray, compareKey = 'id') {
  if (!prevArray || !nextArray) return true;
  if (prevArray.length !== nextArray.length) return true;

  // Check if IDs or updated_date changed
  for (let i = 0; i < prevArray.length; i++) {
    if (prevArray[i][compareKey] !== nextArray[i][compareKey]) return true;
    if (prevArray[i].updated_date !== nextArray[i].updated_date) return true;
  }

  return false;
}

export function memoizeWithKey(fn, keyFn) {
  const cache = new Map();
  
  return (...args) => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Clear old entries if cache gets too large
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}