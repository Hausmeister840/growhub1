import { InvokeLLM } from '@/integrations/Core';
import { secureWrapper } from '../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../_shared/rateLimiter.js';

Deno.serve(secureWrapper(async (req, { base44, body, user }) => {
    try {
        const { part_number = 1 } = body || {};

        console.log('🔍 Starting GrowHub Audit - Part', part_number);

        const auditPrompt = `Du bist ein Senior Auditor für GrowHub (Cannabis-Community-App).

AUFGABE: Vollständiger Read-Only Scan der App - Frontend, Backend, Entities, Functions, Performance, Mobile UX.

CURRENT PART: ${part_number}

Analysiere systematisch:
1. Frontend: pages/**, components/** - Hook-Probleme, Performance, Mobile Layout
2. Backend: functions/** - Error Handling, Rate Limiting, Validation
3. Entities: *.json - RLS Policies, Indizes, Datenintegrität  
4. KI/LLM: InvokeLLM Calls - Schema, Caching, Timeouts
5. Performance: Bundle Size, Render-Hotspots, Memory Leaks
6. Mobile: Touch Targets, Safe Areas, Responsive Design
7. Security: Auth Checks, Input Validation, XSS/CSRF

Finde mindestens 15 Issues mit:
- file:line Referenz
- 6-Zeilen Code Snippet
- Mini-Diff Lösung (≤6 Zeilen)
- Severity: H/M/L
- Confidence: 0.0-1.0

Strukturiere als JSON mit Executive Summary, Issues List, Quick Wins.`;

        const response = await InvokeLLM({
            prompt: auditPrompt,
            response_json_schema: {
                "type": "object",
                "required": ["part_number", "parts_total", "summary", "issues", "quick_wins"],
                "properties": {
                    "part_number": { "type": "integer" },
                    "parts_total": { "type": "integer" },
                    "timestamp": { "type": "string" },
                    "summary": { 
                        "type": "array", 
                        "items": { "type": "string" },
                        "maxItems": 12
                    },
                    "issues": {
                        "type": "array",
                        "minItems": 15,
                        "items": {
                            "type": "object",
                            "required": ["id", "severity", "area", "file", "line", "diagnose", "confidence"],
                            "properties": {
                                "id": { "type": "string" },
                                "severity": { "type": "string", "enum": ["H", "M", "L"] },
                                "area": { "type": "string" },
                                "file": { "type": "string" },
                                "line": { "type": "integer" },
                                "snippet": { "type": "string" },
                                "fix_mini_diff": { "type": "string" },
                                "diagnose": { "type": "string" },
                                "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
                            }
                        }
                    },
                    "root_causes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "area": { "type": "string" },
                                "explanation": { "type": "string" },
                                "evidence_files": { "type": "array", "items": { "type": "string" } }
                            }
                        }
                    },
                    "quick_wins": { 
                        "type": "array", 
                        "items": { "type": "string" },
                        "minItems": 5
                    },
                    "risks": { 
                        "type": "array", 
                        "items": { "type": "string" } 
                    },
                    "inventories": {
                        "type": "object",
                        "properties": {
                            "components_count": { "type": "integer" },
                            "functions_count": { "type": "integer" },
                            "entities_count": { "type": "integer" },
                            "llm_calls_count": { "type": "integer" }
                        }
                    }
                }
            }
        });

        console.log('✅ Audit completed - Part', part_number);

        return Response.json({
            success: true,
            audit_results: response,
            metadata: {
                timestamp: new Date().toISOString(),
                auditor: user.email,
                part_number: response.part_number || 1,
                parts_total: response.parts_total || 1
            }
        });

    } catch (error) {
        console.error('❌ Audit failed:', error);
        return Response.json({
            error: 'Audit failed',
            details: error.message
        }, { status: 500 });
    }
}, {
    requireAuth: true,
    requireRoles: ['admin', 'moderator'],
    rateLimit: RATE_LIMITS.search,
    maxBodySizeKB: 64
}));