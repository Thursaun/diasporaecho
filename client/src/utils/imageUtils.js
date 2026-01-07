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
  // Original: https://upload.wikimedia.org/wikipedia/commons/a/ab/Filename.ext
  // Thumb: https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Filename.ext/300px-Filename.ext

  try {
    // Decode URL to handle encoded characters correctly in regex
    const decodedUrl = decodeURIComponent(url);

    // CASE 1: It's an existing thumbnail -> Resize it
    if (url.includes('/thumb/')) {
      // Regex to match the size part at the end (e.g., /300px-Filename.ext)
      // We replace "300px" with our desired size
      return url.replace(/\/(\d+)px-/, `/${size}px-`);
    }

    // CASE 2: It's an original image -> Create thumbnail URL
    if (url.includes('upload.wikimedia.org') && url.includes('/wikipedia/')) {
      // Extract the path parts: .../wikipedia/commons/a/ab/Filename.ext
      const parts = url.split('/wikipedia/');
      if (parts.length < 2) return url;

      const suffix = parts[1]; // e.g., "commons/a/ab/Filename.ext"
      const pathParts = suffix.split('/');

      // We need to inject "thumb/" after "wikipedia/" and append "/SIZEpx-FILENAME" at the end
      // Structure: /wikipedia/<lang>/thumb/<shard>/<shard>/<filename>/<size>px-<filename>

      const filename = pathParts[pathParts.length - 1];
      const newPath = `wikipedia/${pathParts[0]}/thumb/${pathParts.slice(1).join('/')}/${size}px-${filename}`;

      return `${parts[0]}/${newPath}`;
    }
  } catch (e) {
    console.warn('Error optimizing image URL:', e);
    return url;
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
