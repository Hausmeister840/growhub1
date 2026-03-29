import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

/**
 * Debounced Input Component
 * Reduces unnecessary re-renders and API calls
 */
export default function DebouncedInput({ 
  value: initialValue = '',
  onChange,
  delay = 300,
  ...props 
}) {
  const [value, setValue] = useState(initialValue);

  // Sync with external value changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Debounced callback
  const debouncedOnChange = useMemo(
    () => debounce((val) => {
      onChange?.(val);
    }, delay),
    [onChange, delay]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
}