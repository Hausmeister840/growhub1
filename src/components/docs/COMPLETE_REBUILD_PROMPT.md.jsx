# 🔧 COMPLETE REBUILD PROMPT - GrowHub App

> **Verwende diesen Prompt, um die komplette App neu aufzubauen mit allen Fixes**

---

## 📋 PROMPT FÜR BASE44 AI

```
Ich möchte die GrowHub App komplett überarbeiten und alle kritischen Fehler beheben.

Bitte führe folgende Schritte aus:

═══════════════════════════════════════════════════════
PHASE 1: CRITICAL FIXES (Priorität: SOFORT)
═══════════════════════════════════════════════════════

1. **PostVisibilityTracker Memory Leak fixen**
   - Datei: components/feed/PostVisibilityTracker.js
   - Problem: setTimeout cleanup funktioniert nicht
   - Fix: Timer in ref speichern und im cleanup cleanen
   - Code-Pattern:
     ```javascript
     const timerRef = useRef(null);
     useEffect(() => {
       // ... observer logic
       timerRef.current = setTimeout(() => { ... }, 1000);
       return () => {
         if (timerRef.current) clearTimeout(timerRef.current);
         observer.disconnect();
       };
     }, [post?.id, onView]);
     ```

2. **usePersonalizedFeed Infinite Loop fixen**
   - Datei: components/hooks/usePersonalizedFeed.js
   - Problem: loadFeed in dependency array verursacht loop
   - Fix: loadFeed mit useCallback memoizen oder aus deps entfernen
   - Code-Pattern:
     ```javascript
     const loadFeed = useCallback(async (reset = false) => {
       // ... existing logic
     }, []); // Keine dependencies!
     
     useEffect(() => {
       loadFeed(true);
     }, []); // Nur initial load
     ```

3. **RealtimeService Error Handling**
   - Datei: components/services/RealtimeService.js
   - Problem: Keine try/catch für async operations
   - Fix: Alle async methods in try/catch wrappen
   - Zeilen: 51-62, 99-110, 147-161
   - Code-Pattern:
     ```javascript
     async broadcastMessage(conversationId, message) {
       if (!isRealtimeEnabled()) return;
       try {
         const supabase = getSupabaseClient();
         await supabase.channel(`messages:${conversationId}`).send({
           type: 'broadcast',
           event: 'new_message',
           payload: message
         });
       } catch (error) {
         console.error('Failed to broadcast message:', error);
       }
     }
     ```

4. **MessageInput Memory Leak (Object URLs)**
   - Datei: components/chat/MessageInput.js
   - Problem: URL.createObjectURL wird nicht revoked
   - Fix: useEffect cleanup für URL.revokeObjectURL
   - Zeilen: 47, 114
   - Code-Pattern:
     ```javascript
     useEffect(() => {
       return () => {
         if (mediaPreview?.url) {
           URL.revokeObjectURL(mediaPreview.url);
         }
       };
     }, [mediaPreview?.url]);
     ```

5. **AccountSettings - Backend-Funktion für Account Delete**
   - Datei: pages/AccountSettings.js
   - Problem: Keine Transaction, partial deletes möglich
   - Fix: Backend-Funktion mit Transaction erstellen
   - Neue Datei: functions/user/deleteAccount.js
   - Code:
     ```javascript
     import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
     
     Deno.serve(async (req) => {
       try {
         const base44 = createClientFromRequest(req);
         const user = await base44.auth.me();
         
         if (!user) {
           return Response.json({ error: 'Unauthorized' }, { status: 401 });
         }
         
         // Delete all user content in transaction
         const [posts, comments, diaries, products, messages] = await Promise.all([
           base44.asServiceRole.entities.Post.filter({ created_by: user.email }),
           base44.asServiceRole.entities.Comment.filter({ author_email: user.email }),
           base44.asServiceRole.entities.GrowDiary.filter({ created_by: user.email }),
           base44.asServiceRole.entities.Product.filter({ seller_email: user.email }),
           base44.asServiceRole.entities.Message.filter({ senderId: user.id })
         ]);
         
         // Delete all in parallel
         await Promise.all([
           ...posts.map(p => base44.asServiceRole.entities.Post.delete(p.id)),
           ...comments.map(c => base44.asServiceRole.entities.Comment.delete(c.id)),
           ...diaries.map(d => base44.asServiceRole.entities.GrowDiary.delete(d.id)),
           ...products.map(p => base44.asServiceRole.entities.Product.delete(p.id)),
           ...messages.map(m => base44.asServiceRole.entities.Message.delete(m.id))
         ]);
         
         // Delete user profile
         await base44.asServiceRole.entities.User.delete(user.id);
         
         return Response.json({ success: true });
       } catch (error) {
         console.error('Delete account error:', error);
         return Response.json({ error: error.message }, { status: 500 });
       }
     });
     ```

═══════════════════════════════════════════════════════
PHASE 2: HIGH PRIORITY FIXES
═══════════════════════════════════════════════════════

6. **SmartRecommendations - Backend-Funktion für Recommendations**
   - Datei: components/discovery/SmartRecommendations.js
   - Problem: N+1 Query, lädt alle User
   - Fix: Backend-Funktion erstellen
   - Neue Datei: functions/recommendations/getSmartRecommendations.js

7. **TrendingTopics - Backend-Aggregation**
   - Datei: components/feed/TrendingTopics.js
   - Problem: Client-side tag aggregation
   - Fix: Backend-Funktion mit Caching
   - Neue Datei: functions/feed/getTrendingTopics.js

8. **FeedInsights - Global State + Caching**
   - Datei: components/feed/FeedInsights.js
   - Problem: Redundante API calls
   - Fix: Zustand Store oder React Query mit staleTime
   - Code-Pattern:
     ```javascript
     const { data: insights, isLoading } = useQuery({
       queryKey: ['feedInsights', currentUser?.email],
       queryFn: () => loadInsights(),
       staleTime: 5 * 60 * 1000, // 5 Minuten Cache
       enabled: !!currentUser
     });
     ```

9. **ProfileHeader - Image Error Handling**
   - Datei: components/profile/ProfileHeader.js
   - Problem: Keine onError handler für images
   - Fix: Fallback-Images bei Fehler
   - Zeilen: 59-64, 86-90
   - Code-Pattern:
     ```javascript
     <img
       src={user.banner_url}
       alt="Banner"
       onError={(e) => {
         e.target.src = 'fallback-banner.jpg';
       }}
       className="w-full h-full object-cover"
     />
     ```

10. **Feed Page - Race Condition mit AbortController**
    - Datei: pages/Feed.js
    - Problem: Parallel requests verursachen state issues
    - Fix: AbortController + loading ref
    - Code-Pattern:
      ```javascript
      const abortControllerRef = useRef(null);
      const isLoadingRef = useRef(false);
      
      const loadPosts = useCallback(async () => {
        if (isLoadingRef.current) return;
        
        // Abort previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        isLoadingRef.current = true;
        setIsLoading(true);
        
        try {
          const posts = await fetch(url, {
            signal: abortControllerRef.current.signal
          });
          // ... handle success
        } catch (error) {
          if (error.name === 'AbortError') return;
          // ... handle error
        } finally {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }, []);
      ```

═══════════════════════════════════════════════════════
PHASE 3: ARCHITECTURE IMPROVEMENTS
═══════════════════════════════════════════════════════

11. **Zentraler API-Layer**
    - Neue Datei: components/services/ApiService.js
    - Zweck: Zentrale Stelle für alle API-Calls
    - Features: Error handling, retry logic, caching
    - Code-Pattern:
      ```javascript
      class ApiService {
        async get(entity, options = {}) {
          try {
            const data = await base44.entities[entity].list(
              options.sort,
              options.limit
            );
            return { data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
        
        async create(entity, data) {
          // ... mit retry logic
        }
        
        // ... weitere methods
      }
      
      export const api = new ApiService();
      ```

12. **Global State Management (Zustand)**
    - Package: npm install zustand
    - Neue Datei: components/stores/useAppStore.js
    - Stores:
      - User Store (current user, following, followers)
      - Feed Store (posts, filters, pagination)
      - UI Store (modals, toasts, loading states)
    - Code-Pattern:
      ```javascript
      import { create } from 'zustand';
      
      export const useUserStore = create((set) => ({
        currentUser: null,
        following: [],
        setCurrentUser: (user) => set({ currentUser: user }),
        addFollowing: (userId) => set((state) => ({
          following: [...state.following, userId]
        }))
      }));
      ```

13. **Request Deduplication**
    - Neue Datei: components/services/RequestCache.js
    - Zweck: Verhindert duplicate requests
    - Code-Pattern:
      ```javascript
      class RequestCache {
        cache = new Map();
        
        async fetch(key, fetcher, ttl = 60000) {
          const cached = this.cache.get(key);
          if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
          }
          
          // Check if request is in flight
          if (cached?.promise) {
            return cached.promise;
          }
          
          const promise = fetcher();
          this.cache.set(key, { promise, timestamp: Date.now() });
          
          try {
            const data = await promise;
            this.cache.set(key, { data, timestamp: Date.now() });
            return data;
          } catch (error) {
            this.cache.delete(key);
            throw error;
          }
        }
      }
      ```

14. **Error Boundaries hinzufügen**
    - Neue Datei: components/ui/ErrorBoundary.js
    - Verwenden in: Feed, Profile, Messages
    - Code:
      ```javascript
      export class ErrorBoundary extends React.Component {
        state = { hasError: false, error: null };
        
        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }
        
        render() {
          if (this.state.hasError) {
            return (
              <div className="error-fallback">
                <h2>Etwas ist schiefgelaufen</h2>
                <button onClick={() => window.location.reload()}>
                  Neu laden
                </button>
              </div>
            );
          }
          return this.props.children;
        }
      }
      ```

15. **Retry Logic für Failed Requests**
    - Neue Datei: components/utils/retry.js
    - Code:
      ```javascript
      export async function retry(fn, maxAttempts = 3, delay = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === maxAttempts - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          }
        }
      }
      ```

═══════════════════════════════════════════════════════
PHASE 4: SECURITY FIXES
═══════════════════════════════════════════════════════

16. **XSS Prevention in PostContent**
    - Datei: components/feed/PostContent.js
    - Problem: dangerouslySetInnerHTML ohne Sanitization
    - Fix: DOMPurify nutzen oder ReactMarkdown
    - Code:
      ```javascript
      import ReactMarkdown from 'react-markdown';
      
      export default function PostContent({ content }) {
        return (
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        );
      }
      ```

17. **Input Validation hinzufügen**
    - Neue Datei: components/utils/validation.js
    - Funktionen: validateEmail, sanitizeText, validateFile
    - Code:
      ```javascript
      export function sanitizeText(text) {
        return text
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
      
      export function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      }
      ```

18. **File Upload Validation**
    - In allen Upload-Komponenten
    - Check: File type, size, extension
    - Code:
      ```javascript
      function validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Ungültiger Dateityp');
        }
        
        if (file.size > maxSize) {
          throw new Error('Datei zu groß (max 10MB)');
        }
        
        return true;
      }
      ```

═══════════════════════════════════════════════════════
PHASE 5: PERFORMANCE OPTIMIZATIONS
═══════════════════════════════════════════════════════

19. **Bundle Size Optimization**
    - Lodash-ES statt Lodash verwenden
    - Icons lazy-loaden oder nur benötigte importieren
    - Framer-Motion code-splitten
    - Command:
      ```bash
      npm remove lodash
      npm install lodash-es
      ```

20. **Image Optimization**
    - Alle images über Next/Image-ähnlichen Optimizer
    - WebP Format nutzen
    - Lazy Loading für images
    - Code:
      ```javascript
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="..."
      />
      ```

21. **Code Splitting**
    - Route-based Code Splitting
    - Heavy Komponenten lazy loaden
    - Code:
      ```javascript
      const ProfileEditor = lazy(() => import('./ProfileEditor'));
      const CreatePost = lazy(() => import('./CreatePost'));
      
      <Suspense fallback={<Spinner />}>
        <ProfileEditor />
      </Suspense>
      ```

═══════════════════════════════════════════════════════
PHASE 6: TESTING & MONITORING
═══════════════════════════════════════════════════════

22. **Unit Tests einrichten**
    - Framework: Jest + React Testing Library
    - Coverage: 70%+ für kritische Komponenten
    - Test Files:
      - components/hooks/__tests__/usePost.test.js
      - components/utils/__tests__/validation.test.js
      - components/services/__tests__/ApiService.test.js

23. **E2E Tests mit Playwright**
    - Test Scenarios:
      - User Registration → Post Creation
      - Message Send → Receive
      - Profile Edit → Save
      - Feed Scroll → Infinite Load

24. **Error Monitoring (Sentry)**
    - Integration: Sentry SDK
    - Track: JS errors, API errors, Performance
    - Code:
      ```javascript
      import * as Sentry from '@sentry/react';
      
      Sentry.init({
        dsn: 'YOUR_SENTRY_DSN',
        tracesSampleRate: 0.1
      });
      ```

═══════════════════════════════════════════════════════
ABSCHLUSS-CHECKLISTE
═══════════════════════════════════════════════════════

Führe nach allen Fixes folgende Checks durch:

✅ **Functionality**
- [ ] Alle Features funktionieren wie erwartet
- [ ] Keine console errors
- [ ] Keine broken images/links

✅ **Performance**
- [ ] Lighthouse Score >90
- [ ] Bundle Size <600KB
- [ ] No Memory Leaks (Chrome DevTools)
- [ ] Fast load time (<2s)

✅ **Security**
- [ ] Kein XSS möglich
- [ ] Input validation überall
- [ ] API-Keys sicher
- [ ] File uploads validiert

✅ **Code Quality**
- [ ] ESLint passing
- [ ] Prettier formatted
- [ ] No circular dependencies
- [ ] Error handling überall

✅ **Testing**
- [ ] Unit Tests passing
- [ ] E2E Tests passing
- [ ] Test Coverage >70%

═══════════════════════════════════════════════════════
FINALE ANWEISUNGEN
═══════════════════════════════════════════════════════

Bitte führe ALLE oben genannten Fixes durch in der angegebenen Reihenfolge.

Erstelle für jede Phase einen separaten Commit mit aussagekräftiger Message:
- Phase 1: "fix: critical memory leaks and error handling"
- Phase 2: "perf: optimize API calls and data fetching"
- Phase 3: "refactor: add API layer and global state"
- Phase 4: "security: XSS prevention and input validation"
- Phase 5: "perf: bundle optimization and code splitting"
- Phase 6: "test: add unit and e2e tests"

Nach jedem Fix teste die Funktionalität um sicherzustellen, dass nichts kaputt geht.

Starte mit Phase 1 (Critical Fixes) und arbeite dich durch bis Phase 6.

Gib mir nach jeder abgeschlossenen Phase ein Update mit:
- ✅ Was wurde gefixt
- 📊 Vorher/Nachher Metriken
- 🐛 Eventuell neue Bugs gefunden
- ⏭️ Nächste Schritte

LOS GEHT'S! 🚀
```

---

## 📝 USAGE NOTES

**Wie man diesen Prompt verwendet:**

1. **Kopiere den gesamten Prompt** (zwischen den ```-Blöcken)
2. **Füge ihn in ein neues Chat-Fenster** mit Base44 AI ein
3. **Warte auf Bestätigung** nach jeder Phase
4. **Teste die Änderungen** im Live-Preview
5. **Gib Feedback** wenn etwas nicht funktioniert

**Erwartete Dauer:**
- Phase 1: 2-3 Stunden
- Phase 2: 2-3 Stunden
- Phase 3: 3-4 Stunden
- Phase 4: 1-2 Stunden
- Phase 5: 2-3 Stunden
- Phase 6: 3-4 Stunden

**Total: ~15-20 Stunden** (über 3-4 Tage verteilt)

---

## 🎯 ERWARTETE ERGEBNISSE

Nach Completion aller Phasen:

**Performance:**
- ✅ Lighthouse Score: 90+
- ✅ Bundle Size: <600KB
- ✅ Load Time: <2s
- ✅ No Memory Leaks

**Stability:**
- ✅ No Race Conditions
- ✅ Proper Error Handling
- ✅ No Infinite Loops
- ✅ Clean Unmounts

**Security:**
- ✅ XSS Prevention
- ✅ Input Validation
- ✅ Secure File Uploads
- ✅ API Security

**Quality:**
- ✅ Test Coverage: 70%+
- ✅ ESLint: 0 errors
- ✅ TypeScript ready
- ✅ Production ready

---

*Prompt erstellt von Base44 AI Assistant*  
*Version: 1.0*  
*Letzte Aktualisierung: 2026-01-13*