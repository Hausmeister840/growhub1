# 🌿 GrowHub — Super Deep Blueprint
## Vollständige Systemanalyse · Stand: 14. März 2026

---

## 1. ARCHITEKTUR-ÜBERSICHT

### Tech-Stack
- **Frontend**: React 18 + Vite, TailwindCSS, Framer Motion, shadcn/ui
- **Backend**: Base44 BaaS (Entities, Functions, Integrations)
- **State**: Custom Hooks (useFeedStore, useUserStore, useUIStore)
- **Routing**: React Router v6 (App.jsx + pagesConfig Hybrid)
- **Realtime**: Base44 Entity Subscriptions
- **Maps**: React-Leaflet + OpenStreetMap + OSRM Routing
- **AI**: Base44 InvokeLLM (gemini_3_pro, gemini_3_flash)
- **Media**: Base44 UploadFile + Object URLs

### Design-System
- Dark-First (schwarz/grün Cannabis-Ästhetik)
- CSS Custom Properties in `globals.css` (--gh-*)
- Glass-Morphism (backdrop-blur, semi-transparent surfaces)
- Mobile-First, iOS Safe-Area Support
- Scroll-Direction-Aware Nav (auto-hide)

---

## 2. ENTITY-DATENMODELL (18+ Entities)

### Kern-Entities

| Entity | Zweck | RLS |
|--------|-------|-----|
| **Post** | Feed-Beiträge (Text, Media, Polls, Grow-Updates) | Read: alle · Write: Ersteller |
| **Comment** | Kommentare zu Posts | Read: alle · Write: Autor |
| **GrowDiary** | Anbautagebücher (Phasen, Plan, AI-Insights) | Read: eigene + öffentliche · Write: Ersteller |
| **GrowDiaryEntry** | Tägliche Einträge (Fotos, Messwerte, AI-Analyse) | Read: eigene + sichtbare · Write: Ersteller |
| **Strain** | Cannabis-Sorten-Datenbank (THC, Effekte, Anbau) | Read: alle · Write: Admin |
| **User** | Nutzerprofile (built-in + custom fields) | Speziell: Admin-only für fremde Daten |
| **Follow** | Follower-Beziehungen mit Gewichtung | Read: Beteiligte · Write: Follower |
| **Conversation** | DMs & Gruppenchats | Read: Teilnehmer · Write: Teilnehmer |
| **Message** | Chat-Nachrichten (Text, Media, Voice, GIF) | Read: alle · Write: Sender |
| **Notification** | Push-/In-App-Benachrichtigungen | Read: Empfänger · Write: alle |
| **PlantScan** | KI-Pflanzenanalysen (Fotos, Scores, Diagnose) | Read/Write: Ersteller |

### Sekundäre Entities

| Entity | Zweck |
|--------|-------|
| **CommunitySpot** | Nutzer-gemeldete Orte auf der Karte |
| **CommunitySpace** | Thematische Community-Räume |
| **Product** | Marketplace-Artikel |
| **Event** | Community-Events & Meetups |
| **Challenge** | Gamification-Challenges (Daily/Weekly) |
| **Referral** | Einladungs-/Referral-System |
| **KnowledgeArticle** | Wiki-Artikel |
| **Group** | Nutzergruppen |
| **Story** | 24h-Stories |
| **SupportTicket** | Helpdesk-Tickets |
| **Club** | Cannabis Social Clubs (Karten-Marker) |
| **NoGoZone** | Schutzzonen (Schulen, Kitas, etc.) |
| **Report** | Content-Meldungen |
| **Streak** | Login-Streaks |

---

## 3. SEITEN & ROUTING

### Haupt-Navigation (Mobile Bottom Nav)
```
/ → Feed (Startseite)
/Feed → Social Feed mit Tabs (Alle, Trending, Folge ich)
/Map → Interaktive Cannabis-Karte
/Reels → TikTok-artiger Fullscreen-Video-Feed
/Profile → Eigenes Profil (oder ?id=xxx für andere)
```

### Grow-Bereich
```
/GrowDiaries → Übersicht aller eigenen Grows
/GrowDiaryDetail?id=xxx → Detail mit 6 Tabs (Plan, Woche, Timeline, Tracking, KI, Phasen)
/CreateGrowDiary → Neues Tagebuch anlegen
/PlantScan → KI-Pflanzenscanner (Kamera + Analyse)
```

### Social & Community
```
/Messages → Chat-System (DMs + Gruppen)
/PostThread?id=xxx → Einzelner Post mit Kommentaren
/Notifications → Benachrichtigungszentrale
/Search → Globale Suche
/Community → Community-Spaces
/Groups → Gruppen-Übersicht
/GroupDetail?id=xxx → Gruppendetail
```

### Wissen & Inhalte
```
/Strains → Sorten-Datenbank
/StrainDetail?id=xxx → Sortendetail
/Knowledge → Wiki-Artikel
/ArticleDetail?id=xxx → Artikelansicht
/CreateArticle → Artikel erstellen
```

### Marketplace & Events
```
/Marketplace → Produkt-Marktplatz
/ProductDetail?id=xxx → Produktdetail
/CreateProduct → Produkt einstellen
/Events → Community-Events
/CreateEvent → Event erstellen
```

### Profil & Einstellungen
```
/Onboarding → Ersteinrichtung (Username, Avatar, Interessen)
/Settings → App-Einstellungen
/AccountSettings → Kontoverwaltung
/NotificationSettings → Benachrichtigungs-Einstellungen
/Saved → Gespeicherte Posts
/Liked → Gelikte Posts
```

### Admin-Bereich
```
/AdminDashboard → Admin-Übersicht
/ModerationQueue → Content-Moderation
/AdminZoneManager → Schutzzonen verwalten
/AdminUserCheck → Nutzerverwaltung
/AuditDashboard → System-Audit
/FeedDiagnostics → Feed-Diagnostik
/SystemCheck → Systemstatus
```

---

## 4. BACKEND-FUNKTIONEN

### Feed-System (5 Funktionen)
| Funktion | Beschreibung |
|----------|-------------|
| `feed/getSmartFeed` | **Haupt-Feed-API**: Scoring-Algorithmus (Engagement × Decay × Velocity × Diversity × Media-Bonus), Parallel-Fetch (Posts + Users + Follows), Tab-Filtering (all/trending/following) |
| `feed/getReelsFeed` | Reels-Feed: Posts mit Media, sortiert nach Datum |
| `feed/getOptimizedFeed` | Alternativer optimierter Feed |
| `feed/getPersonalizedFeedV2` | Personalisierter Feed v2 |
| `feed/getTrendingFeed` | Trending-Content |

### Posts & Interaktionen (4 Funktionen)
| Funktion | Beschreibung |
|----------|-------------|
| `posts/toggleReaction` | Atomarer Reaction-Toggle (like, fire, laugh, mind_blown, helpful, celebrate) |
| `posts/toggleBookmark` | Bookmark An/Aus |
| `comments/createComment` | Kommentar erstellen + comments_count inkrementieren |
| `createPost` | Post-Erstellung |

### Profil-System (5 Funktionen)
| Funktion | Beschreibung |
|----------|-------------|
| `profile/getProfile` | Profil-Daten laden (inkl. Stats) |
| `profile/updateProfile` | Profil aktualisieren |
| `profile/toggleFollow` | Follow/Unfollow |
| `profile/resolveUsers` | User-Auflösung für IDs |
| `toggleFollow` | Legacy Follow-Toggle |

### Grow & AI (4 Funktionen)
| Funktion | Beschreibung |
|----------|-------------|
| `grow/analyzeEntry` | KI-Analyse von Grow-Einträgen |
| `grow/analyzeImage` | Bildbasierte Pflanzenanalyse |
| `grow/exportPDF` | PDF-Export eines Tagebuchs |
| `grow/sendReminders` | Automatische Grow-Erinnerungen |

### Suche & Moderation
| Funktion | Beschreibung |
|----------|-------------|
| `search/globalSearch` | Globale Suche über alle Entities |
| `moderation/autoModeratePost` | KI-Inhaltsmoderation |
| `moderation/evaluateContent` | Content-Bewertung |

### Admin & Analytics
| Funktion | Beschreibung |
|----------|-------------|
| `admin/getAnalyticsDashboard` | Admin-Dashboard-Daten |
| `analytics/trackEvent` | Event-Tracking |
| `analytics/trackUserActivity` | Nutzer-Aktivitäten |
| `maintenance/updatePostScores` | Score-Neuberechnung |

---

## 5. KERN-FEATURES IM DETAIL

### 5.1 Feed-System
```
Architektur:
├── pages/Feed.jsx (Haupt-UI, Tabs, Infinite Scroll)
├── components/feed/useFeedStore.js (State-Manager)
│   ├── loadPosts() → Backend getSmartFeed
│   ├── optimisticCreate/Delete/Edit/Like/Bookmark
│   ├── Real-time Subscription (Post entity)
│   └── reactionInFlightRef (Race-Condition-Schutz)
├── components/feed/FuturisticPostCard.jsx (Post-Darstellung)
│   ├── Reactions (6 Typen mit Long-Press Picker)
│   ├── Double-Tap Like
│   ├── Context-Menu (Long-Press)
│   ├── Inline Video (lazy)
│   ├── Fullscreen Media Viewer (lazy)
│   └── Expanded Post Sheet (lazy)
├── components/utils/dataUtils.js
│   ├── flattenPost() — Normalisierung der Post-Daten
│   └── createUserMap() — User-Map aus verschiedenen Quellen
└── components/utils/terminology.js
    ├── getDisplayName() — Robuste Name-Auflösung
    └── buildFallbackUser() — Fallback für unbekannte User
```

**Scoring-Algorithmus (getSmartFeed):**
```
score = (rawEngagement × 0.4 + velocity × 3 + decay × 30 + followBonus) × diversity × mediaBonus
- rawEngagement = reactions × 1.5 + comments × 3 + bookmarks × 2
- velocity = rawEngagement / ageHours
- decay = e^(-0.693 × ageHours / 24)  [Halbwertszeit 24h]
- diversity = 1 + min(reactionTypes, 4) × 0.08
- mediaBonus = Video 1.3, Bild 1.15, Text 1.0
- followBonus = 20 Punkte wenn gefolgt

Tab-spezifisch:
- trending: velocity × 8 + rawEngagement × 0.3 (max 7 Tage)
- following: nur gefolgte, decay × 100 + rawEngagement × 0.5
- all: gemischter Score (oben)
```

### 5.2 Grow-Tagebuch-System
```
Architektur:
├── pages/GrowDiaries.jsx (Übersicht + Quick Stats)
├── pages/GrowDiaryDetail.jsx (Detail mit 6 Tabs)
│   ├── Tab: Anbauplan (GrowPlanDashboard)
│   ├── Tab: Woche (WeeklyOverview)
│   ├── Tab: Timeline (DiaryTimeline)
│   ├── Tab: Tracking (GrowCharts + PlantTrackingDashboard)
│   ├── Tab: KI (SmartGrowAssistant)
│   └── Tab: Phasen (GrowPhasesOverview)
├── components/grow/GrowEntryModal.jsx (Eintrag erstellen/bearbeiten)
│   ├── Foto-Upload + KI-Analyse
│   ├── Quick Actions (watered, fertilized, topped, etc.)
│   ├── Umgebungsdaten (Temp, Humidity, pH, EC)
│   └── Sichtbarkeit (privat/profil/feed)
├── components/grow/GrowPlanConfig.js (Standard-Pläne pro Phase)
└── components/grow/DiaryHeader.jsx (Stats, Health-Score, VPD)

Phasen: Keimung → Sämling → Wachstum → Blüte → Spülung → Ernte
```

### 5.3 PlantScan (KI-Pflanzenscanner)
```
Architektur:
├── pages/PlantScan.jsx (4 Phasen: capture → env → analyzing → result)
├── components/plantScan/ScanCamera.jsx (WebRTC Kamera + Galerie-Fallback)
├── components/plantScan/ScanAnalyzer.jsx (Upload + LLM-Analyse)
│   ├── Model: gemini_3_pro (schnell + Vision-fähig)
│   ├── 4 Scan-Modi: Gesundheit, Schädlinge, Nährstoffe, Identifikation
│   ├── Umgebungsdaten-Korrelation
│   └── Speicherung in PlantScan Entity
├── components/plantScan/ScanResultDisplay.jsx (Ergebnis-Dashboard)
│   ├── Health Score (0-100 mit Gauge)
│   ├── Visual Markers
│   ├── Risk Factors
│   ├── Action Plan
│   └── Predicted Outcomes
├── components/plantScan/ScanHistoryTimeline.jsx (Verlauf)
│   └── Swipe-to-Delete / Swipe-to-View
└── components/plantScan/EnvironmentInputPanel.jsx (Umgebungsdaten)
```

### 5.4 Chat-System
```
Architektur:
├── pages/Messages.jsx (Dual-Pane Layout)
│   ├── Sidebar: ConversationList + Suche + Filter
│   └── Main: ChatView oder Empty State
├── components/chat/ChatView.jsx (Haupt-Chat-Ansicht)
│   ├── Real-time Message Subscription
│   ├── Optimistic Message Send
│   ├── Media Upload
│   └── Reaction Toggle
├── components/chat/ConversationList.jsx → ConversationItem.jsx
├── components/chat/MessageBubble.jsx (Nachrichtenblase)
├── components/chat/MessageInput.jsx (Eingabe + Media)
├── components/chat/NewChatModal.jsx (Neuer Chat)
└── components/chat/ChatHeader.jsx (Chat-Header mit Info)

Features:
- Direkt-Nachrichten & Gruppenchats
- Unread-Count pro Conversation/User
- Pin, Mute, Archive
- Reply-to, Reactions, Forward
- Voice Messages, GIFs, Sticker
- Read Receipts
```

### 5.5 Interaktive Karte
```
Architektur:
├── pages/Map.jsx (1323 Zeilen — sollte refactored werden)
│   ├── MapContainer (Leaflet + CartoDB Dark Tiles)
│   ├── LocationCard (Detail-Drawer)
│   ├── LocationList (Listenansicht)
│   ├── FilterPanel (Layer-Steuerung)
│   └── ZoneStatusBanner (Schutzonen-Warnung)
├── components/map/NearbyRadar.jsx (Nahbereichs-Radar)
├── components/map/QuickAccessBar.jsx (Schnellzugriff)
├── components/map/AddCommunitySpot.jsx (Spot melden)
├── components/map/SpotRatingModal.jsx (Spot bewerten)
├── components/map/HeatmapLayer.jsx (Heatmap-Overlay)
├── components/map/VisitedTracker.jsx (Besucht-Tracker)
└── components/map/CommunitySpotCard.jsx (Community-Spot Detail)

Layer-System:
├── Cannabis: Social Clubs, Dispensaries, Grow Shops, Head Shops, Ärzte, Apotheken
└── Schutzzonen: Schulen, Kitas, Spielplätze, Jugendzentren, Sportstätten

Features:
- GPS-Tracking mit Accuracy Circle
- OSRM Walking Route
- Zone-Status-Check (in Schutzzone?)
- Community Spots (melden, bewerten, upvoten)
- Heatmap Overlay
- Nearby Radar
- Favoriten & Besucht-Tracker
```

### 5.6 Reels
```
Architektur:
├── pages/Reels.jsx (Fullscreen Snap-Scroll)
│   ├── Windowed Rendering (±2 um aktuellen Index)
│   ├── IntersectionObserver für aktiven Reel
│   ├── Double-Tap Like
│   └── View Count Tracking
├── components/reels/ReelItem.jsx (Video/Bild-Darstellung)
├── components/reels/ReelOverlay.jsx (UI-Overlay: Author, Actions)
└── components/reels/ReelsCommentsModal.jsx (Kommentare)
```

### 5.7 Profil
```
Architektur:
├── pages/Profile.jsx
│   ├── ProfileHeader (Avatar, Stats, Follow-Button)
│   ├── ProfileAbout (Bio, Interessen)
│   ├── 3 Tabs: Beiträge, Grows, Erfolge
│   ├── ProfilePostsGrid (Post-Grid)
│   ├── ProfileGrowDiaries (Diary-Cards)
│   └── EnhancedGamificationPanel (XP, Level, Achievements)
├── InlineProfileEditor (Profil bearbeiten)
├── FollowerListModal (Follower/Following)
└── BlockMuteManager (Blockieren/Stummschalten)
```

---

## 6. LAYOUT & NAVIGATION

### Layout-Wrapper (layout.js)
```
Providers: ToastProvider → GlobalErrorBoundary → AppErrorBoundary → UserStoreProvider → UIStoreProvider → ContextMenuProvider

Struktur:
├── DesktopNav (linke Sidebar, 260px, ab lg:)
├── MobileHeader (oben, 52px, auto-hide beim Scrollen)
├── <main> (Content-Bereich)
├── MobileBottomNav (unten, auto-hide beim Scrollen)
└── Lazy-loaded Overlays:
    ├── MobileMenu
    ├── CreatePost
    ├── CookieBanner
    ├── PWAInstallPrompt
    ├── UpdateNotification
    ├── PushNotificationManager
    └── OfflineIndicator

Scroll-Persistenz: Feed, Map, Messages behalten Scroll-Position
No-Nav-Seiten: PostThread, Reels, PlantScan, Onboarding
Full-Width-Seiten: Map, Messages, Reels, PlantScan
```

---

## 7. BEKANNTE PROBLEME & TECHNISCHE SCHULDEN

### Kritisch
1. **Map.jsx zu groß** — 1323 Zeilen, enthält 5 inline-Komponenten (LocationCard, LocationList, FilterPanel, ZoneStatusBanner, MapController). Sollte in Einzeldateien aufgeteilt werden.
2. **Doppelte Feed-Funktionen** — 5 verschiedene Feed-Endpunkte (getSmartFeed, getOptimizedFeed, getPersonalizedFeedV2, getTrendingFeed, getCardFeed). Nur getSmartFeed wird tatsächlich genutzt.
3. **Strains-Seite nutzt `createPageUrl`** — Legacy-Import, sollte durch `navigate('/StrainDetail?id=...')` ersetzt werden.

### Mittel
4. **User-Daten-Inkonsistenz** — `user.data.username` vs `user.username` — verschiedene Stellen lesen User-Felder unterschiedlich aus. Die `createUserMap()` in dataUtils und die Backend-UserMap in getSmartFeed haben nun denselben Ansatz, aber es gibt noch andere Stellen.
5. **Übermäßig viele Service/Hook-Dateien** — 50+ Hook-Dateien, 40+ Service-Dateien, viele ungenutzt (z.B. `useQuantumCache`, `useHolographicFeed`, `useDecentralizedIdentity`). Dead Code bereinigen.
6. **Feed Realtime Subscription** — Kann bei neuen Posts User-Daten fehlen (Fallback auf "Unbekannter Nutzer"). Wurde gemildert durch `buildFallbackUser` mit Email-Prefix.
7. **Reels Like** — Direkte `Post.update({ reactions })` statt Backend-Funktion `toggleReaction`. Kann bei Concurrent Writes zu Datenverlust führen.

### Niedrig
8. **Übermäßige Doc-Dateien** — 15+ Blueprint/Audit-Markdown-Dateien im components/docs Ordner. Keine Funktionalität.
9. **PWA-Funktionalität** — PWAInstallPrompt, UpdateNotification, ServiceWorker-Manager existieren als Komponenten, aber Service Worker ist nicht tatsächlich registriert.
10. **Admin-Seiten** — 7 Admin-Seiten existieren, aber viele sind Platzhalter oder unvollständig.

---

## 8. PERFORMANCE-ARCHITEKTUR

### Optimierungen ✅
- **Lazy Loading**: Heavy Components (InlineFeedVideo, DoubleTapLike, FullscreenMediaViewer, ExpandedPostSheet) werden lazy geladen
- **Windowed Rendering**: Reels rendern nur ±2 Items um den aktuellen Index
- **Optimistic Updates**: Feed-Interaktionen (Like, Bookmark, Delete) sind sofort sichtbar
- **Scroll Direction Hook**: Nav-Elemente verschwinden beim Runterscrollen
- **Intersection Observer**: Infinite Scroll & Reel-Tracking
- **Debounced Search**: Feed-Suche mit deferred Query
- **Parallel Fetch**: Backend lädt Posts + Users + Follows gleichzeitig
- **User Cache**: Feed-Store cached User-Daten über Reloads hinweg
- **Reaction In-Flight Guard**: Verhindert, dass Realtime-Updates laufende Reactions überschreiben

### Verbesserungspotential
- Keine Virtualisierung im Feed (alle Posts im DOM)
- Map lädt bis zu 500 Clubs + 500 Zones auf einmal
- Conversation-Liste pollt alle 60s statt nur Subscription
- Keine Image-Optimierung (kein srcset, keine Thumbnails)

---

## 9. SICHERHEIT

### RLS (Row-Level Security) ✅
- Posts: Jeder kann lesen, nur Ersteller löschen
- GrowDiary: Nur eigene + öffentliche lesbar
- PlantScan: Nur eigene Scans sichtbar
- Notifications: Nur eigene lesbar
- Follow: Nur beteiligte Parteien
- Messages: Nur Sender kann bearbeiten/löschen

### Auth-Schutz
- Layout prüft Auth-Status für nicht-öffentliche Seiten
- Admin-Seiten prüfen `user.role === 'admin'`
- Backend-Funktionen validieren `base44.auth.me()`
- Onboarding-Redirect für neue User ohne Username

### Schwachstellen
- Reels `Post.update()` direkt vom Client (kein Backend-Validation)
- CommunitySpot Upvotes direkt vom Client manipulierbar
- Keine Rate-Limiting auf Frontend-Seite für Reactions

---

## 10. DATEI-STATISTIKEN

### Größte Dateien (Refactoring-Kandidaten)
| Datei | ~Zeilen | Empfehlung |
|-------|---------|------------|
| pages/Map.jsx | 1323 | Aufteilen in 5+ Komponenten |
| pages/Feed.jsx | 399 | OK, gut strukturiert |
| pages/GrowDiaryDetail.jsx | 363 | OK |
| pages/Reels.jsx | 295 | OK |
| pages/Profile.jsx | 313 | OK |
| pages/Strains.jsx | 333 | OK |
| pages/PlantScan.jsx | 201 | OK, gut modularisiert |

### Komponenten-Verteilung
| Ordner | Anzahl |
|--------|--------|
| components/feed/ | ~50 Dateien (viele ungenutzt) |
| components/grow/ | ~20 Dateien |
| components/chat/ | ~15 Dateien |
| components/ui/ | ~60 Dateien (shadcn + custom) |
| components/hooks/ | ~40 Dateien (viele ungenutzt) |
| components/services/ | ~40 Dateien (viele ungenutzt) |
| components/map/ | ~10 Dateien |
| components/reels/ | ~8 Dateien |
| components/profile/ | ~12 Dateien |
| components/docs/ | ~15 Dateien (nur Dokumentation) |
| functions/ | ~60 Dateien |
| pages/ | ~40 Dateien |
| entities/ | ~30 Dateien |

---

## 11. EMPFOHLENE NÄCHSTE SCHRITTE

### Priorität 1 — Stabilität
1. ☐ Map.jsx in Einzelkomponenten aufteilen
2. ☐ Reels-Reactions über Backend-Funktion statt direktes `Post.update()`
3. ☐ Dead Code bereinigen (ungenutzte Hooks, Services, Feed-Funktionen)
4. ☐ Strains-Seite: `createPageUrl` durch `navigate()` ersetzen

### Priorität 2 — Performance
5. ☐ Feed-Virtualisierung (nur sichtbare Posts im DOM)
6. ☐ Image-Thumbnails / Responsive Images
7. ☐ Map-Daten lazy laden (nur sichtbarer Bereich)

### Priorität 3 — Features
8. ☐ Push Notifications tatsächlich aktivieren
9. ☐ Marketplace vervollständigen (Kaufabwicklung)
10. ☐ Challenge-System mit automatischer Vergabe

---

*Generiert am 14. März 2026 · GrowHub Super Deep Blueprint v1.0*