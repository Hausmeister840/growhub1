
/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║                    🌿 GROWHUB - KOMPLETTER APP BLUEPRINT                     ║
 * ║                                                                              ║
 * ║                     Cannabis Community & Grow Platform                       ║
 * ║                          Version 2.0 | Dezember 2024                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 1: DATENBANK-SCHEMA (ENTITIES)
// ═══════════════════════════════════════════════════════════════════════════════

export const DATABASE_SCHEMA = {
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 1.1 USER ENTITY (Erweitert Built-in)
  // ─────────────────────────────────────────────────────────────────────────────
  User: {
    description: "Benutzerprofile mit Social Features & Gamification",
    builtInFields: ["id", "email", "full_name", "role", "created_date", "updated_date"],
    customFields: {
      // Profil
      username: { type: "string", description: "Einzigartiger Benutzername" },
      bio: { type: "string", description: "Profilbeschreibung" },
      avatar_url: { type: "string", description: "Profilbild URL" },
      banner_url: { type: "string", description: "Banner-Bild URL" },
      location: { type: "string", description: "Standort" },
      website: { type: "string", description: "Website URL" },
      
      // Social Links
      social_links: {
        type: "object",
        properties: {
          instagram: { type: "string" },
          twitter: { type: "string" },
          youtube: { type: "string" }
        }
      },
      
      // Growing Experience
      grow_level: {
        type: "string",
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "beginner"
      },
      interests: { type: "array", items: { type: "string" }, default: [] },
      
      // Privacy
      privacy_mode: {
        type: "string",
        enum: ["public", "followers", "private"],
        default: "public"
      },
      
      // Social Connections (denormalisiert für Performance)
      followers: { type: "array", items: { type: "string" }, default: [] },
      following: { type: "array", items: { type: "string" }, default: [] },
      followers_count: { type: "number", default: 0 },
      following_count: { type: "number", default: 0 },
      posts_count: { type: "number", default: 0 },
      
      // Gamification
      xp: { type: "number", default: 0 },
      reputation_score: { type: "number", default: 0 },
      badges: { type: "array", items: { type: "string" }, default: [] },
      verified: { type: "boolean", default: false },
      
      // Portfolio & Projects
      projects: { type: "array", items: { type: "object" }, default: [] },
      portfolio: { type: "array", items: { type: "object" }, default: [] },
      
      // Notifications
      notification_settings: {
        type: "object",
        properties: {
          push_enabled: { type: "boolean", default: true },
          likes: { type: "boolean", default: true },
          comments: { type: "boolean", default: true },
          mentions: { type: "boolean", default: true },
          new_followers: { type: "boolean", default: true },
          messages: { type: "boolean", default: true },
          grow_updates: { type: "boolean", default: true }
        }
      },
      push_subscription: { type: "object", description: "Web Push Subscription Data" }
    },
    indexes: ["username", "email", "xp", "reputation_score"],
    rls: "Built-in User security"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.2 POST ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Post: {
    description: "Social Feed Posts mit Multi-Media Support",
    fields: {
      // Content
      content: { type: "string", description: "Post Text" },
      media_urls: { type: "array", items: { type: "string" }, default: [] },
      tags: { type: "array", items: { type: "string" }, default: [] },
      
      // Classification
      post_type: {
        type: "string",
        enum: ["general", "question", "tutorial", "review", "video", "grow_diary_update"],
        default: "general"
      },
      type: {
        type: "string",
        enum: ["video", "live", "image", "text"],
        default: "text",
        description: "Media type für Feed Algorithm"
      },
      category: {
        type: "string",
        enum: ["general", "grow_diary", "strain_review", "education", "product", "event", "video"],
        default: "general"
      },
      visibility: {
        type: "string",
        enum: ["public", "friends", "private"],
        default: "public"
      },
      
      // Status & Moderation
      status: {
        type: "string",
        enum: ["draft", "under_review", "published", "removed"],
        default: "published"
      },
      moderation_status: {
        type: "string",
        enum: ["pending", "allow", "warn", "age_restrict", "block"],
        default: "pending"
      },
      moderation_reason: { type: "string" },
      moderation_checked_at: { type: "string", format: "date-time" },
      requires_manual_review: { type: "boolean", default: false },
      sensitive: { type: "boolean", default: false },
      content_warning: { type: "string" },
      
      // Engagement
      reactions: {
        type: "object",
        default: {
          like: { count: 0, users: [] },
          fire: { count: 0, users: [] },
          laugh: { count: 0, users: [] },
          mind_blown: { count: 0, users: [] },
          helpful: { count: 0, users: [] },
          celebrate: { count: 0, users: [] }
        }
      },
      comments_count: { type: "number", default: 0 },
      view_count: { type: "number", default: 0 },
      share_count: { type: "number", default: 0 },
      bookmarked_by_users: { type: "array", items: { type: "string" }, default: [] },
      
      // Feed Algorithm Scores
      engagement_score: { type: "number", default: 0 },
      viral_score: { type: "number", default: 0 },
      scores_updated_at: { type: "string", format: "date-time" },
      
      // References
      grow_diary_id: { type: "string", description: "Link zu GrowDiary" }
    },
    indexes: ["created_by", "status", "engagement_score", "viral_score", "created_date"],
    rls: {
      read: "public",
      create: "authenticated",
      update: "authenticated",
      delete: "owner only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.3 COMMENT ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Comment: {
    description: "Kommentare auf Posts mit Threading Support",
    fields: {
      content: { type: "string", required: true },
      post_id: { type: "string", required: true },
      author_email: { type: "string", required: true },
      parent_comment_id: { type: "string", description: "Für Reply Threading" },
      reactions: {
        type: "object",
        properties: {
          total: { type: "number", default: 0 },
          byType: { type: "object", default: {} }
        }
      }
    },
    indexes: ["post_id", "author_email", "parent_comment_id"],
    rls: {
      read: "public",
      create: "authenticated + author_email match",
      update: "author only",
      delete: "author only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.4 FOLLOW ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Follow: {
    description: "User-zu-User Follower-Beziehungen mit Affinität",
    fields: {
      follower_id: { type: "string", required: true },
      follower_email: { type: "string", required: true },
      followee_id: { type: "string", required: true },
      followee_email: { type: "string", required: true },
      status: { type: "string", enum: ["active", "blocked"], default: "active" },
      weight: { type: "number", default: 1.0, description: "Affinität basierend auf Interaktionen" },
      last_interaction_at: { type: "string", format: "date-time" }
    },
    indexes: ["follower_id", "followee_id", "follower_email", "followee_email"],
    rls: {
      read: "participant only",
      create: "follower only",
      update: "follower only",
      delete: "follower only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.5 STORY ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Story: {
    description: "24h Stories mit Media Support",
    fields: {
      media_url: { type: "string", required: true },
      media_type: { type: "string", enum: ["image", "video"], default: "image" },
      text_overlay: { type: "string" },
      duration_seconds: { type: "number", default: 5 },
      views: { type: "array", items: { type: "string" }, default: [] },
      expires_at: { type: "string", format: "date-time", description: "24h nach Erstellung" },
      replies: {
        type: "array",
        items: {
          type: "object",
          properties: {
            user_email: { type: "string" },
            message: { type: "string" },
            timestamp: { type: "string", format: "date-time" }
          }
        },
        default: []
      }
    },
    indexes: ["created_by", "expires_at"],
    rls: "Default"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.6 CONVERSATION & MESSAGE ENTITIES
  // ─────────────────────────────────────────────────────────────────────────────
  Conversation: {
    description: "DMs und Gruppen-Chats",
    fields: {
      name: { type: "string", description: "Null für DMs, Name für Gruppen" },
      is_group: { type: "boolean", default: false },
      participant_emails: { type: "array", items: { type: "string" }, required: true },
      admin_emails: { type: "array", items: { type: "string" } },
      avatar_url: { type: "string" },
      last_message_preview: { type: "string" },
      last_message_timestamp: { type: "string", format: "date-time" },
      unread_counts: { type: "object", description: "Map: email → unread count" }
    },
    indexes: ["participant_emails", "last_message_timestamp"],
    rls: {
      read: "participant only",
      create: "authenticated",
      update: "participant only",
      delete: "admin or participant"
    }
  },

  Message: {
    description: "Chat-Nachrichten",
    fields: {
      conversation_id: { type: "string", required: true },
      sender_email: { type: "string", required: true },
      content: { type: "string" },
      media_urls: { type: "array", items: { type: "string" } },
      reactions: { type: "object", description: "emoji → [user_emails]" },
      read_by: { type: "array", items: { type: "string" }, default: [] }
    },
    indexes: ["conversation_id", "sender_email", "created_date"],
    rls: {
      read: "public (via conversation access)",
      create: "authenticated",
      update: "public",
      delete: "sender only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.7 NOTIFICATION ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Notification: {
    description: "Push & In-App Benachrichtigungen",
    fields: {
      recipient_email: { type: "string", required: true },
      sender_email: { type: "string", required: true },
      sender_id: { type: "string", required: true },
      type: {
        type: "string",
        enum: ["reaction", "comment", "follow", "like", "message"],
        required: true
      },
      post_id: { type: "string" },
      conversation_id: { type: "string" },
      read: { type: "boolean", default: false },
      message: { type: "string", required: true }
    },
    indexes: ["recipient_email", "read", "created_date"],
    rls: {
      read: "recipient only",
      write: "system only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.8 GROW DIARY ENTITIES
  // ─────────────────────────────────────────────────────────────────────────────
  GrowDiary: {
    description: "Cannabis Grow-Tagebücher",
    fields: {
      // Basis
      name: { type: "string", required: true, description: "z.B. 'White Widow Indoor 2024'" },
      strain_name: { type: "string", required: true },
      strain_id: { type: "string", description: "Referenz zur Strain Entity" },
      start_date: { type: "string", format: "date", required: true },
      expected_harvest_date: { type: "string", format: "date" },
      
      // Status
      current_stage: {
        type: "string",
        enum: ["Keimung", "Sämling", "Wachstum", "Blüte", "Spülung", "Ernte"],
        default: "Keimung"
      },
      status: {
        type: "string",
        enum: ["active", "completed", "archived", "problem"],
        default: "active"
      },
      
      // Setup
      setup_type: { type: "string", enum: ["indoor", "outdoor", "greenhouse"], default: "indoor" },
      grow_method: { type: "string", enum: ["soil", "hydro", "coco", "aero"], default: "soil" },
      cover_image_url: { type: "string" },
      plant_count: { type: "number", default: 1 },
      goals: { type: "array", items: { type: "string" } },
      
      // Aggregierte Stats
      stats: {
        type: "object",
        properties: {
          total_days: { type: "number", default: 0 },
          total_entries: { type: "number", default: 0 },
          total_photos: { type: "number", default: 0 },
          avg_temp: { type: "number" },
          avg_humidity: { type: "number" },
          total_water_ml: { type: "number", default: 0 },
          issues_count: { type: "number", default: 0 }
        }
      },
      
      // AI Insights
      ai_insights: {
        type: "object",
        properties: {
          health_score: { type: "number", min: 0, max: 100, default: 100 },
          last_analysis: { type: "string", format: "date-time" },
          last_analysis_summary: { type: "string" },
          current_issues: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
          predicted_harvest_date: { type: "string", format: "date" }
        }
      },
      
      // Sharing
      notifications_enabled: { type: "boolean", default: true },
      share_settings: {
        type: "object",
        properties: {
          is_public: { type: "boolean", default: false },
          allow_comments: { type: "boolean", default: true },
          auto_post_updates: { type: "boolean", default: true },
          post_visibility: { type: "string", enum: ["public", "followers", "private"] }
        }
      }
    },
    indexes: ["created_by", "status", "current_stage", "strain_id"],
    rls: {
      read: "owner OR public diaries",
      write: "owner only"
    }
  },

  GrowDiaryEntry: {
    description: "Einzelne Tagebuch-Einträge mit Umweltdaten & AI-Analyse",
    fields: {
      diary_id: { type: "string", required: true },
      day_number: { type: "number", required: true },
      week_number: { type: "number" },
      entry_date: { type: "string", format: "date-time" },
      growth_stage: {
        type: "string",
        enum: ["Keimung", "Sämling", "Wachstum", "Blüte", "Spülung", "Ernte"],
        required: true
      },
      
      // Beobachtungen
      plant_observation: { type: "string" },
      plant_height_cm: { type: "number" },
      
      // Umweltdaten
      environment_data: {
        type: "object",
        properties: {
          temp_c: { type: "number" },
          humidity_rh: { type: "number" },
          vpd_kpa: { type: "number" },
          co2_ppm: { type: "number" },
          light_intensity_ppfd: { type: "number" },
          light_schedule: { type: "string", description: "z.B. 18/6 oder 12/12" }
        }
      },
      
      // Fütterung
      feeding_data: {
        type: "object",
        properties: {
          water_ml: { type: "number" },
          ph: { type: "number" },
          ec_ppm: { type: "number" },
          nutrients: { type: "string" },
          nutrient_schedule: { type: "string" }
        }
      },
      
      // Aktionen
      actions_taken: {
        type: "array",
        items: { type: "string" },
        description: "z.B. 'Topping', 'LST', 'Defoliation'"
      },
      media_urls: { type: "array", items: { type: "string" } },
      
      // AI Analyse
      ai_analysis: {
        type: "object",
        properties: {
          analyzed_at: { type: "string", format: "date-time" },
          health_assessment: {
            type: "string",
            enum: ["excellent", "good", "fair", "poor", "critical"]
          },
          confidence_score: { type: "number", min: 0, max: 1 },
          detected_issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                issue_type: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                description: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          positive_observations: { type: "array", items: { type: "string" } },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                priority: { type: "string", enum: ["immediate", "urgent", "soon", "routine"] },
                timeframe: { type: "string" }
              }
            }
          },
          knowledge_links: { type: "array", items: { type: "string" } },
          detailed_analysis: { type: "string" }
        }
      },
      
      // Meilensteine
      milestone: { type: "boolean", default: false },
      milestone_type: {
        type: "string",
        enum: ["germination", "first_leaves", "topped", "flowering_start", "harvest"]
      }
    },
    indexes: ["diary_id", "day_number", "growth_stage", "entry_date"],
    rls: "Inherited from parent GrowDiary"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.9 STRAIN ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Strain: {
    description: "Cannabis-Sorten Datenbank",
    fields: {
      name: { type: "string", required: true },
      alias: { type: "array", items: { type: "string" } },
      genetics: { type: "string" },
      type: { type: "string", description: "Indica/Sativa/Hybrid" },
      indicaPercent: { type: "number" },
      sativaPercent: { type: "number" },
      
      // Cannabinoid Profile
      thc: { type: "object", properties: { min: { type: "number" }, max: { type: "number" } } },
      cbd: { type: "string" },
      
      // Effects & Medical
      effects: { type: "object", description: "effect_name → intensity (0-100)" },
      medical_use: { type: "object", description: "condition → boolean" },
      
      // Sensory
      flavor: { type: "array", items: { type: "string" } },
      aroma: { type: "array", items: { type: "string" } },
      smell_strength: { type: "number" },
      
      // Growing Info
      growing: {
        type: "object",
        properties: {
          difficulty: { type: "string" },
          flowering_time_days: { type: "string" },
          yield: { type: "string" },
          smell_control: { type: "string" },
          mold_resistance: { type: "string" },
          training_methods: { type: "array", items: { type: "string" } }
        }
      },
      
      // Appearance
      appearance: {
        type: "object",
        properties: {
          trichome_coverage: { type: "string" },
          color: { type: "string" },
          bud_structure: { type: "string" }
        }
      },
      
      // Ratings
      rating: {
        type: "object",
        properties: {
          wirkung: { type: "number" },
          geschmack: { type: "number" },
          anbau: { type: "number" },
          medizinisch: { type: "number" },
          preis_leistung: { type: "number" },
          gesamt: { type: "number" }
        }
      },
      
      suitable_for_beginners: { type: "boolean" },
      recommended_use: { type: "array", items: { type: "string" } }
    },
    indexes: ["name", "type", "rating.gesamt"],
    rls: {
      read: "public",
      write: "admin only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.10 CLUB ENTITY (Cannabis Locations)
  // ─────────────────────────────────────────────────────────────────────────────
  Club: {
    description: "Cannabis-relevante Orte (CSCs, Shops, Ärzte, Apotheken)",
    fields: {
      name: { type: "string", required: true },
      description: { type: "string" },
      address: { type: "string", required: true },
      city: { type: "string", required: true },
      latitude: { type: "number", required: true },
      longitude: { type: "number", required: true },
      
      club_type: {
        type: "string",
        enum: ["cannabis_social_club", "dispensary", "head_shop", "grow_shop", "doctor", "apotheke"],
        required: true
      },
      
      website: { type: "string" },
      opening_hours: {
        type: "object",
        properties: {
          monday: { type: "string" },
          tuesday: { type: "string" },
          wednesday: { type: "string" },
          thursday: { type: "string" },
          friday: { type: "string" },
          saturday: { type: "string" },
          sunday: { type: "string" }
        }
      },
      
      verified: { type: "boolean", default: false },
      rating: { type: "number", default: 0 },
      image_url: { type: "string" },
      features: { type: "array", items: { type: "string" }, description: "z.B. 'telemedizin'" },
      specialization: { type: "string", description: "Für Ärzte" },
      access_requirements: { type: "string" },
      favorited_by_users: { type: "array", items: { type: "string" }, default: [] }
    },
    indexes: ["city", "club_type", "latitude", "longitude", "rating"],
    rls: {
      read: "public",
      write: "admin only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.11 NO-GO ZONE ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  NoGoZone: {
    description: "Schutzzonen (Schulen, Spielplätze etc.) - CanG Compliance",
    fields: {
      name: { type: "string", required: true },
      type: {
        type: "string",
        enum: ["school", "kindergarten", "playground", "sports", "youth_centre", "pedestrian_area"],
        required: true
      },
      latitude: { type: "number", required: true },
      longitude: { type: "number", required: true },
      radius_meters: { type: "number", default: 100 },
      source: { type: "string", description: "Datenquelle (OpenStreetMap)" },
      osm_id: { type: "string", description: "Für Deduplizierung" },
      confidence: { type: "number", default: 1.0 },
      active_rule: {
        type: "object",
        properties: {
          time_window: { type: "string", enum: ["always", "07-20"] },
          days: { type: "array", items: { type: "number" } }
        }
      }
    },
    indexes: ["type", "latitude", "longitude"],
    rls: {
      read: "public",
      write: "admin only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.12 PRODUCT ENTITY (Marketplace)
  // ─────────────────────────────────────────────────────────────────────────────
  Product: {
    description: "Marketplace für Growing Equipment",
    fields: {
      title: { type: "string", required: true },
      description: { type: "string" },
      price: { type: "number", required: true },
      category: {
        type: "string",
        enum: ["seeds", "equipment", "accessories", "merchandise", "nutrients", "books", "other"],
        required: true
      },
      condition: {
        type: "string",
        enum: ["new", "like_new", "good", "fair"],
        required: true
      },
      image_urls: { type: "array", items: { type: "string" } },
      location: { type: "string" },
      seller_email: { type: "string", required: true },
      is_trade: { type: "boolean", default: false },
      status: { type: "string", enum: ["available", "reserved", "sold"], default: "available" },
      favorited_by_users: { type: "array", items: { type: "string" }, default: [] }
    },
    indexes: ["category", "seller_email", "status", "price"],
    rls: {
      read: "public",
      create: "authenticated",
      update: "seller only",
      delete: "seller only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.13 GROUP ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Group: {
    description: "Community Gruppen",
    fields: {
      name: { type: "string", required: true },
      description: { type: "string" },
      cover_image_url: { type: "string" },
      privacy: { type: "string", enum: ["public", "private"], default: "public" },
      members: { type: "array", items: { type: "string" } },
      admin_emails: { type: "array", items: { type: "string" }, required: true }
    },
    indexes: ["name", "privacy", "admin_emails"],
    rls: {
      read: "public groups OR member",
      write: "admin only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.14 KNOWLEDGE ARTICLE ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  KnowledgeArticle: {
    description: "Wissensdatenbank Artikel",
    fields: {
      title: { type: "string", required: true },
      slug: { type: "string" },
      content: { type: "string", required: true },
      excerpt: { type: "string" },
      category: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      author_email: { type: "string" },
      cover_image_url: { type: "string" },
      published: { type: "boolean", default: false },
      view_count: { type: "number", default: 0 }
    },
    indexes: ["slug", "category", "published"],
    rls: {
      read: "public (published)",
      write: "admin only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.15 EVENT ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Event: {
    description: "Community Events",
    fields: {
      title: { type: "string", required: true },
      description: { type: "string" },
      start_date: { type: "string", format: "date-time", required: true },
      end_date: { type: "string", format: "date-time" },
      location: { type: "string" },
      is_online: { type: "boolean", default: false },
      online_link: { type: "string" },
      image_url: { type: "string" },
      organizer_email: { type: "string" },
      attendees: { type: "array", items: { type: "string" }, default: [] },
      max_attendees: { type: "number" }
    },
    indexes: ["start_date", "organizer_email"],
    rls: "Default"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.16 REPORT ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Report: {
    description: "Content Moderation Reports",
    fields: {
      post_id: { type: "string", required: true },
      reported_by: { type: "string", required: true },
      reason: {
        type: "string",
        enum: ["spam", "harassment", "inappropriate", "violence", "hate", "misinformation", "other"],
        required: true
      },
      details: { type: "string" },
      status: {
        type: "string",
        enum: ["pending", "reviewing", "resolved", "dismissed"],
        default: "pending"
      },
      reviewed_by: { type: "string" },
      reviewed_at: { type: "string", format: "date-time" },
      action_taken: { type: "string" }
    },
    indexes: ["status", "post_id", "reported_by"],
    rls: "Admin only"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.17 LIVE STREAM ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  LiveStream: {
    description: "Live Streaming",
    fields: {
      title: { type: "string", required: true },
      description: { type: "string" },
      stream_url: { type: "string", required: true },
      thumbnail_url: { type: "string" },
      status: { type: "string", enum: ["live", "ended", "scheduled"], default: "scheduled" },
      started_at: { type: "string", format: "date-time" },
      ended_at: { type: "string", format: "date-time" },
      viewer_count: { type: "number", default: 0 },
      current_viewers: { type: "array", items: { type: "string" }, default: [] },
      category: {
        type: "string",
        enum: ["growing", "harvest", "tutorial", "q&a", "chill"],
        default: "chill"
      }
    },
    indexes: ["status", "created_by", "started_at"],
    rls: "Default"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.18 PLANT SCAN ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  PlantScan: {
    description: "AI Pflanzen-Scans",
    fields: {
      image_url: { type: "string", required: true },
      health_score: { type: "number", min: 0, max: 10 },
      analysis_result: { type: "object", description: "Vollständige AI Analyse" },
      grow_diary_id: { type: "string" },
      notes: { type: "string" }
    },
    indexes: ["created_by", "grow_diary_id"],
    rls: {
      read: "owner only",
      write: "owner only"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.19 CHALLENGE ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  Challenge: {
    description: "Gamification Challenges",
    fields: {
      title: { type: "string", required: true },
      description: { type: "string" },
      type: { type: "string", enum: ["daily", "weekly", "monthly", "special"] },
      xp_reward: { type: "number" },
      badge_reward: { type: "string" },
      requirements: { type: "object" },
      start_date: { type: "string", format: "date-time" },
      end_date: { type: "string", format: "date-time" },
      participants: { type: "array", items: { type: "string" }, default: [] },
      completions: { type: "array", items: { type: "string" }, default: [] }
    },
    indexes: ["type", "start_date", "end_date"],
    rls: "Default"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1.20 ACTIVITY FEED ENTITY
  // ─────────────────────────────────────────────────────────────────────────────
  ActivityFeed: {
    description: "User Activity Tracking",
    fields: {
      user_email: { type: "string", required: true },
      action_type: {
        type: "string",
        enum: ["like", "comment", "follow", "repost", "story_view", "join_live"]
      },
      target_type: { type: "string", enum: ["post", "user", "story", "live", "comment"] },
      target_id: { type: "string" },
      metadata: { type: "object" }
    },
    indexes: ["user_email", "action_type", "created_date"],
    rls: "Default"
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 2: ENTITY RELATIONSHIPS (ER-DIAGRAMM)
// ═══════════════════════════════════════════════════════════════════════════════

export const ENTITY_RELATIONSHIPS = `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        GROWHUB ENTITY RELATIONSHIP DIAGRAM                       │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────┐
                                    │   USER   │
                                    └────┬─────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
            ▼                            ▼                            ▼
      ┌──────────┐               ┌──────────────┐              ┌──────────┐
      │   POST   │               │    FOLLOW    │              │  STORY   │
      └────┬─────┘               │  (Junction)  │              └──────────┘
           │                     └──────────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
┌───────┐ ┌────────────┐ ┌──────────┐
│COMMENT│ │NOTIFICATION│ │  REPORT  │
└───────┘ └────────────┘ └──────────┘


                    ┌──────────┐
                    │   USER   │
                    └────┬─────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
      ▼                  ▼                  ▼
┌───────────┐    ┌─────────────┐    ┌──────────────┐
│GROW DIARY │    │CONVERSATION │    │   PRODUCT    │
└─────┬─────┘    └──────┬──────┘    │ (Marketplace)│
      │                 │           └──────────────┘
      ▼                 ▼
┌───────────────┐ ┌──────────┐
│GROW DIARY     │ │ MESSAGE  │
│ENTRY          │ └──────────┘
└───────┬───────┘
        │
        ▼
  ┌───────────┐
  │PLANT SCAN │
  └───────────┘


┌──────────┐     ┌──────────┐     ┌─────────────────┐
│  STRAIN  │◄────│GROW DIARY│     │KNOWLEDGE ARTICLE│
└──────────┘     └──────────┘     └─────────────────┘


┌──────────┐     ┌───────────┐    ┌──────────┐
│   CLUB   │     │NO-GO ZONE │    │  EVENT   │
│(Location)│     │  (CanG)   │    │          │
└──────────┘     └───────────┘    └──────────┘


┌──────────┐     ┌───────────┐    ┌──────────────┐
│  GROUP   │     │LIVE STREAM│    │  CHALLENGE   │
└──────────┘     └───────────┘    │(Gamification)│
                                  └──────────────┘
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 3: FRONTEND ARCHITEKTUR
// ═══════════════════════════════════════════════════════════════════════════════

export const FRONTEND_ARCHITECTURE = {
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 3.1 PAGES (59 Total)
  // ─────────────────────────────────────────────────────────────────────────────
  pages: {
    // Core Social
    "Feed.jsx": {
      description: "Haupt-Feed mit For You, Trending, Following Tabs",
      features: [
        "Engagement-basiertes Ranking",
        "Pull-to-Refresh",
        "Infinite Scroll",
        "Debounced Search",
        "Story Bar Integration"
      ],
      entities: ["Post", "User", "Story"],
      components: ["PostCard", "StoriesBar", "CreatePost", "CommentsModal"]
    },
    "Reels.jsx": {
      description: "TikTok-style Video Feed",
      features: ["Vertical Swipe", "Auto-Play", "Double-Tap Like"],
      entities: ["Post (type=video)"],
      components: ["SimpleVideoPlayer", "ReelsCommentsModal"]
    },
    "Profile.jsx": {
      description: "User Profile mit Stats, Posts, Grows",
      features: ["Edit Mode", "Follow/Unfollow", "Tabs", "Gamification Panel"],
      entities: ["User", "Post", "GrowDiary", "Follow"],
      components: ["ProfileHeader", "ProfileStats", "ProfilePostsGrid", "EnhancedGamificationPanel"]
    },
    "Messages.jsx": {
      description: "Chat System mit DMs und Gruppen",
      features: ["Real-time Updates", "Media Sharing", "Read Receipts"],
      entities: ["Conversation", "Message", "User"],
      components: ["ConversationList", "MessageArea", "MessageBubble"]
    },
    "Notifications.jsx": {
      description: "Notification Center",
      features: ["Mark as Read", "Deep Links", "Filtering"],
      entities: ["Notification"],
      components: ["NotificationCenter"]
    },

    // Grow Features
    "GrowDiaries.jsx": {
      description: "Liste aller Grow-Tagebücher",
      features: ["Filter by Stage", "Create New"],
      entities: ["GrowDiary"],
      components: ["GrowDiaryCard"]
    },
    "GrowDiaryDetail.jsx": {
      description: "Einzelnes Grow-Tagebuch mit Timeline",
      features: ["Entry Timeline", "AI Insights", "Charts", "Share"],
      entities: ["GrowDiary", "GrowDiaryEntry", "Strain"],
      components: ["GrowTimelineView", "GrowStatsPanel", "GrowAIInsights", "GrowCharts"]
    },
    "CreateGrowDiary.jsx": {
      description: "Neues Tagebuch erstellen",
      features: ["Strain Selection", "Setup Config"],
      entities: ["GrowDiary", "Strain"],
      components: ["StrainSelector"]
    },
    "PlantScan.jsx": {
      description: "AI Pflanzen-Scanner",
      features: ["Camera Capture", "AI Analysis", "Save to Diary"],
      entities: ["PlantScan", "GrowDiary"],
      components: ["CameraCapture", "AnalysisResult"]
    },

    // Discovery
    "Strains.jsx": {
      description: "Sorten-Datenbank Browser",
      features: ["Filter & Sort", "Compare", "Reviews"],
      entities: ["Strain"],
      components: ["StrainCard", "StrainFilters"]
    },
    "StrainDetail.jsx": {
      description: "Einzelne Sorte Details",
      features: ["Effects Chart", "Growing Info", "User Reviews"],
      entities: ["Strain", "Post"],
      components: ["EffectsRadar", "GrowingInfo"]
    },
    "Map.jsx": {
      description: "Interaktive Karte (Clubs, Shops, Ärzte)",
      features: ["Clustering", "Filters", "No-Go Zones", "Geolocation"],
      entities: ["Club", "NoGoZone"],
      components: ["LocationList", "LocationDetailPanel", "NoGoZoneWarning"]
    },
    "Search.jsx": {
      description: "Globale Suche",
      features: ["Multi-Entity Search", "Filters", "Recent"],
      entities: ["Post", "User", "Strain", "KnowledgeArticle"],
      components: ["SearchResults"]
    },

    // Community
    "Groups.jsx": {
      description: "Community Gruppen",
      features: ["Browse", "Create", "Join"],
      entities: ["Group"],
      components: ["GroupCard"]
    },
    "GroupDetail.jsx": {
      description: "Gruppen-Detail mit Posts",
      features: ["Members", "Group Feed", "Admin Panel"],
      entities: ["Group", "Post"],
      components: ["GroupHeader", "GroupFeed"]
    },
    "Events.jsx": {
      description: "Community Events",
      features: ["Calendar View", "RSVP", "Online Events"],
      entities: ["Event"],
      components: ["EventCard", "EventCalendar"]
    },
    "Challenges.jsx": {
      description: "Gamification Challenges",
      features: ["Daily/Weekly/Monthly", "Progress", "Leaderboard"],
      entities: ["Challenge", "User"],
      components: ["ChallengeCard", "ProgressBar"]
    },
    "Leaderboard.jsx": {
      description: "Community Leaderboards",
      features: ["XP Ranking", "Reputation", "Grows"],
      entities: ["User", "Leaderboard"],
      components: ["LeaderboardTable"]
    },

    // Marketplace
    "Marketplace.jsx": {
      description: "Equipment Marketplace",
      features: ["Browse", "Filter", "Create Listing"],
      entities: ["Product"],
      components: ["ProductCard", "ProductFilters"]
    },
    "ProductDetail.jsx": {
      description: "Produkt Details",
      features: ["Gallery", "Contact Seller", "Favorite"],
      entities: ["Product", "User"],
      components: ["ProductGallery", "SellerInfo"]
    },
    "CreateProduct.jsx": {
      description: "Produkt einstellen",
      features: ["Multi-Image Upload", "Category Selection"],
      entities: ["Product"],
      components: ["ProductForm"]
    },

    // Knowledge
    "Knowledge.jsx": {
      description: "Wissensdatenbank",
      features: ["Categories", "Search", "Featured"],
      entities: ["KnowledgeArticle"],
      components: ["ArticleCard"]
    },
    "ArticleDetail.jsx": {
      description: "Artikel lesen",
      features: ["Markdown Rendering", "Related Articles"],
      entities: ["KnowledgeArticle"],
      components: ["ArticleContent"]
    },

    // Live
    "LiveStreams.jsx": {
      description: "Live Stream Übersicht",
      features: ["Active Streams", "Schedule", "Go Live"],
      entities: ["LiveStream"],
      components: ["LiveStreamCard"]
    },

    // User Management
    "Settings.jsx": {
      description: "App Einstellungen",
      features: ["Profile Edit", "Privacy", "Notifications", "Theme"],
      entities: ["User"],
      components: ["SettingsForm"]
    },
    "NotificationSettings.jsx": {
      description: "Benachrichtigungs-Einstellungen",
      features: ["Push Toggle", "Per-Type Settings"],
      entities: ["User"],
      components: ["NotificationToggles"]
    },
    "Saved.jsx": {
      description: "Gespeicherte Posts",
      features: ["Bookmarks", "Collections"],
      entities: ["Post"],
      components: ["PostCard"]
    },
    "Liked.jsx": {
      description: "Gelikte Posts",
      features: ["Like History"],
      entities: ["Post"],
      components: ["PostCard"]
    },

    // Auth & Onboarding
    "AgeGate.jsx": {
      description: "Altersverifikation (CanG Compliance)",
      features: ["Age Check", "30-Day Cookie"],
      entities: [],
      components: []
    },
    "Onboarding.jsx": {
      description: "Neuer User Onboarding",
      features: ["Profile Setup", "Interests", "Follow Suggestions"],
      entities: ["User"],
      components: ["OnboardingSteps"]
    },

    // Content Creation
    "CreateStory.jsx": {
      description: "Story erstellen",
      features: ["Camera/Gallery", "Text Overlay", "Filters"],
      entities: ["Story"],
      components: ["StoryEditor"]
    },
    "PostThread.jsx": {
      description: "Post Detail mit Kommentar-Thread",
      features: ["Full Comments", "Share"],
      entities: ["Post", "Comment"],
      components: ["PostCard", "CommentThread"]
    },

    // Admin
    "AdminDashboard.jsx": {
      description: "Admin Panel Übersicht",
      features: ["Stats", "Quick Actions"],
      entities: ["Post", "User", "Report"],
      components: ["AdminOverview", "AdminStatistics"]
    },
    "ModerationQueue.jsx": {
      description: "Content Moderation",
      features: ["Report Queue", "Actions", "Auto-Mod Config"],
      entities: ["Report", "Post"],
      components: ["ModerationCard"]
    },
    "AdminZoneManager.jsx": {
      description: "No-Go Zone Verwaltung",
      features: ["Import", "Edit", "Visualize"],
      entities: ["NoGoZone"],
      components: ["ZoneEditor"]
    },

    // Legal & Help
    "Privacy.jsx": { description: "Datenschutzerklärung", entities: [] },
    "Terms.jsx": { description: "Nutzungsbedingungen", entities: [] },
    "Help.jsx": { description: "Hilfe & Support", entities: [] },

    // Misc
    "Hashtag.jsx": {
      description: "Posts zu einem Hashtag",
      features: ["Tag Feed", "Related Tags"],
      entities: ["Post"],
      components: ["PostCard"]
    },
    "Activity.jsx": {
      description: "User Activity Feed",
      features: ["Activity Timeline"],
      entities: ["ActivityFeed"],
      components: ["ActivityItem"]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3.2 COMPONENTS (316 Total) - Kategorisiert
  // ─────────────────────────────────────────────────────────────────────────────
  components: {
    // Feed Components (~25)
    feed: [
      "PostCard.jsx - Post Anzeige mit Reactions, Media Grid",
      "PostMenu.jsx - Post Options (Edit, Delete, Report)",
      "PostContent.jsx - Text mit Mentions & Hashtags",
      "CreatePost.jsx - Post Editor Modal",
      "PostEditModal.jsx - Post bearbeiten",
      "ReportModal.jsx - Post melden",
      "CommentsPreview.jsx - Kommentar-Vorschau",
      "ReactionBar.jsx - Like/Fire/etc. Buttons",
      "FeedFilters.jsx - Feed Filter Tabs",
      "TrendingTopics.jsx - Trending Hashtags",
      "LiveBadge.jsx - Live Indicator"
    ],

    // Media Components (~15)
    media: [
      "SimpleVideoPlayer.jsx - Optimierter Video Player",
      "SimpleImage.jsx - Lazy Loading Image",
      "ModernMediaViewer.jsx - Fullscreen Gallery",
      "MediaUploader.jsx - Multi-File Upload",
      "OptimizedMediaGrid.jsx - Responsive Grid"
    ],

    // Stories (~5)
    stories: [
      "StoriesBar.jsx - Horizontale Story Leiste",
      "StoryViewer.jsx - Fullscreen Story Viewer",
      "StoryProgress.jsx - Auto-Progress Bar"
    ],

    // Comments (~5)
    comments: [
      "CommentsModal.jsx - Kommentar-Overlay",
      "CommentItem.jsx - Einzelner Kommentar",
      "CommentInput.jsx - Kommentar-Eingabe",
      "CommentThread.jsx - Threaded Comments"
    ],

    // Profile (~20)
    profile: [
      "ProfileHeader.jsx - Avatar, Name, Stats",
      "ProfileStats.jsx - Follower/Following/Posts",
      "ProfileAbout.jsx - Bio & Links",
      "ProfilePostsGrid.jsx - Post Grid View",
      "ProfileGrowDiaries.jsx - Diary Cards",
      "ProfileCommunityActivity.jsx - Activity Feed",
      "EnhancedGamificationPanel.jsx - XP, Badges, Level",
      "ProfileConnections.jsx - Followers/Following List",
      "InlineProfileEditor.jsx - Inline Edit Mode",
      "FollowerListModal.jsx - Follower/Following Modal",
      "FollowersFollowingSection.jsx - Tab Content"
    ],

    // Grow Components (~25)
    grow: [
      "GrowTimelineView.jsx - Entry Timeline",
      "GrowStatsPanel.jsx - Aggregierte Stats",
      "GrowAIInsights.jsx - AI Recommendations",
      "GrowCharts.jsx - Temp/Humidity Charts",
      "GrowMilestones.jsx - Milestone Badges",
      "GrowEntryModal.jsx - Neuen Eintrag erstellen",
      "EntryCard.jsx - Einzelner Eintrag",
      "GrowMasterChat.jsx - AI Grow Assistant",
      "ShareGrowDiaryModal.jsx - Sharing Options"
    ],

    // Map Components (~10)
    map: [
      "LocationList.jsx - Sidebar Location Liste",
      "LocationDetailPanel.jsx - Location Details",
      "NoGoZoneWarning.jsx - Schutzzone Alert",
      "InfoDrawer.jsx - Mobile Bottom Sheet",
      "InfoModal.jsx - Desktop Info Modal"
    ],

    // Messages (~10)
    messages: [
      "ConversationList.jsx - Chat Liste",
      "MessageArea.jsx - Chat Bereich",
      "MessageBubble.jsx - Einzelne Nachricht",
      "ChatComposer.jsx - Nachricht Eingabe",
      "StartConversationModal.jsx - Neuer Chat",
      "EmptyState.jsx - Keine Chats"
    ],

    // Layout (~10)
    layout: [
      "DesktopNav.jsx - Desktop Sidebar Navigation",
      "MobileBottomNav.jsx - Mobile Tab Bar",
      "MobileHeader.jsx - Mobile Top Bar",
      "MobileMenu.jsx - Mobile Slide-out Menu"
    ],

    // UI Components (~50+)
    ui: [
      "Button.jsx - Styled Button",
      "Input.jsx - Text Input",
      "Textarea.jsx - Multi-line Input",
      "Card.jsx - Card Container",
      "Badge.jsx - Status Badge",
      "Avatar.jsx - User Avatar",
      "Tabs.jsx - Tab Navigation",
      "Select.jsx - Dropdown Select",
      "Switch.jsx - Toggle Switch",
      "Progress.jsx - Progress Bar",
      "Skeleton.jsx - Loading Skeleton",
      "LoadingSkeleton.jsx - Pre-built Skeletons",
      "PullToRefresh.jsx - Pull Gesture",
      "ErrorBoundary.jsx - Error Catching",
      "Toast/Sonner - Notifications"
    ],

    // Notifications (~5)
    notifications: [
      "NotificationCenter.jsx - Notification List",
      "NotificationManager.jsx - Notification Logic",
      "MessageNotification.jsx - Chat Notification"
    ],

    // Gamification (~5)
    gamification: [
      "DailyChallenge.jsx - Daily Quest",
      "WeeklyChallenge.jsx - Weekly Quest",
      "EnhancedGamificationPanel.jsx - Full Panel"
    ],

    // Admin (~10)
    admin: [
      "AdminOverview.jsx - Dashboard Stats",
      "AdminStatistics.jsx - Charts",
      "AdminContentModeration.jsx - Mod Queue",
      "AdminUserManagement.jsx - User Admin",
      "AdminSettings.jsx - App Settings"
    ],

    // Services/Hooks (~30)
    services: [
      "feedService.js - Feed Data Management",
      "CacheService.js - Data Caching",
      "OfflineService.js - Offline Support",
      "MediaPreloader.js - Image/Video Preload",
      "RealTimeService.js - WebSocket Handler"
    ],

    hooks: [
      "usePost.js - Post CRUD Operations",
      "useFeed.js - Feed State Management",
      "useInfiniteScroll.js - Pagination",
      "useOfflineRecovery.js - Offline Queue",
      "useHapticFeedback.js - Vibration API",
      "useNotifications.js - Notification State"
    ],

    // Utils (~20)
    utils: [
      "dataUtils.js - Data Transformations",
      "media.js - Media Type Detection",
      "validation.js - Input Validation",
      "cache.js - Cache Helpers",
      "gamification.js - XP Calculations",
      "errorHandler.js - Error Processing",
      "GlobalErrorHandler.js - Central Error Handler"
    ],

    // Stores (~3)
    stores: [
      "useUserStore.jsx - User State (Zustand)",
      "useUIStore.jsx - UI State"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3.3 LAYOUT STRUCTURE
  // ─────────────────────────────────────────────────────────────────────────────
  layout: {
    desktop: `
    ┌────────────────────────────────────────────────────────────────────┐
    │                         DESKTOP LAYOUT                             │
    ├──────────────┬─────────────────────────────────────────────────────┤
    │              │                                                     │
    │   SIDEBAR    │              MAIN CONTENT                           │
    │   (272px)    │              (max 900px)                            │
    │              │                                                     │
    │   - Logo     │     ┌─────────────────────────────────────────┐     │
    │   - Nav      │     │           PAGE HEADER                   │     │
    │   - Create   │     ├─────────────────────────────────────────┤     │
    │   - Profile  │     │                                         │     │
    │              │     │           PAGE CONTENT                  │     │
    │              │     │                                         │     │
    │              │     │                                         │     │
    │              │     │                                         │     │
    │              │     │                                         │     │
    │              │     └─────────────────────────────────────────┘     │
    │              │                                                     │
    └──────────────┴─────────────────────────────────────────────────────┘
    `,

    mobile: `
    ┌─────────────────────────────────┐
    │         MOBILE LAYOUT           │
    ├─────────────────────────────────┤
    │          TOP HEADER             │  ← Logo, Notifications, Menu
    │           (56px)                │
    ├─────────────────────────────────┤
    │                                 │
    │                                 │
    │        MAIN CONTENT             │
    │    (Full Width, Scrollable)     │
    │                                 │
    │                                 │
    │                                 │
    │                                 │
    │                                 │
    ├─────────────────────────────────┤
    │        BOTTOM NAV BAR           │  ← Feed, Search, Create, Msgs, Profile
    │           (64px)                │
    └─────────────────────────────────┘
    `
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 4: BACKEND FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const BACKEND_FUNCTIONS = {
  
  // Feed & Posts
  "feed/getFeed.js": "Personalisierter Feed mit Ranking",
  "feed/getVideoFeed.js": "Video-only Feed für Reels",
  "feed/getCardFeed.js": "Card-based Feed",
  "feed/getOptimizedFeed.js": "Optimierter Feed mit Caching",
  "feed/diagnostics.js": "Feed Debug Info",
  "calculateFeedScores.js": "Engagement Score Berechnung",
  "createPost.js": "Post erstellen mit Moderation",

  // Reactions & Engagement
  "toggleReaction.js": "Like/Fire/etc. toggle",
  "toggleBookmark.js": "Bookmark toggle",
  "posts/toggleReaction.js": "Post Reaction Handler",
  "posts/toggleBookmark.js": "Post Bookmark Handler",

  // Comments
  "createComment.js": "Kommentar erstellen",
  "comments/createComment.js": "Comment mit Notification",

  // Profile & Follow
  "profile/getProfile.js": "Profil laden",
  "profile/updateProfile.js": "Profil aktualisieren",
  "profile/toggleFollow.js": "Follow/Unfollow",
  "profile/getFollowers.js": "Follower Liste",
  "profile/getProfileFeed.js": "User Posts",
  "followUser.js": "Follow Handler",
  "toggleFollow.js": "Follow Toggle",
  "getFollowersList.js": "Followers abrufen",
  "uploadAvatar.js": "Avatar Upload",

  // Grow Diary
  "grow/analyzeEntry.js": "AI Eintrag-Analyse",
  "grow/analyzeImage.js": "AI Bild-Analyse",
  "grow/getDiaryTimeline.js": "Timeline laden",
  "grow/exportPDF.js": "Diary als PDF",

  // AI & Analysis
  "ai/growCoachAnalysis.js": "Grow Coach AI",
  "ai/routeCannabisAI.js": "Cannabis AI Router",
  "ai/generateDailyKnowledge.js": "Tägliche Tipps",
  "ai/generateEmbeddings.js": "Content Embeddings",
  "ai/getRecommendations.js": "Personalisierte Empfehlungen",
  "ai/context/getStrainContext.js": "Sorten-Kontext für AI",
  "ai/context/getKnowledgeSnippets.js": "Wissen-Kontext",
  "ai/context/getUserContext.js": "User-Kontext",

  // Moderation
  "moderation/moderatePost.js": "Manuelle Moderation",
  "moderation/autoModeratePost.js": "Auto-Moderation",
  "moderation/evaluateContent.js": "Content Bewertung",

  // Map & Zones
  "zones/loadGermanNoGoZones.js": "NoGo Zonen laden",
  "zones/isInNoGoZone.js": "Zone Check",
  "zones/checkNoGoZoneStatus.js": "Status Check",
  "zones/importFromOpenData.js": "OSM Import",
  "getMapData.js": "Karten-Daten",
  "addLocationToFavorites.js": "Favorit hinzufügen",
  "loadCannabisLocations.js": "Clubs laden",

  // Search
  "search/performSearch.js": "Globale Suche",
  "search/knowledgeSearch.js": "Wissen-Suche",

  // Notifications
  "notifications/sendPushNotification.js": "Push senden",

  // Gamification
  "streak/touch.js": "Streak aktualisieren",
  "streak/getStreak.js": "Streak abrufen",
  "challenges/generateDailyChallenges.js": "Challenges generieren",
  "leaderboard/updateLeaderboards.js": "Leaderboards aktualisieren",

  // Premium & Referral
  "premium/checkAccess.js": "Premium Check",
  "premium/getPlanLimits.js": "Plan Limits",
  "referral/createReferral.js": "Referral Code",
  "referral/completeReferral.js": "Referral abschließen",

  // Analytics
  "analytics/trackEvent.js": "Event Tracking",
  "analytics/trackUserActivity.js": "Activity Tracking",
  "analytics/getDashboard.js": "Admin Dashboard Data",
  "analytics/aggregateContent.js": "Content Aggregation",
  "analytics/aggregateCreators.js": "Creator Stats",

  // Maintenance
  "maintenance/backfillPostStats.js": "Post Stats Migration",
  "maintenance/backfillUserStats.js": "User Stats Migration",
  "maintenance/updatePostScores.js": "Score Recalculation",
  "cron/hourlyMaintenance.js": "Stündliche Tasks",

  // Auth
  "auth/diagnoseLogin.js": "Login Debugging",
  "checkUsername.js": "Username Verfügbarkeit",

  // Shared Utilities
  "_shared/auth.js": "Auth Helpers",
  "_shared/validation.js": "Validation Helpers",
  "_shared/rateLimiter.js": "Rate Limiting",
  "_shared/response.js": "Response Helpers",
  "_shared/retry.js": "Retry Logic",
  "_shared/robustWrapper.js": "Error Wrapper"
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 5: AI AGENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const AI_AGENTS = {
  GrowMaster: {
    description: "AI Grow Coach für Pflanzenberatung",
    capabilities: [
      "Pflanzen-Diagnose",
      "Wachstumstipps",
      "Problem-Lösung",
      "Sorten-Empfehlungen",
      "Nährstoff-Beratung"
    ],
    tools: [
      { entity: "GrowDiary", operations: ["read"] },
      { entity: "GrowDiaryEntry", operations: ["read", "create"] },
      { entity: "Strain", operations: ["read"] },
      { entity: "KnowledgeArticle", operations: ["read"] },
      { entity: "PlantScan", operations: ["read", "create"] }
    ],
    whatsapp_enabled: true
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 6: TECH STACK
// ═══════════════════════════════════════════════════════════════════════════════

export const TECH_STACK = {
  frontend: {
    framework: "React 18.2",
    styling: "Tailwind CSS 3.x",
    ui_library: "shadcn/ui (Radix UI)",
    icons: "Lucide React",
    animations: "Framer Motion",
    routing: "React Router DOM 6",
    state: "React Query (TanStack) + Zustand",
    forms: "React Hook Form + Zod",
    charts: "Recharts",
    maps: "React Leaflet",
    dates: "date-fns",
    markdown: "React Markdown",
    dnd: "@hello-pangea/dnd",
    video: "Native HTML5 Video",
    pwa: "Service Worker"
  },

  backend: {
    platform: "Base44 BaaS",
    runtime: "Deno Deploy",
    database: "Base44 Entity System",
    auth: "Base44 Auth (Built-in)",
    storage: "Base44 File Storage",
    ai: "OpenAI GPT-4 via InvokeLLM",
    email: "Base44 SendEmail"
  },

  external_apis: {
    maps: "OpenStreetMap / Leaflet",
    geocoding: "Nominatim",
    images: "Unsplash (Stock Photos)"
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 7: DATA FLOW DIAGRAMS
// ═══════════════════════════════════════════════════════════════════════════════

export const DATA_FLOWS = {
  
  feedFlow: `
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                           FEED DATA FLOW                                    │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌───────────────┐     ┌──────────────────┐
  │  Client  │────►│ Feed.jsx      │────►│ base44.entities  │
  │ (Browser)│     │ Page          │     │ Post.list()      │
  └──────────┘     └───────────────┘     └────────┬─────────┘
                          │                       │
                          ▼                       ▼
                   ┌─────────────┐         ┌─────────────┐
                   │ Calculate   │◄────────│ Raw Posts   │
                   │ Engagement  │         │ (50 limit)  │
                   │ Score       │         └─────────────┘
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐         ┌─────────────┐
                   │ Filter by   │◄────────│ User        │
                   │ Tab (ForYou/│         │ Following[] │
                   │ Trending)   │         └─────────────┘
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Paginate    │
                   │ (20/page)   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐         ┌─────────────┐
                   │ Render      │────────►│ PostCard    │
                   │ Posts       │         │ Components  │
                   └─────────────┘         └─────────────┘
  `,

  reactionFlow: `
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         REACTION DATA FLOW                                  │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌───────────────┐     ┌──────────────────┐
  │  User    │────►│ PostCard      │────►│ usePost Hook     │
  │ Tap Like │     │ handleLike()  │     │ handleReaction() │
  └──────────┘     └───────────────┘     └────────┬─────────┘
                                                  │
                     ┌────────────────────────────┤
                     │ Optimistic Update          │
                     ▼                            ▼
              ┌─────────────┐            ┌─────────────────┐
              │ UI Updates  │            │ API Call        │
              │ Immediately │            │ Post.update()   │
              └─────────────┘            └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │ Create          │
                                         │ Notification    │
                                         └─────────────────┘
  `,

  authFlow: `
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         AUTHENTICATION FLOW                                 │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌───────────────┐     ┌──────────────────┐
  │  User    │────►│ Layout.jsx    │────►│ AgeGate Check    │
  │ Visits   │     │               │     │ (localStorage)   │
  └──────────┘     └───────────────┘     └────────┬─────────┘
                                                  │
                          ┌───────────────────────┤
                          │ Not Verified          │ Verified
                          ▼                       ▼
                   ┌─────────────┐         ┌─────────────────┐
                   │ Redirect to │         │ base44.auth     │
                   │ /AgeGate    │         │ .isAuthenticated│
                   └─────────────┘         └────────┬────────┘
                                                    │
                          ┌─────────────────────────┤
                          │ Not Auth                │ Authenticated
                          ▼                         ▼
                   ┌─────────────────┐      ┌─────────────────┐
                   │ PUBLIC_PAGES?   │      │ base44.auth.me()│
                   │ → Allow         │      │ → Set User      │
                   │ → Else Login    │      └─────────────────┘
                   └─────────────────┘
  `
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 8: SECURITY & RLS
// ═══════════════════════════════════════════════════════════════════════════════

export const SECURITY = {
  
  rowLevelSecurity: {
    description: "Entity-level Zugriffskontrollen",
    patterns: {
      "public_read": {
        example: "Post, Strain, Club, KnowledgeArticle",
        rule: "{ read: {} }"
      },
      "owner_only": {
        example: "PlantScan, GrowLog",
        rule: "{ read: { created_by: '{{user.email}}' }, write: { created_by: '{{user.email}}' } }"
      },
      "authenticated_create": {
        example: "Post, Comment, Product",
        rule: "{ create: { _authenticated: true } }"
      },
      "admin_write": {
        example: "Strain, Club, NoGoZone",
        rule: "{ write: { user_condition: { role: 'admin' } } }"
      },
      "participant_access": {
        example: "Conversation, Message",
        rule: "{ read: { participant_emails: '{{user.email}}' } }"
      }
    }
  },

  clientSideProtection: [
    "Age Verification Gate (30-day cookie)",
    "Admin Route Protection in Layout.jsx",
    "Public Pages Whitelist",
    "Rate Limiting on Like/Bookmark (400ms cooldown)",
    "Input Validation (max lengths, required fields)",
    "XSS Prevention via React's built-in escaping"
  ],

  backendProtection: [
    "Auth Check: createClientFromRequest(req)",
    "Service Role for Admin Operations",
    "Rate Limiting via _shared/rateLimiter.js",
    "Input Validation in Backend Functions",
    "Webhook Signature Verification"
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 9: FEATURE FLAGS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const FEATURE_CONFIG = {
  
  publicPages: [
    "AgeGate",
    "Privacy", 
    "Terms",
    "Feed",
    "Reels",
    "Strains",
    "StrainDetail"
  ],

  adminPages: [
    "AdminDashboard",
    "ModerationQueue",
    "AdminZoneManager",
    "AdminUserCheck",
    "AuditDashboard",
    "FeedDiagnostics",
    "SystemCheck"
  ],

  noNavPages: [
    "PostThread",
    "MobileMigration",
    "AgeGate",
    "Onboarding",
    "Reels",
    "CreateStory",
    "PlantScan"
  ],

  fullWidthPages: [
    "Map",
    "Messages",
    "Reels",
    "CreateStory",
    "PlantScan"
  ],

  feedConfig: {
    POSTS_PER_PAGE: 20,
    INITIAL_LOAD_LIMIT: 50,
    TRENDING_WINDOW_HOURS: 48,
    ENGAGEMENT_WEIGHTS: {
      like: 2,
      comment: 3,
      bookmark: 1.5,
      media_bonus: 5,
      recency_max_boost: 10
    }
  },

  gamificationConfig: {
    XP_PER_POST: 10,
    XP_PER_COMMENT: 5,
    XP_PER_LIKE_RECEIVED: 2,
    XP_PER_FOLLOWER: 15,
    XP_PER_GROW_ENTRY: 20,
    LEVEL_THRESHOLD: 100
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEIL 10: STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════

export const APP_STATISTICS = {
  totalPages: 59,
  totalComponents: 316,
  totalJSXFiles: 383,
  estimatedLinesOfCode: {
    pages: 17000,
    components: 25000,
    functions: 8000,
    total: 50000
  },
  entities: 20,
  backendFunctions: 65,
  aiAgents: 1
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GrowHubBlueprint() {
  return (
    <div className="p-8 bg-black text-white font-mono text-sm">
      <h1 className="text-2xl font-bold text-green-500 mb-4">
        🌿 GrowHub Blueprint - Development Documentation
      </h1>
      <p className="text-zinc-400">
        Diese Datei enthält die vollständige technische Dokumentation der GrowHub App.
        Importiere die Exports für programmatischen Zugriff auf Schema-Definitionen.
      </p>
      <pre className="mt-4 p-4 bg-zinc-900 rounded-lg overflow-auto">
        {JSON.stringify(APP_STATISTICS, null, 2)}
      </pre>
    </div>
  );
}