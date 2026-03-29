
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

// 🌱 GROW COACH ANALYSIS - INTELLIGENTE GROW-BEGLEITUNG
const GROW_STAGES = {
  Keimung: { minDays: 1, maxDays: 7, nextStage: 'Sämling' },
  'Sämling': { minDays: 7, maxDays: 21, nextStage: 'Wachstum' },
  'Wachstum': { minDays: 21, maxDays: 70, nextStage: 'Blüte' },
  'Blüte': { minDays: 42, maxDays: 84, nextStage: 'Ernte' },
  'Ernte': { minDays: 1, maxDays: 3, nextStage: null }
};

const STAGE_PRIORITIES = {
  'Keimung': [
    'Temperatur 22-25°C halten',
    'Luftfeuchtigkeit 70-80%',
    'Substrat feucht aber nicht nass',
    'Kein direktes Licht nötig'
  ],
  'Sämling': [
    'Sanftes 18/6 Lichtregime starten',
    'Erste echte Blätter beobachten', 
    'Vorsichtig gießen - Staunässe vermeiden',
    'Luftzirkulation gewährleisten'
  ],
  'Wachstum': [
    'LST oder Topping erwägen',
    'Nährstoffe langsam steigern',
    'Starkes vegetatives Licht',
    'Regelmäßige Wassergaben'
  ],
  'Blüte': [
    'Lichtregime auf 12/12 umstellen',
    'Phosphor-reiche Nährstoffe',
    'Luftfeuchtigkeit reduzieren (40-50%)',
    'Trichome regelmäßig checken'
  ],
  'Ernte': [
    'Trichome mit Lupe kontrollieren',
    'Spülung 1-2 Wochen vorher',
    'Optimale Erntebedingungen warten',
    'Trocknungsraum vorbereiten'
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        ok: false,
        error: 'authentication_required'
      }, { status: 401 });
    }

    const { diary_id, action = 'analyze' } = await req.json();

    if (!diary_id) {
      return Response.json({
        ok: false,
        error: 'diary_id required'
      }, { status: 400 });
    }

    console.log(`🌱 GrowCoach: ${action} for diary ${diary_id}`);

    // Load grow diary and all entries
    const diaries = await base44.entities.GrowDiary.filter({ id: diary_id });
    if (diaries.length === 0) {
      return Response.json({
        ok: false,
        error: 'diary_not_found'
      }, { status: 404 });
    }

    const diary = diaries[0];
    const entries = await base44.entities.GrowDiaryEntry.filter({ diary_id }, 'day_number', 500);

    // Analyze current state
    const analysis = analyzeGrowProgress(diary, entries); // Removed await since function is not async
    
    // Generate coaching recommendations
    const coaching = await generateCoachingAdvice(diary, entries, analysis, base44);

    return Response.json({
      ok: true,
      diary_id,
      analysis,
      coaching,
      next_actions: coaching.immediate_actions,
      schedule: coaching.upcoming_tasks
    });

  } catch (error) {
    console.error('🚨 GrowCoach Analysis Error:', error);
    
    return Response.json({
      ok: false,
      error: 'analysis_failed',
      message: error.message
    }, { status: 500 });
  }
});

// Removed async keyword since no await is needed
function analyzeGrowProgress(diary, entries) {
  const startDate = new Date(diary.start_date);
  const currentDate = new Date();
  const totalDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Find latest entry to determine current stage
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const currentStage = latestEntry?.growth_stage || 'Keimung';
  
  // Calculate stage progress
  const stageConfig = GROW_STAGES[currentStage];
  const stageProgress = stageConfig ? 
    Math.min((totalDays / stageConfig.maxDays) * 100, 100) : 0;

  // Analyze trends from recent entries
  const recentEntries = entries.slice(-7); // Last 7 entries
  const trends = analyzeTrends(recentEntries);
  
  // Check for potential issues
  const issues = identifyIssues(entries, currentStage);
  
  return {
    total_days: totalDays,
    current_stage: currentStage,
    stage_progress: Math.round(stageProgress),
    next_stage: stageConfig?.nextStage,
    entries_count: entries.length,
    recent_trends: trends,
    potential_issues: issues,
    health_score: calculateHealthScore(entries, issues)
  };
}

function analyzeTrends(recentEntries) {
  if (recentEntries.length < 2) return {};

  const trends = {};
  
  // Temperature trend
  const temps = recentEntries
    .map(e => e.environment_data?.temp_c)
    .filter(t => typeof t === 'number');
  if (temps.length >= 2) {
    // Ensure slice has enough elements before computing average
    const avgRecent = temps.slice(Math.max(0, temps.length - 3)).reduce((a, b) => a + b, 0) / Math.min(3, temps.length);
    const avgEarlier = temps.slice(0, Math.min(3, temps.length)).reduce((a, b) => a + b, 0) / Math.min(3, temps.length);
    if (avgRecent > avgEarlier) {
      trends.temperature = 'steigend';
    } else if (avgRecent < avgEarlier) {
      trends.temperature = 'fallend';
    } else {
      trends.temperature = 'konstant';
    }
  }

  // Humidity trend  
  const humidity = recentEntries
    .map(e => e.environment_data?.humidity_rh)
    .filter(h => typeof h === 'number');
  if (humidity.length >= 2) {
    // Ensure slice has enough elements before computing average
    const avgRecent = humidity.slice(Math.max(0, humidity.length - 3)).reduce((a, b) => a + b, 0) / Math.min(3, humidity.length);
    const avgEarlier = humidity.slice(0, Math.min(3, humidity.length)).reduce((a, b) => a + b, 0) / Math.min(3, humidity.length);
    if (avgRecent > avgEarlier) {
      trends.humidity = 'steigend';
    } else if (avgRecent < avgEarlier) {
      trends.humidity = 'fallend';
    } else {
      trends.humidity = 'konstant';
    }
  }

  return trends;
}

function identifyIssues(entries, currentStage) {
  const issues = [];
  const recentEntries = entries.slice(-5);
  
  // Check for environmental issues
  recentEntries.forEach(entry => {
    const env = entry.environment_data;
    if (!env) return;

    // Temperature issues
    if (env.temp_c) {
      if (env.temp_c < 18) issues.push({
        type: 'temperature',
        severity: 'high',
        message: `Temperatur zu niedrig (${env.temp_c}°C) - Optimal: 20-26°C`,
        day: entry.day_number
      });
      if (env.temp_c > 30) issues.push({
        type: 'temperature', 
        severity: 'high',
        message: `Temperatur zu hoch (${env.temp_c}°C) - Hitzestress möglich`,
        day: entry.day_number
      });
    }

    // Humidity issues
    if (env.humidity_rh) {
      if (currentStage === 'Blüte' && env.humidity_rh > 60) {
        issues.push({
          type: 'humidity',
          severity: 'medium', 
          message: `Luftfeuchtigkeit zu hoch für Blüte (${env.humidity_rh}%) - Schimmelrisiko`,
          day: entry.day_number
        });
      }
      if (currentStage === 'Keimung' && env.humidity_rh < 65) {
        issues.push({
          type: 'humidity',
          severity: 'medium',
          message: `Luftfeuchtigkeit zu niedrig für Keimung (${env.humidity_rh}%) - Ideal: 70-80%`,
          day: entry.day_number
        });
      }
    }
  });

  // Check for missing entries (gaps in logging)
  if (entries.length > 0) {
    const latestEntry = entries[entries.length - 1];
    const daysSinceLastEntry = Math.floor((Date.now() - new Date(latestEntry.created_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastEntry > 3) {
      issues.push({
        type: 'logging',
        severity: 'low',
        message: `Kein Tagebuch-Eintrag seit ${daysSinceLastEntry} Tagen - regelmäßige Dokumentation wichtig`,
        day: latestEntry.day_number
      });
    }
  }

  return issues;
}

function calculateHealthScore(entries, issues) {
  let score = 100;
  
  // Deduct points for issues
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'high': score -= 15; break;
      case 'medium': score -= 8; break;  
      case 'low': score -= 3; break;
    }
  });
  
  // Bonus for consistent logging
  if (entries.length > 10) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

async function generateCoachingAdvice(diary, entries, analysis, base44) {
  const currentStage = analysis.current_stage;
  const stagePriorities = STAGE_PRIORITIES[currentStage] || [];
  
  // Get strain-specific advice
  let strainAdvice = [];
  if (diary.strain_name) {
    try {
      const strains = await base44.entities.Strain.filter({ name: diary.strain_name });
      if (strains.length > 0) {
        const strain = strains[0];
        strainAdvice = generateStrainSpecificAdvice(strain, currentStage);
      }
    } catch (error) {
      console.warn('Could not load strain data:', error);
    }
  }

  // Generate immediate actions based on current state and issues
  const immediateActions = [...stagePriorities];
  
  analysis.potential_issues.forEach(issue => {
    if (issue.severity === 'high') {
      immediateActions.unshift(`DRINGEND: ${issue.message}`);
    } else if (issue.severity === 'medium') {
      immediateActions.push(`ACHTUNG: ${issue.message}`);
    }
  });

  // Plan upcoming tasks based on stage and progress
  const upcomingTasks = planUpcomingTasks(analysis, diary);

  // Personalized encouragement based on progress
  const encouragement = generateEncouragement(analysis, entries);

  return {
    immediate_actions: immediateActions.slice(0, 5), // Top 5 priorities
    strain_specific: strainAdvice,
    upcoming_tasks: upcomingTasks,
    encouragement,
    health_assessment: {
      score: analysis.health_score,
      message: getHealthMessage(analysis.health_score)
    }
  };
}

function generateStrainSpecificAdvice(strain, currentStage) {
  const advice = [];
  
  if (strain.growing) {
    // Difficulty-based advice
    if (strain.growing.difficulty === 'beginner' && currentStage === 'Wachstum') {
      advice.push('🌿 Einfacher Strain - perfekt zum Lernen! Weniger ist oft mehr.');
    }
    
    if (strain.growing.difficulty === 'expert' && currentStage === 'Blüte') {
      advice.push('🎯 Experten-Strain - achte besonders auf Luftfeuchtigkeit und Nährstoff-Balance.');
    }

    // Flowering time advice
    if (strain.growing.flowering_time_days && currentStage === 'Blüte') {
      advice.push(`⏰ Blütezeit ca. ${strain.growing.flowering_time_days} Tage - plane Ernte entsprechend.`);
    }

    // Training methods
    if (strain.growing.training_methods && currentStage === 'Wachstum') {
      advice.push(`🏋️ Empfohlene Techniken: ${strain.growing.training_methods.join(', ')}`);
    }
  }

  return advice;
}

function planUpcomingTasks(analysis, diary) {
  const tasks = [];
  const currentStage = analysis.current_stage;
  const stageConfig = GROW_STAGES[currentStage];
  
  // Stage transition planning
  if (stageConfig?.nextStage && analysis.stage_progress > 80) {
    tasks.push({
      type: 'stage_transition',
      message: `Bereite dich auf ${stageConfig.nextStage} vor`,
      days_ahead: Math.max(1, stageConfig.maxDays - analysis.total_days),
      priority: 'high'
    });
  }

  // Routine tasks based on stage
  switch (currentStage) {
    case 'Wachstum':
      tasks.push({
        type: 'training',
        message: 'LST oder Topping erwägen (Woche 3-4)',
        days_ahead: 7,
        priority: 'medium'
      });
      tasks.push({
        type: 'nutrients',
        message: 'Nährstoffdosis langsam steigern',
        days_ahead: 3,
        priority: 'medium'
      });
      break;
    case 'Blüte':
      tasks.push({
        type: 'monitoring',
        message: 'Trichome mit Lupe kontrollieren (ab Woche 6)',
        days_ahead: 3,
        priority: 'high'
      });
      tasks.push({
        type: 'environment',
        message: 'Luftfeuchtigkeit auf 40-50% reduzieren',
        days_ahead: 1,
        priority: 'high'
      });
      break;
    case 'Ernte':
      tasks.push({
        type: 'harvest_prep',
        message: 'Trocknungsraum vorbereiten',
        days_ahead: 1,
        priority: 'high'
      });
      break;
  }

  return tasks.slice(0, 3);
}

function generateEncouragement(analysis, entries) {
  const messages = [];
  
  if (analysis.health_score >= 80) {
    messages.push('🌟 Hervorragende Arbeit! Deine Pflanzen entwickeln sich prächtig.');
  } else if (analysis.health_score >= 60) {
    messages.push('👍 Solide Fortschritte! Ein paar kleine Anpassungen und es wird noch besser.');
  } else {
    messages.push('💪 Keine Sorge - jeder Grower lernt dazu. Die nächsten Anpassungen werden helfen!');
  }

  if (entries.length > 20) {
    messages.push('📊 Deine konsequente Dokumentation zahlt sich aus - super Tagebuch!');
  } else if (entries.length > 5) {
    messages.push('📝 Bleib dran mit den Einträgen, so siehst du die Entwicklung am besten!');
  }

  // Add stage-specific encouragement
  switch (analysis.current_stage) {
    case 'Keimung':
      messages.push('🌱 Der Start ist geschafft! Jetzt heißt es Geduld bewahren.');
      break;
    case 'Sämling':
      messages.push('🌿 Deine kleinen Sämlinge strecken sich dem Licht entgegen - gute Zeichen!');
      break;
    case 'Wachstum':
      messages.push('🌳 Deine Pflanze legt ordentlich zu - bald ist Blütezeit!');
      break;
    case 'Blüte':
      messages.push('🌸 Die Blüten entwickeln sich prächtig - die Arbeit wird sich lohnen!');
      break;
    case 'Ernte':
      messages.push('🎉 Fast geschafft! Die Ernte ist der süße Lohn deiner Mühen.');
      break;
  }


  return messages[Math.floor(Math.random() * messages.length)];
}

function getHealthMessage(score) {
  if (score >= 90) return 'Perfekter Grow! 🌟';
  if (score >= 80) return 'Sehr guter Zustand 💚'; 
  if (score >= 70) return 'Guter Fortschritt 👍';
  if (score >= 60) return 'Moderate Probleme 🟡';
  if (score >= 50) return 'Aufmerksamkeit nötig ⚠️';
  return 'Sofortmaßnahmen erforderlich! 🚨';
}
