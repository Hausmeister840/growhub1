/**
 * Search Service
 * Advanced search with indexing, ranking, and fuzzy matching
 */

class SearchService {
  constructor() {
    this.index = new Map();
    this.searchHistory = [];
    this.maxHistory = 20;
  }

  /**
   * Build search index
   */
  buildIndex(items, fields = ['content', 'title', 'name']) {
    items.forEach(item => {
      if (!item?.id) return;

      const searchableText = fields
        .map(field => item[field])
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      this.index.set(item.id, {
        item,
        searchText: searchableText,
        tokens: this.tokenize(searchableText)
      });
    });
  }

  /**
   * Tokenize text
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * Search with ranking
   */
  search(query, options = {}) {
    const {
      limit = 50,
      threshold = 0.3,
      fuzzy = true
    } = options;

    if (!query || query.length < 2) return [];

    const queryTokens = this.tokenize(query);
    const results = [];

    for (const [id, indexed] of this.index) {
      const score = this.calculateScore(queryTokens, indexed, fuzzy);
      
      if (score > threshold) {
        results.push({
          ...indexed.item,
          _searchScore: score
        });
      }
    }

    // Sort by score
    results.sort((a, b) => b._searchScore - a._searchScore);

    // Add to history
    this.addToHistory(query);

    return results.slice(0, limit);
  }

  /**
   * Calculate search score
   */
  calculateScore(queryTokens, indexed, fuzzy) {
    let score = 0;

    queryTokens.forEach(queryToken => {
      indexed.tokens.forEach(indexToken => {
        if (indexToken === queryToken) {
          score += 1.0;
        } else if (fuzzy && this.fuzzyMatch(queryToken, indexToken)) {
          score += 0.5;
        } else if (indexToken.includes(queryToken)) {
          score += 0.7;
        }
      });
    });

    return score / queryTokens.length;
  }

  /**
   * Fuzzy match (simple Levenshtein)
   */
  fuzzyMatch(str1, str2, threshold = 2) {
    const distance = this.levenshteinDistance(str1, str2);
    return distance <= threshold;
  }

  /**
   * Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Add to search history
   */
  addToHistory(query) {
    if (!query) return;

    this.searchHistory = [
      query,
      ...this.searchHistory.filter(q => q !== query)
    ].slice(0, this.maxHistory);
  }

  /**
   * Get search history
   */
  getHistory() {
    return [...this.searchHistory];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.searchHistory = [];
  }

  /**
   * Clear index
   */
  clearIndex() {
    this.index.clear();
  }
}

export default new SearchService();