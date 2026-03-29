import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🌿 GET STRAIN CONTEXT
 * Liefert relevante Strain-Informationen für den Grow Master
 */

export async function getStrainContext(base44, strainName) {
  if (!strainName) return null;

  try {
    console.log(`🌿 Fetching strain context for: ${strainName}`);

    // Suche nach Strain (case-insensitive)
    const strains = await base44.asServiceRole.entities.Strain.filter({
      $or: [
        { name: { $regex: strainName, $options: 'i' } },
        { alias: { $in: [strainName] } }
      ]
    }, null, 1);

    if (strains.length === 0) {
      return {
        found: false,
        message: `Keine Strain-Daten für "${strainName}" gefunden.`
      };
    }

    const strain = strains[0];

    // Formatiere Strain-Infos für LLM
    return {
      found: true,
      data: {
        name: strain.name,
        alias: strain.alias || [],
        type: strain.type,
        genetics: strain.genetics,
        indica_percent: strain.indicaPercent,
        sativa_percent: strain.sativaPercent,
        thc: strain.thc,
        cbd: strain.cbd,
        effects: strain.effects || {},
        medical_use: strain.medical_use || {},
        flavor: strain.flavor || [],
        aroma: strain.aroma || [],
        growing: {
          difficulty: strain.growing?.difficulty,
          flowering_time: strain.growing?.flowering_time_days,
          yield: strain.growing?.yield,
          smell_control: strain.growing?.smell_control,
          mold_resistance: strain.growing?.mold_resistance,
          training_methods: strain.growing?.training_methods || []
        },
        suitable_for_beginners: strain.suitable_for_beginners,
        recommended_use: strain.recommended_use || []
      },
      summary: `${strain.name} ist eine ${strain.type}-dominante Sorte mit ${strain.indicaPercent}% Indica und ${strain.sativaPercent}% Sativa. THC: ${JSON.stringify(strain.thc)}, CBD: ${strain.cbd}. Schwierigkeitsgrad: ${strain.growing?.difficulty || 'unbekannt'}, Blütezeit: ${strain.growing?.flowering_time_days || 'unbekannt'} Tage.`
    };

  } catch (error) {
    console.error('Error fetching strain context:', error);
    return {
      found: false,
      error: error.message
    };
  }
}