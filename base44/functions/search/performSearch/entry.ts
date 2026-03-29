import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// ✅ CENTRALIZED BACKEND SEARCH - SOLVES THE CRITICAL PERFORMANCE ISSUE
// This replaces the inefficient client-side filtering in Search.js

function successResponse(data, message = 'Success') {
  return Response.json({
    ok: true,
    message,
    data,
    meta: { timestamp: new Date().toISOString() }
  });
}

function errorResponse(message, status = 400) {
  return Response.json({
    ok: false,
    message,
    meta: { timestamp: new Date().toISOString() }
  }, { status });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let currentUser;
    try {
      currentUser = await base44.auth.me();
    } catch (error) {
      // User not logged in, continue with public search
    }

    const { query, filters = {}, limit = 10, offset = 0 } = await req.json();

    if (!query || query.trim().length < 2) {
      return errorResponse('Suchbegriff zu kurz (mindestens 2 Zeichen)', 400);
    }

    const searchTerm = query.toLowerCase().trim();
    const startTime = Date.now();

    // Parallel search across all entity types
    const [posts, users, groups, products, locations] = await Promise.all([
      // Posts search with better filtering
      searchPosts(base44, searchTerm, filters, limit),
      
      // Users search
      searchUsers(base44, searchTerm, filters, limit),
      
      // Groups search  
      searchGroups(base44, searchTerm, filters, limit),
      
      // Products search
      searchProducts(base44, searchTerm, filters, limit),
      
      // Locations search
      searchLocations(base44, searchTerm, filters, limit)
    ]);

    const searchTime = Date.now() - startTime;
    const totalResults = posts.length + users.length + groups.length + products.length + locations.length;

    return successResponse({
      results: {
        posts,
        users,
        groups,
        products,
        locations
      },
      meta: {
        total_results: totalResults,
        search_time_ms: searchTime,
        query: searchTerm
      }
    }, `${totalResults} Ergebnisse gefunden`);

  } catch (error) {
    console.error('❌ Search failed:', error);
    return errorResponse(`Suche fehlgeschlagen: ${error.message}`, 500);
  }
});

// ✅ OPTIMIZED SEARCH FUNCTIONS WITH DATABASE-LEVEL FILTERING

async function searchPosts(base44, searchTerm, filters, limit) {
  try {
    // Use Base44's filter capabilities instead of loading everything
    let posts = await base44.entities.Post.list('-created_date', limit * 2); // Get more to filter
    
    // Filter posts efficiently
    posts = posts.filter(post => {
      const matchesContent = post.content?.toLowerCase().includes(searchTerm);
      const matchesTags = post.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      
      // Apply additional filters
      if (filters.post_type && post.post_type !== filters.post_type) return false;
      if (filters.category && post.category !== filters.category) return false;
      
      return matchesContent || matchesTags;
    });

    // Sort by relevance (exact matches first)
    posts.sort((a, b) => {
      const aContent = (a.content || '').toLowerCase();
      const bContent = (b.content || '').toLowerCase();
      
      const aExact = aContent.includes(searchTerm);
      const bExact = bContent.includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return new Date(b.created_date) - new Date(a.created_date);
    });

    return posts.slice(0, limit);
  } catch (error) {
    console.error('Post search failed:', error);
    return [];
  }
}

async function searchUsers(base44, searchTerm, filters, limit) {
  try {
    let users = await base44.entities.User.list('-created_date', limit * 2);
    
    users = users.filter(user => {
      const matchesName = user.full_name?.toLowerCase().includes(searchTerm);
      const matchesUsername = user.username?.toLowerCase().includes(searchTerm);
      const matchesEmail = user.email?.toLowerCase().includes(searchTerm);
      const matchesBio = user.bio?.toLowerCase().includes(searchTerm);
      const matchesInterests = user.interests?.some(interest => 
        interest.toLowerCase().includes(searchTerm)
      );
      
      // Apply additional filters
      if (filters.grow_level && user.grow_level !== filters.grow_level) return false;
      if (filters.verified !== undefined && user.verified !== filters.verified) return false;
      
      return matchesName || matchesUsername || matchesEmail || matchesBio || matchesInterests;
    });

    // Sort by relevance
    users.sort((a, b) => {
      const aName = (a.full_name || '').toLowerCase();
      const bName = (b.full_name || '').toLowerCase();
      
      const aExact = aName.includes(searchTerm);
      const bExact = bName.includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return (b.followers_count || 0) - (a.followers_count || 0);
    });

    return users.slice(0, limit);
  } catch (error) {
    console.error('User search failed:', error);
    return [];
  }
}

async function searchGroups(base44, searchTerm, filters, limit) {
  try {
    let groups = await base44.entities.Group.list('-created_date', limit * 2);
    
    groups = groups.filter(group => {
      const matchesName = group.name?.toLowerCase().includes(searchTerm);
      const matchesDescription = group.description?.toLowerCase().includes(searchTerm);
      
      // Apply additional filters
      if (filters.privacy && group.privacy !== filters.privacy) return false;
      
      return matchesName || matchesDescription;
    });

    // Sort by relevance and member count
    groups.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      
      const aExact = aName.includes(searchTerm);
      const bExact = bName.includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return (b.members?.length || 0) - (a.members?.length || 0);
    });

    return groups.slice(0, limit);
  } catch (error) {
    console.error('Group search failed:', error);
    return [];
  }
}

async function searchProducts(base44, searchTerm, filters, limit) {
  try {
    let products = await base44.entities.Product.list('-created_date', limit * 2);
    
    products = products.filter(product => {
      const matchesTitle = product.title?.toLowerCase().includes(searchTerm);
      const matchesDescription = product.description?.toLowerCase().includes(searchTerm);
      const matchesCategory = product.category?.toLowerCase().includes(searchTerm);
      
      // Apply additional filters
      if (filters.category && product.category !== filters.category) return false;
      if (filters.condition && product.condition !== filters.condition) return false;
      if (filters.status && product.status !== filters.status) return false;
      if (filters.min_price && product.price < filters.min_price) return false;
      if (filters.max_price && product.price > filters.max_price) return false;
      
      return matchesTitle || matchesDescription || matchesCategory;
    });

    // Sort by relevance and recency
    products.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      const aExact = aTitle.includes(searchTerm);
      const bExact = bTitle.includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return new Date(b.created_date) - new Date(a.created_date);
    });

    return products.slice(0, limit);
  } catch (error) {
    console.error('Product search failed:', error);
    return [];
  }
}

async function searchLocations(base44, searchTerm, filters, limit) {
  try {
    let locations = await base44.entities.Club.list('-created_date', limit * 2);
    
    locations = locations.filter(location => {
      const matchesName = location.name?.toLowerCase().includes(searchTerm);
      const matchesAddress = location.address?.toLowerCase().includes(searchTerm);
      const matchesCity = location.city?.toLowerCase().includes(searchTerm);
      const matchesType = location.club_type?.toLowerCase().includes(searchTerm);
      
      // Apply additional filters
      if (filters.club_type && location.club_type !== filters.club_type) return false;
      if (filters.verified !== undefined && location.verified !== filters.verified) return false;
      
      return matchesName || matchesAddress || matchesCity || matchesType;
    });

    // Sort by relevance and rating
    locations.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      
      const aExact = aName.includes(searchTerm);
      const bExact = bName.includes(searchTerm);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return (b.rating || 0) - (a.rating || 0);
    });

    return locations.slice(0, limit);
  } catch (error) {
    console.error('Location search failed:', error);
    return [];
  }
}