import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

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

    const { media_url, post_id = null, analysis_types = ['plant_diagnosis'] } = await req.json();

    if (!media_url) {
      return Response.json({
        ok: false,
        error: 'media_url_required'
      }, { status: 400 });
    }

    console.log(`🔍 Enqueuing media analysis for ${user.email}`);

    // Create media asset record
    const mediaAsset = await base44.entities.MediaAsset.create({
      owner_id: user.id,
      post_id,
      type: media_url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
      url: media_url,
      thumb_url: media_url // Use same URL as thumb for now
    });

    // Enqueue analysis jobs for each type requested
    const jobs = [];
    for (const analysisType of analysis_types) {
      const job = await base44.entities.AIJob.create({
        job_type: 'analyze_media',
        payload: {
          media_id: mediaAsset.id,
          media_url,
          analysis_type: analysisType,
          user_id: user.id
        },
        priority: 3 // Medium priority
      });

      jobs.push(job);
    }

    console.log(`✅ Enqueued ${jobs.length} analysis jobs for media ${mediaAsset.id}`);

    return Response.json({
      ok: true,
      media_id: mediaAsset.id,
      jobs: jobs.map(j => ({ id: j.id, type: j.payload.analysis_type })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enqueue analyze error:', error);
    
    return Response.json({
      ok: false,
      error: 'enqueue_failed',
      message: error.message
    }, { status: 500 });
  }
});