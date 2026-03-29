
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { diaryId } = await req.json();

    if (!diaryId) {
      return Response.json({ error: 'Missing diaryId' }, { status: 400 });
    }

    // Tagebuch laden
    const diaries = await base44.entities.GrowDiary.filter({ id: diaryId });
    if (!diaries || diaries.length === 0) {
      return Response.json({ error: 'Diary not found' }, { status: 404 });
    }

    const diary = diaries[0];

    // Prüfen ob Owner
    if (diary.created_by !== user.email) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Einträge laden
    const entries = await base44.entities.GrowDiaryEntry.filter(
      { diary_id: diaryId },
      'day_number',
      1000
    );

    // PDF erstellen
    const doc = new jsPDF();
    let yPos = 20;

    // === DECKBLATT ===
    doc.setFontSize(28);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(diary.name, 20, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Sorte: ${diary.strain_name}`, 20, yPos);
    yPos += 8;

    doc.text(`Start: ${new Date(diary.start_date).toLocaleDateString('de-DE')}`, 20, yPos);
    yPos += 8;

    doc.text(`Methode: ${diary.setup_type} - ${diary.grow_method}`, 20, yPos);
    yPos += 8;

    doc.text(`Status: ${diary.status}`, 20, yPos);
    yPos += 15;

    // === STATISTIKEN ===
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Statistiken', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    
    const stats = diary.stats || {};
    doc.text(`Gesamte Tage: ${stats.total_days || 0}`, 20, yPos);
    yPos += 6;
    doc.text(`Einträge: ${entries.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Fotos: ${stats.total_photos || 0}`, 20, yPos);
    yPos += 6;
    
    if (stats.avg_temp) {
      doc.text(`Ø Temperatur: ${stats.avg_temp.toFixed(1)}°C`, 20, yPos);
      yPos += 6;
    }
    
    if (stats.avg_humidity) {
      doc.text(`Ø Luftfeuchtigkeit: ${stats.avg_humidity.toFixed(1)}%`, 20, yPos);
      yPos += 6;
    }

    yPos += 10;

    // === KI-INSIGHTS ===
    if (diary.ai_insights) {
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('KI-Analyse', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);

      doc.text(`Gesundheitsscore: ${diary.ai_insights.health_score || 100}/100`, 20, yPos);
      yPos += 8;

      if (diary.ai_insights.last_analysis_summary) {
        const lines = doc.splitTextToSize(diary.ai_insights.last_analysis_summary, 170);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 6 + 5;
      }
    }

    // === CHRONIK ===
    doc.addPage();
    yPos = 20;

    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94);
    doc.text('Grow-Chronik', 20, yPos);
    yPos += 15;

    for (const entry of entries) {
      // Neue Seite wenn nötig
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Tag-Header
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Tag ${entry.day_number} - ${entry.growth_stage}`, 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(new Date(entry.entry_date).toLocaleDateString('de-DE'), 20, yPos);
      yPos += 8;

      // Beobachtung
      if (entry.plant_observation) {
        doc.setTextColor(60, 60, 60);
        const obsLines = doc.splitTextToSize(entry.plant_observation, 170);
        doc.text(obsLines, 20, yPos);
        yPos += obsLines.length * 5 + 3;
      }

      // Umweltdaten
      if (entry.environment_data) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        
        const envData = [];
        if (entry.environment_data.temp_c) envData.push(`Temp: ${entry.environment_data.temp_c}°C`);
        if (entry.environment_data.humidity_rh) envData.push(`RH: ${entry.environment_data.humidity_rh}%`);
        if (entry.environment_data.light_schedule) envData.push(`Licht: ${entry.environment_data.light_schedule}`);
        
        if (envData.length > 0) {
          doc.text(envData.join(' | '), 20, yPos);
          yPos += 5;
        }
      }

      // Fütterung
      if (entry.feeding_data) {
        doc.setFontSize(9);
        const feedData = [];
        if (entry.feeding_data.water_ml) feedData.push(`${entry.feeding_data.water_ml}ml Wasser`);
        
        // ✅ FIX: Typo 'entry.feeding' zu 'entry.feeding_data' korrigiert
        if (entry.feeding_data.ph) feedData.push(`pH ${entry.feeding_data.ph}`);
        
        if (entry.feeding_data.ec_ppm) feedData.push(`EC ${entry.feeding_data.ec_ppm}`);
        
        if (feedData.length > 0) {
          doc.text(feedData.join(' | '), 20, yPos);
          yPos += 5;
        }
      }

      // Aktionen
      if (entry.actions_taken && entry.actions_taken.length > 0) {
        doc.setTextColor(34, 197, 94);
        doc.text(`✓ ${entry.actions_taken.join(', ')}`, 20, yPos);
        yPos += 5;
      }

      // KI-Analyse
      if (entry.ai_analysis && entry.ai_analysis.health_assessment) {
        doc.setTextColor(100, 100, 255);
        doc.text(`KI: ${entry.ai_analysis.health_assessment}`, 20, yPos);
        yPos += 5;

        if (entry.ai_analysis.detected_issues && entry.ai_analysis.detected_issues.length > 0) {
          doc.setTextColor(255, 100, 100);
          doc.text(`⚠ ${entry.ai_analysis.detected_issues.map(i => i.issue_type).join(', ')}`, 20, yPos);
          yPos += 5;
        }
      }

      yPos += 8; // Abstand zum nächsten Eintrag
    }

    // === FOOTER auf jeder Seite ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Erstellt mit GrowHub | Seite ${i} von ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // PDF als ArrayBuffer
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${diary.name.replace(/[^a-zA-Z0-9]/g, '_')}_grow_report.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF export error:', error);
    return Response.json({ 
      error: error.message || 'Export failed' 
    }, { status: 500 });
  }
});
