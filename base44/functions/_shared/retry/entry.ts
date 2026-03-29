export async function withRetry(
  operation, 
  options = {}
) {
  const {
    maxAttempts = 3,
    baseDelay = 200,
    maxDelay = 5000,
    backoffFactor = 2,
    retryCondition = (error) => error.status >= 500 || error.code === 'network_error'
  } = options;

  let lastError;
  let delay = baseDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if condition not met or last attempt
      if (!retryCondition(error) || attempt === maxAttempts) {
        break;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with jitter
      delay = Math.min(
        delay * backoffFactor + Math.random() * 100,
        maxDelay
      );
    }
  }

  // Add retry information to error
  throw {
    ...lastError,
    retryAttempts: maxAttempts,
    originalError: lastError
  };
}

export function createRetryableOperation(operation, defaultOptions = {}) {
  return (options = {}) => withRetry(operation, { ...defaultOptions, ...options });
}