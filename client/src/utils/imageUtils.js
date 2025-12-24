/**
 * Image Optimization Utilities
 * Shared functions for optimizing Wikipedia image URLs
 */

/**
 * Optimize Wikipedia image URL to request smaller thumbnails
 * Reduces image size from ~500KB to ~20-50KB
 * @param {string} url - Original Wikipedia image URL
 * @param {number} size - Desired width in pixels
 * @returns {string} - Optimized URL or original if not Wikipedia
 */
export const getOptimizedImageUrl = (url, size = 300) => {
  if (!url) return '';
  
  // Skip placeholder images
  if (url.includes('placeholder')) return url;
  
  // Wikipedia image URLs follow this pattern:
  // https://upload.wikimedia.org/wikipedia/commons/a/ab/Filename.ext
  // Can be converted to thumbnail:
  // https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Filename.ext/300px-Filename.ext
  if (url.includes('upload.wikimedia.org') && !url.includes('/thumb/')) {
    const match = url.match(/(.*\/wikipedia\/(?:commons|en)\/)([\\w\\d]\/[\\w\\d]{2}\/([^/]+))$/);
    if (match) {
      const [, baseUrl, pathWithFilename, filename] = match;
      return `${baseUrl}thumb/${pathWithFilename}/${size}px-${filename}`;
    }
  }
  
  return url;
};

/**
 * Preload an image with optional priority
 * @param {string} url - Image URL to preload
 * @param {boolean} highPriority - Whether to use high fetch priority
 */
export const preloadImage = (url, highPriority = false) => {
  if (!url) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  if (highPriority) {
    link.fetchPriority = 'high';
  }
  document.head.appendChild(link);
};
