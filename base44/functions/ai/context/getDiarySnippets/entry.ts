import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 📔 GET DIARY SNIPPETS
 * Liefert relevante Grow-Tagebuch-Einträge für den Grow Master
 */

export async function getDiarySnippets(base44, userEmail, options = {}) {
  if (!userEmail) return [];

  try {
    console.log(`📔 Fetching diary snippets for: ${userEmail}`);

    const { 
      limit = 5, 
      diaryId = null,
      includeAIInsights = true 
    } = options;

    // Filter für Tagebücher
    const diaryFilter = { created_by: userEmail };
    if (diaryId) {
      diaryFilter.id = diaryId;
    }

    // Lade Tagebücher des Users
    const diaries = await base44.asServiceRole.entities.GrowDiary.filter(
      diaryFilter,
      '-updated_date',
      10
    );

    if (diaries.length === 0) {
      return {
        found: false,
        message: 'Keine Grow-Tagebücher gefunden.'
      };
    }

    // Für jedes Tagebuch die letzten Einträge holen
    const snippets = [];

    for (const diary of diaries.slice(0, 3)) {
      const entries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({
        diary_id: diary.id
      }, '-entry_date', limit);

      if (entries.length > 0) {
        const latestEntry = entries[0];
        
        snippets.push({
          diary_name: diary.name,
          diary_id: diary.id,
          strain: diary.strain_name,
          current_stage: diary.current_stage,
          days_since_start: diary.stats?.total_days || 0,
          status: diary.status,
          latest_entry: {
            day: latestEntry.day_number,
            stage: latestEntry.growth_stage,
            observation: latestEntry.plant_observation,
            height: latestEntry.plant_height_cm,
            environment: latestEntry.environment_data,
            ai_health: latestEntry.ai_analysis?.health_assessment,
            detected_issues: latestEntry.ai_analysis?.detected_issues || []
          },
          ai_insights: includeAIInsights ? {
            health_score: diary.ai_insights?.health_score,
            current_issues: diary.ai_insights?.current_issues || [],
            recommendations: diary.ai_insights?.recommendations || []
          } : null
        });
      }
    }

    return {
      found: true,
      count: snippets.length,
      data: snippets,
      summary: `Der Nutzer hat ${diaries.length} aktive Grow-Tagebücher. Aktuellstes: "${diaries[0].name}" (${diaries[0].strain_name}), Tag ${diaries[0].stats?.total_days || 0}, Phase: ${diaries[0].current_stage}.`
    };

  } catch (error) {
    console.error('Error fetching diary snippets:', error);
    return {
      found: false,
      error: error.message
    };
  }
}