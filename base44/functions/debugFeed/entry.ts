import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Try list
    const payload = await req.clone().json().catch(() => ({}));
    const listResult = await base44.asServiceRole.entities.Post.list('-created_date', 5);
    const listType = typeof listResult;
    const listIsArray = Array.isArray(listResult);
    const listLength = listIsArray ? listResult.length : 'N/A';
    const listKeys = listResult && typeof listResult === 'object' && !listIsArray ? Object.keys(listResult).slice(0, 10) : [];
    
    // Try to get first item
    let firstItem = null;
    if (listIsArray && listResult.length > 0) {
      firstItem = { 
        id: listResult[0].id, 
        status: listResult[0].status,
        topKeys: Object.keys(listResult[0]).slice(0, 15),
        hasDataProp: !!listResult[0].data,
        dataStatus: listResult[0].data?.status,
      };
    } else if (listResult && typeof listResult === 'object' && !listIsArray) {
      const vals = Object.values(listResult);
      if (vals.length > 0 && typeof vals[0] === 'object') {
        firstItem = { sample: JSON.stringify(vals[0]).slice(0, 200) };
      }
    }

    return Response.json({
      listType,
      listIsArray,
      listLength,
      listKeys,
      firstItem,
      rawSnippet: JSON.stringify(listResult).slice(0, 500),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
});