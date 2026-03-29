/**
 * 🔄 RETRY WITH EXPONENTIAL BACKOFF
 * Automatically retries failed operations with increasing delays
 */

export async function retryWithBackoff(
  operation,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.name === 'AbortError') {
        throw error;
      }

      // Don't retry on 4xx errors (except 429)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }

      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        console.error(`❌ [Retry] All ${maxRetries} attempts failed`);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      console.log(`🔄 [Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${Math.round(totalDelay)}ms...`);

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error) {
  return (
    !navigator.onLine ||
    error.message?.includes('Network Error') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('network') ||
    error.code === 'ECONNABORTED'
  );
}

/**
 * Check if error is rate limit
 */
export function isRateLimitError(error) {
  return (
    error.response?.status === 429 ||
    error.message?.includes('429') ||
    error.message?.includes('rate limit')
  );
}