/**
 * pages.config.js - Page routing configuration
 *
 * This file keeps the editable landing page config but avoids eagerly
 * importing every route into the initial bundle.
 */
import React from 'react';
const __Layout = React.lazy(() => import('./Layout.jsx'));

const pageModules = import.meta.glob('./pages/*.jsx');
const pageModuleEntries = Object.entries(pageModules);

const createLazyPage = (loader) => React.lazy(async () => {
  const mod = await loader();
  return { default: mod.default || (() => null) };
});

export const PAGES = Object.fromEntries(
  pageModuleEntries
    .map(([path, loader]) => {
      const match = path.match(/\.\/pages\/(.+)\.jsx$/);
      return match ? [match[1], createLazyPage(loader)] : null;
    })
    .filter(Boolean)
    .sort(([left], [right]) => left.localeCompare(right))
);

export const preloadPage = (name) => {
  const loader = pageModules[`./pages/${name}.jsx`];
  if (loader) {
    return loader();
  }
  return Promise.resolve();
};

export const preloadLayout = () => import('./Layout.jsx');

export const preloadMainPages = (pageNames = []) => {
  pageNames.forEach((name) => {
    preloadPage(name);
  });
};

export const preloadAllPagesInBackground = async (excludePageNames = []) => {
  const skip = new Set(excludePageNames);
  const idle = typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 1200 })
    : (cb) => window.setTimeout(cb, 0);

  for (const [path, loader] of pageModuleEntries) {
    const match = path.match(/\.\/pages\/(.+)\.jsx$/);
    const pageName = match?.[1];
    if (!pageName || skip.has(pageName)) {
      continue;
    }

    await new Promise((resolve) => {
      idle(async () => {
        try {
          await loader();
        } finally {
          resolve();
        }
      });
    });
  }
};

export const pagesConfig = {
  mainPage: "Feed",
  Pages: PAGES,
  Layout: __Layout,
};
