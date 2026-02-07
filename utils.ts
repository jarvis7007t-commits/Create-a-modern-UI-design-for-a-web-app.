
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Global flag to help synchronize multiple parallel requests hitting rate limits
let globalRateLimitActive = false;

/**
 * Retries a function with exponential backoff and jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, delay: number) => void,
  maxRetries: number = 7, // Increased max retries
  initialDelay: number = 5000 // Increased initial delay
): Promise<T> {
  let retries = 0;
  while (true) {
    // If another request is currently waiting out a rate limit, wait a bit before even trying
    if (globalRateLimitActive && retries === 0) {
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    }

    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      const errorMessage = (error?.message || "").toLowerCase();
      const errorStatus = error?.status || 0;
      
      const isQuotaError = 
        errorMessage.includes('429') || 
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('limit') ||
        errorMessage.includes('exhausted') ||
        errorStatus === 429;

      const isRetryable = isQuotaError || 
        errorMessage.includes('500') || 
        errorMessage.includes('503') ||
        errorStatus >= 500;

      if (!isRetryable || retries >= maxRetries) {
        throw error;
      }
      
      if (isQuotaError) {
        globalRateLimitActive = true;
      }

      // More aggressive exponential backoff: 5s, 15s, 45s, 135s...
      const delay = (initialDelay * Math.pow(3, retries)) + (Math.random() * 3000);
      
      if (onRetry) onRetry(retries + 1, delay);
      console.warn(`Gemini API Quota/Error (retry ${retries + 1}/${maxRetries}). Waiting ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
      
      // After waiting, we can try clearing the global flag for this specific attempt
      if (retries > 1) globalRateLimitActive = false;
    }
  }
}
