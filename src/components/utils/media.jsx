/**
 * 🎬 MEDIA UTILITIES - BEREINIGT (Single Source)
 */

export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const videoExtensions = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;
  const videoHosts = /(youtube|vimeo|youtu\.be|twitch)/i;
  return videoExtensions.test(url) || videoHosts.test(url) || url.includes('/video/');
}

export function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

export function getMediaType(url) {
  if (isVideoUrl(url)) return 'video';
  if (isImageUrl(url)) return 'image';
  return 'unknown';
}

export function getVideoThumbnail(videoUrl) {
  if (!videoUrl) return null;
  
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  }
  
  return `${videoUrl}#t=0.5`;
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getOptimizedImageUrl(url, width = 800) {
  if (!url) return null;
  
  // Falls du einen Image CDN hast (z.B. Cloudinary)
  // return `${url}?w=${width}&q=80&auto=format`;
  
  return url;
}

export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
}

export function preloadVideo(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => resolve(url);
    video.onerror = reject;
    
    video.src = url;
  });
}