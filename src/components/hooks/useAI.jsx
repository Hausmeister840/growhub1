import { useState, useCallback } from 'react';

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const invoke = useCallback(async ({ agent, payload, schema_ref, file_urls }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/functions/ai/invokeAgent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent,
          payload,
          schema_ref,
          file_urls
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI request failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const moderatePost = useCallback(async (postId) => {
    try {
      const response = await fetch('/functions/moderation/moderatePost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Moderation failed');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    invoke,
    moderatePost,
    isLoading,
    error
  };
}