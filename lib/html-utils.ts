/**
 * Decode HTML entities in a string
 * Handles cases where HTML entities are double-encoded
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) return '';
  
  // Create a temporary element to decode HTML entities
  if (typeof window !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  }
  
  // Server-side fallback - decode common entities
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Sanitize and prepare HTML content for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // First decode any HTML entities
  let decoded = decodeHtmlEntities(html);
  
  // If it still contains encoded entities, decode again
  if (decoded.includes('&amp;') || decoded.includes('&lt;') || decoded.includes('&gt;')) {
    decoded = decodeHtmlEntities(decoded);
  }
  
  return decoded;
}
