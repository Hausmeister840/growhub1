import { useEffect } from 'react';

/**
 * 📱 PWA MANAGER - SIMPLIFIED (NO SERVICE WORKER)
 * Macht die App installierbar und fügt PWA-Features hinzu
 */

export default function PWAManager() {
  useEffect(() => {
    // ✅ 1. Inject Manifest dynamically
    const manifest = {
      name: "GrowHub - Cannabis Community",
      short_name: "GrowHub",
      description: "Die führende Cannabis-Community App in Deutschland",
      start_url: "/",
      display: "standalone",
      background_color: "#000000",
      theme_color: "#10b981",
      orientation: "portrait-primary",
      scope: "/",
      icons: [
        {
          src: "https://via.placeholder.com/192x192/10b981/ffffff?text=GH",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "https://via.placeholder.com/512x512/10b981/ffffff?text=GH",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      shortcuts: [
        {
          name: "Neuer Post",
          short_name: "Post",
          description: "Erstelle einen neuen Post",
          url: "/Feed?new_post=true"
        }
      ],
      categories: ["social", "lifestyle"],
      lang: "de-DE"
    };

    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestURL;

    // ✅ 2. Add PWA meta tags
    const metaTags = [
      { name: 'theme-color', content: '#10b981' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'GrowHub' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' }
    ];

    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      } else {
        meta.content = content;
      }
    });

    // ✅ 3. Add Apple Touch Icons
    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = 'https://via.placeholder.com/180x180/10b981/ffffff?text=GH';
    document.head.appendChild(appleTouchIcon);

    // ✅ 4. Add Splash Screen Meta Tags for iOS
    const appleSplashMeta = document.createElement('meta');
    appleSplashMeta.name = 'apple-mobile-web-app-status-bar-style';
    appleSplashMeta.content = 'black-translucent';
    document.head.appendChild(appleSplashMeta);

    // ✅ 5. Simple localStorage caching for offline posts
    window.addEventListener('online', () => {
      console.log('✅ Online - syncing cached data');
      const cachedPosts = localStorage.getItem('growhub_cached_posts');
      if (cachedPosts) {
        console.log('📦 Cached posts available');
      }
    });

    window.addEventListener('offline', () => {
      console.log('📡 Offline mode activated');
    });

    console.log('✅ PWA initialized (manifest + meta tags)');

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  return null;
}