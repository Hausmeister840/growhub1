import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';
import { InvokeLLM } from '@/integrations/Core';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { apply_patches = false } = await req.json().catch(() => ({}));

        console.log('🔍 Starting Layout & UX Audit...');

        const auditPrompt = `Du bist Senior Layout/UX Auditor für GrowHub (Cannabis Community App).

AUFGABE: Analysiere Layout, Mobile UX, Safe-Area, Glass-Effects, Performance komplett.

Prüfe gezielt:
1) iOS Safe-Area: vh vs svh/dvh, fehlende pb-[env(safe-area-inset-bottom)]
2) Tabs: overflow-x-auto, aria-roles, abgeschnittene Badges  
3) Glass/Blur: Kontrast-Probleme, z-index Konflikte
4) Performance: CLS, fehlende loading="lazy", keine Virtualisierung
5) Touch-Targets: <44px Buttons, fehlende focus-visible
6) Processing Overlays: blockieren Bottom-Nav, keine Auto-Dismiss

Finde min. 10 Issues mit file:line, snippet, mini-diff, severity(H/M/L), confidence(0-1).`;

        const response = await InvokeLLM({
            prompt: auditPrompt,
            response_json_schema: {
                "type": "object",
                "required": ["summary", "issues", "device_matrix", "quick_fixes"],
                "properties": {
                    "summary": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
                    "issues": {
                        "type": "array",
                        "minItems": 8,
                        "items": {
                            "type": "object",
                            "required": ["file", "line", "category", "diagnose", "severity", "confidence"],
                            "properties": {
                                "file": {"type": "string"},
                                "line": {"type": "integer"},
                                "category": {"type": "string"},
                                "diagnose": {"type": "string"},
                                "snippet": {"type": "string"},
                                "fix_mini_diff": {"type": "string"},
                                "severity": {"type": "string", "enum": ["H", "M", "L"]},
                                "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                            }
                        }
                    },
                    "device_matrix": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "width": {"type": "integer"},
                                "findings": {"type": "array", "items": {"type": "string"}}
                            }
                        }
                    },
                    "quick_fixes": {"type": "array", "items": {"type": "string"}, "minItems": 5}
                }
            }
        });

        let patchResults = null;

        if (apply_patches && response.issues && response.issues.length > 0) {
            const highMediumIssues = response.issues.filter(i => ['H', 'M'].includes(i.severity));
            
            if (highMediumIssues.length > 0) {
                const patchPrompt = `Erzeuge Patches für diese Layout Issues. Nur UI/CSS Änderungen, keine Logik.

Issues: ${JSON.stringify(highMediumIssues.slice(0, 5), null, 2)}

Regeln:
- Safe-Area: min-h-screen → min-h-dvh md:min-h-screen
- Tabs: + overflow-x-auto + aria-selected
- Touch: h-8 → h-11 min-w-[44px]
- Glass: bg-opacity erhöhen für besseren Kontrast`;

                try {
                    patchResults = await InvokeLLM({
                        prompt: patchPrompt,
                        response_json_schema: {
                            "type": "object",
                            "required": ["patches"],
                            "properties": {
                                "patches": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "file": {"type": "string"},
                                            "diff": {"type": "string"},
                                            "why": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    });
                } catch (patchError) {
                    console.warn('Patch generation failed:', patchError);
                    patchResults = { error: 'Patch generation failed' };
                }
            }
        }

        return Response.json({
            success: true,
            layout_audit: response,
            patches: patchResults,
            stats: {
                total_issues: response.issues?.length || 0,
                high_severity: response.issues?.filter(i => i.severity === 'H').length || 0,
                medium_severity: response.issues?.filter(i => i.severity === 'M').length || 0,
                low_severity: response.issues?.filter(i => i.severity === 'L').length || 0
            }
        });

    } catch (error) {
        console.error('Layout audit failed:', error);
        return Response.json({
            error: 'Layout audit failed',
            details: error.message
        }, { status: 500 });
    }
});