/**
 * Utility function to handle redirects to the pricing page
 * @param message - Optional message to show before redirecting
 * @param delay - Delay in milliseconds before redirect (default: 2000)
 */
export const redirectToPricing = (message?: string, delay: number = 2000) => {
  if (message) {
    // You can integrate this with your alert system if needed
    console.log(message);
  }
  
  setTimeout(() => {
    window.location.href = '/priceing';
  }, delay);
};

/**
 * Check if an API response indicates a redirect to pricing is needed
 * @param response - The API response object
 * @returns true if redirect is needed, false otherwise
 */
export const shouldRedirectToPricing = (response: unknown): boolean => {
  if (!response || typeof response !== 'object' || response === null) {
    return false;
  }
  
  const obj = response as Record<string, unknown>;
  return 'redirectToPricing' in obj && 
         typeof obj.redirectToPricing === 'boolean' &&
         obj.redirectToPricing === true;
}; 