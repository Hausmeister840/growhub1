import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 🎨 CN UTILITY - SINGLE SOURCE
 */

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;