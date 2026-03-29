
export default function MobileMigration() {
  return (
    <div className="max-w-5xl mx-auto p-6 text-zinc-200">
      <h1 className="text-2xl font-bold mb-4">GrowHub Mobile Migration (React Native + Expo + Firebase)</h1>
      <p className="mb-4">Diese Anleitung liefert eine produktionsreife Basis für eine Expo Router + Firebase App mit TypeScript, Clean Architecture, Offline, Tests und CI/CD. Sie ist kompatibel mit iOS und Android.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1) Ordnerstruktur (Clean Architecture)</h2>
      <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-xs">
{`apps/mobile/
├─ app/                         # Expo Router screens (UI layer)
│  ├─ (tabs)/
│  │  ├─ feed.tsx
│  │  ├─ marketplace.tsx
│  │  ├─ map.tsx
│  │  ├─ profile.tsx
│  │  └─ messages.tsx
│  ├─ post/[id].tsx
│  ├─ group/[id].tsx
│  ├─ _layout.tsx
│  └─ index.tsx
├─ src/
│  ├─ application/              # Use cases (business logic)
│  │  ├─ feed/
│  │  │  ├─ getFeed.ts
│  │  │  ├─ createPost.ts
│  │  │  └─ reactToPost.ts
│  │  ├─ comments/
│  │  ├─ marketplace/
│  │  ├─ maps/
│  │  ├─ profile/
│  │  └─ messaging/
│  ├─ domain/                   # Entities + Interfaces
│  │  ├─ post.ts
│  │  ├─ user.ts
│  │  ├─ comment.ts
│  │  ├─ product.ts
│  │  ├─ event.ts
│  │  └─ group.ts
│  ├─ infrastructure/           # Firebase adapters, APIs
│  │  ├─ firebase/
│  │  │  ├─ app.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ firestore.ts
│  │  │  ├─ storage.ts
│  │  │  └─ messaging.ts
│  │  ├─ repositories/
│  │  │  ├─ postRepository.ts
│  │  │  ├─ commentRepository.ts
│  │  │  ├─ userRepository.ts
│  │  │  └─ productRepository.ts
│  │  └─ services/
│  │     ├─ ai.ts
│  │     └─ media.ts
│  ├─ presentation/             # UI helpers
│  │  ├─ components/
│  │  ├─ theme/
│  │  ├─ i18n/
│  │  └─ state/
│  └─ utils/
├─ tests/                       # Unit + Detox E2E
│  ├─ unit/
│  └─ e2e/
├─ app.json
├─ eas.json
├─ package.json
├─ tsconfig.json
└─ README.md
`}
      </pre>

      <h2 className="text-xl font-semibold mt-6 mb-2">2) Expo + Firebase Setup (TypeScript)</h2>
      <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-xs">
{`// src/infrastructure/firebase/app.ts
import { initializeApp, getApps } from 'firebase/app';

export const firebaseApp = getApps()[0] ?? initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});`}
      </pre>

      <h2 className="text-xl font-semibold mt-6 mb-2">3) Firestore Security Rules (Least Privilege)</h2>
      <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-xs">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isOwner(email) { return isSignedIn() && request.auth.token.email == email; }

    match /users/{uid} {
      allow read: if true;
      allow update: if request.auth.uid == uid;
      allow create: if isSignedIn();
    }

    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.created_by);
    }

    match /comments/{commentId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.author_email);
    }

    match /products/{productId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.seller_email);
    }
  }
}`}
      </pre>

      <h2 className="text-xl font-semibold mt-6 mb-2">4) Infinite Feed (Expo Router Screen)</h2>
      <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-xs">
{`// app/(tabs)/feed.tsx
import React from 'react';
import { View, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFeed } from '@/src/presentation/state/useFeed';
import { PostCard } from '@/src/presentation/components/PostCard';

export default function FeedScreen() {
  const { posts, loadMore, isFetching, refresh } = useFeed();

  return (
    <FlashList
      data={posts}
      renderItem={({ item }) => <PostCard post={item} />}
      keyExtractor={(item) => item.id}
      estimatedItemSize={420}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
    />
  );
}`}
      </pre>

      <h2 className="text-xl font-semibold mt-6 mb-2">5) Offline Caching</h2>
      <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-xs">
{`// src/infrastructure/firebase/firestore.ts
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseApp } from './app';

export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});`}
      </pre>

      <h2 className="text-xl font-semibold mt-6 mb-2">6) EAS, Detox, Analytics</h2>
      <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-xs">
{`// eas.json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": "version" }
  },
  "submit": {
    "production": {}
  }
}

// tests/e2e/example.e2e.ts (Detox)
describe('Feed', () => {
  it('loads and scrolls', async () => {
    await expect(element(by.id('feed-list'))).toBeVisible();
    await element(by.id('feed-list')).scroll(300, 'down');
  });
});`}
      </pre>

      <h2 className="text-xl font-semibold mt-6 mb-2">7) UI/Theme</h2>
      <ul className="list-disc pl-6 text-zinc-300">
        <li>Dark Mode (X.com) + iOS Glas-Effekt via BlurView</li>
        <li>NativeWind (Tailwind für RN) für schnelle Styles</li>
        <li>Barrierefreiheit: alle Buttons mit accessibilityLabel, role, hitSlop</li>
      </ul>

      <p className="mt-6 text-zinc-400 text-sm">
        Hinweis: Diese Seite ist eine Migrationsanleitung. Die tatsächliche Expo-App wird außerhalb dieser Web-App erstellt (Repo: apps/mobile). Gerne liefere ich bei Bedarf ein Starter-Repo.
      </p>
    </div>
  );
}