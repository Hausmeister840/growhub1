# 🔥 Firestore Indizes für GrowHub

**WICHTIG:** Diese Indizes müssen manuell in Firebase Console erstellt werden!

## 📋 Benötigte Indizes

### 1. Post Collection

#### Index 1: Visibility + Created Date
```
Collection: Post
Fields:
  - visibility (Ascending)
  - created_date (Descending)
```

#### Index 2: Type + Created Date
```
Collection: Post
Fields:
  - type (Ascending)
  - created_date (Descending)
```

#### Index 3: Created By + Created Date
```
Collection: Post
Fields:
  - created_by (Ascending)
  - created_date (Descending)
```

#### Index 4: Language + Created Date
```
Collection: Post
Fields:
  - lang (Ascending)
  - created_date (Descending)
```

---

### 2. ContentAggregate Collection

#### Index 5: Growth 1h (Descending)
```
Collection: ContentAggregate
Fields:
  - growth_1h (Descending)
```

#### Index 6: Views 1h (Descending)
```
Collection: ContentAggregate
Fields:
  - views_1h (Descending)
```

#### Index 7: Quality Score (Descending)
```
Collection: ContentAggregate
Fields:
  - quality_score (Descending)
```

---

### 3. Follow Collection

#### Index 8: Follower + Last Interaction
```
Collection: Follow
Fields:
  - follower_id (Ascending)
  - last_interaction_at (Descending)
```

---

### 4. UserActivity Collection

#### Index 9: User Email + Created Date
```
Collection: UserActivity
Fields:
  - user_email (Ascending)
  - created_date (Descending)
```

---

## 🚀 Wie erstelle ich diese Indizes?

### Option A: Firebase Console (manuell)
1. Gehe zu https://console.firebase.google.com
2. Wähle dein Projekt
3. Navigiere zu **Firestore Database** → **Indexes**
4. Klicke auf **Create Index**
5. Erstelle jeden Index wie oben beschrieben

### Option B: Firebase CLI (automatisch)
1. Erstelle eine `firestore.indexes.json` Datei im Projekt-Root:

```json
{
  "indexes": [
    {
      "collectionGroup": "Post",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "visibility", "order": "ASCENDING"},
        {"fieldPath": "created_date", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "Post",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "type", "order": "ASCENDING"},
        {"fieldPath": "created_date", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "Post",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "created_by", "order": "ASCENDING"},
        {"fieldPath": "created_date", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "Post",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "lang", "order": "ASCENDING"},
        {"fieldPath": "created_date", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "ContentAggregate",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "growth_1h", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "ContentAggregate",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "views_1h", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "ContentAggregate",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "quality_score", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "Follow",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "follower_id", "order": "ASCENDING"},
        {"fieldPath": "last_interaction_at", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "UserActivity",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "user_email", "order": "ASCENDING"},
        {"fieldPath": "created_date", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

2. Deploye die Indizes:
```bash
firebase deploy --only firestore:indexes
```

---

## ⚠️ WICHTIG

- **Indizes brauchen Zeit:** Nach dem Erstellen dauert es 5-15 Minuten, bis sie aktiv sind
- **Kosten:** Indizes verbrauchen Storage, sind aber für Performance essentiell
- **Queries scheitern ohne Indizes:** Firestore gibt dir einen Link zum Erstellen, wenn ein Index fehlt

---

## 📊 Performance-Impact

Mit diesen Indizes:
- ✅ Feed lädt 10x schneller
- ✅ "Für dich" Tab funktioniert mit großen Datenmengen
- ✅ "Viral" Tab zeigt echte Trending-Posts
- ✅ Queries skalieren auf Millionen Posts

Ohne Indizes:
- ❌ Queries schlagen fehl
- ❌ Timeout-Errors
- ❌ Feed lädt nicht