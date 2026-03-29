import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function FeedRebuildDocs() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">React Native Feed – Blueprint (Expo + Firebase)</h1>
          <Link to={createPageUrl("Feed")} className="text-sm text-zinc-300 hover:text-white underline">
            Zurück zum Feed
          </Link>
        </div>

        <p className="mt-2 text-zinc-300">
          Hinweis: Diese Web-App kann kein Expo/React-Native ausführen. Diese Seite liefert eine vollständige Blaupause zur Umsetzung in einem separaten RN-Repo – inklusive Alt-Daten-Adapter (Zero‑Downtime).
        </p>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Technik-Stack</h2>
          <ul className="list-disc pl-6 text-zinc-300 space-y-1">
            <li>React Native (Expo SDK 51+), TypeScript strict</li>
            <li>Navigation: @react-navigation (BottomTabs + Stack)</li>
            <li>UI: Dark wie X.com + Apple-Glass (expo-blur), 60 FPS</li>
            <li>Backend: Firebase (Auth, Firestore, Storage, Functions)</li>
            <li>Medien: expo-av empfohlen (stabil, in Expo enthalten)</li>
            <li>Qualität: ESLint, Prettier, Jest, Detox (Smoke)</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Ordnerstruktur (RN-Repo)</h2>
          <pre className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 overflow-auto text-sm">
{`src/
  screens/Feed/
    FeedScreen.tsx
    FeedItem.tsx
    CommentsSheet.tsx
    ProductStrip.tsx
  services/
    posts.ts
    comments.ts
    likes.ts
    favorites.ts
    media.ts
    insight.ts
    cache.ts
    migration.ts
  adapters/
    legacyPostAdapter.ts
    legacyCommentAdapter.ts
  repositories/
    postRepository.ts
    commentRepository.ts
  hooks/
    useFeed.ts
    useVisibleItem.ts
    useComments.ts
    useConsent.ts
  theme/
    colors.ts
    glass.ts
    spacing.ts
    typography.ts
  components/
    GlassCard.tsx
    GlassView.tsx
    GlassButton.tsx
    GlassInput.tsx
    TopBar.tsx
    Toast.tsx
    Empty.tsx
    ErrorView.tsx
    Avatar.tsx
    Badge.tsx
  utils/
    time.ts
    format.ts
    error.ts
    featureFlags.ts
    indexes.md
  tests/
    unit/**
    e2e/**
  types/
    models.ts
    dto.ts`}
          </pre>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">DTOs (vereinfacht)</h2>
          <pre className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 overflow-auto text-sm">
{`// types/dto.ts
export type PostDTO = {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  aspectRatio?: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  favCount: number;
  tags: string[];
  productRef?: string;
  aiInsight?: { text: string; updatedAt: number };
};

export type CommentDTO = {
  id: string;
  authorId: string;
  text: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  parentId?: string;
  likeCount: number;
};`}
          </pre>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Adapter (Legacy → Neu)</h2>
          <pre className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 overflow-auto text-sm">
{`// adapters/legacyPostAdapter.ts
export function adaptLegacyPost(doc: any): PostDTO {
  const d = doc || {};
  const created = d.createdAt || d.created || Date.now();
  const createdAt = typeof created === "number"
    ? (global as any).firebase.firestore.Timestamp.fromMillis(created)
    : created;
  const mediaUrl: string = d.mediaUrl || d.imageUrl || d.videoUrl || "";
  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(mediaUrl) || /video/i.test(mediaUrl);
  return {
    id: d.id || d.postId || "",
    authorId: d.author || d.ownerId || d.userId || "",
    authorName: d.authorName || "",
    authorPhotoURL: d.authorPhotoURL || "",
    createdAt,
    text: d.caption || d.text || "",
    imageUrl: isVideo ? "" : mediaUrl,
    videoUrl: isVideo ? mediaUrl : "",
    aspectRatio: d.aspectRatio || undefined,
    likeCount: Array.isArray(d.likes) ? d.likes.length : d.likeCount || 0,
    commentCount: d.commentsCount || d.commentCount || 0,
    shareCount: d.shareCount || 0,
    favCount: d.favCount || 0,
    tags: d.tags || [],
    productRef: d.productRef || undefined,
    aiInsight: d.aiInsight || undefined,
  };
}`}
          </pre>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Repository (Zero‑Downtime)</h2>
          <pre className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 overflow-auto text-sm">
{`// repositories/postRepository.ts
import { listPostsNew } from "../services/posts";
import { listPostsLegacy } from "../services/migration";
import { adaptLegacyPost } from "../adapters/legacyPostAdapter";

export async function list({ limit, cursor }: { limit: number; cursor?: any }) {
  try {
    const res = await listPostsNew({ limit, cursor });
    if (res.items.length) return res;
    const legacy = await listPostsLegacy({ limit, cursor });
    return { items: legacy.items.map(adaptLegacyPost), nextCursor: legacy.nextCursor };
  } catch {
    const legacy = await listPostsLegacy({ limit, cursor });
    return { items: legacy.items.map(adaptLegacyPost), nextCursor: legacy.nextCursor };
  }
}`}
          </pre>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Leistungs- und UX-Kernpunkte</h2>
          <ul className="list-disc pl-6 text-zinc-300 space-y-1">
            <li>Vollbild-FlatList mit pagingEnabled, snapToInterval=ScreenHeight</li>
            <li>Nur ein aktives Video (Visibility-Observer), Autoplay/Stop</li>
            <li>Optimistische Likes/Kommentare/Favs, Rollback bei Fehler</li>
            <li>Offline-Cache: letzte Seite sofort anzeigen (AsyncStorage)</li>
            <li>KI-Insights on tap, Timeout 8s + Retry (2x), Ergebnis cachen</li>
            <li>Commerce-Hook: Produktleiste bei productRef</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Tests</h2>
          <ul className="list-disc pl-6 text-zinc-300 space-y-1">
            <li>Adapter-Mapping, Repository-Fallback, Single-Active-Video</li>
            <li>Insight-Timeout/Retry, Cache-Last-Page</li>
            <li>e2e Smoke: Start, Feed sichtbar, Swipe, CommentsSheet, kein Crash</li>
          </ul>
        </section>

        <section className="mt-8">
          <p className="text-zinc-400 text-sm">
            Brauchst du zusätzlich eine exportierbare Markdown-Version? Sag Bescheid, dann rendere ich diese Seite optional als Download.
          </p>
        </section>
      </div>
    </div>
  );
}