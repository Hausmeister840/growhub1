import { useRef, useEffect } from 'react';

/**
 * Stable Value Hook
 * Returns a stable reference that only updates when value actually changes
 */
export function useStableValue(value) {
  const ref = useRef(value);
  const isEqual = shallowEqual(ref.current, value);

  useEffect(() => {
    if (!isEqual) {
      ref.current = value;
    }
  }, [value, isEqual]);

  return isEqual ? ref.current : value;
}

function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  if (obj1 === null || obj2 === null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => obj1[key] === obj2[key]);
}