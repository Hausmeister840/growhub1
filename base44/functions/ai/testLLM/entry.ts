import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

// 🧪 LLM SELF-TEST - VERIFY NO THINKING ERRORS & JSON CAPABILITY
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow anonymous testing
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      console.log('Anonymous test request');
    }

    console.log('🧪 Starting LLM Self-Test...');

    const results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // Test 1: Basic text completion (Anthropic)
    try {
      const { invokeLLM } = await import('./invokeLLM.js');
      
      const textTest = await invokeLLM.default(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "What is 2+2? Answer in one word.",
          provider: "anthropic"
        })
      }));

      const textResult = await textTest.json();
      
      results.tests.push({
        name: "Anthropic Text Completion",
        passed: textResult.ok,
        result: textResult.ok ? "✅ Success" : `❌ ${textResult.error}`,
        data: textResult.data
      });
      
      if (textResult.ok) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Anthropic Text Completion",
        passed: false,
        result: `❌ Exception: ${error.message}`,
        data: null
      });
      results.summary.failed++;
    }
    results.summary.total++;

    // Test 2: JSON Schema Response (Anthropic)
    try {
      const { invokeLLM } = await import('./invokeLLM.js');
      
      const jsonTest = await invokeLLM.default(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Describe a cannabis strain briefly.",
          provider: "anthropic",
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["indica", "sativa", "hybrid"] },
              effects: { type: "array", items: { type: "string" } }
            },
            required: ["name", "type"]
          }
        })
      }));

      const jsonResult = await jsonTest.json();
      
      const isValidJSON = jsonResult.ok && 
        typeof jsonResult.data === 'object' && 
        jsonResult.data.name && 
        jsonResult.data.type;

      results.tests.push({
        name: "Anthropic JSON Schema",
        passed: isValidJSON,
        result: isValidJSON ? "✅ Valid JSON Response" : `❌ Invalid JSON: ${JSON.stringify(jsonResult)}`,
        data: jsonResult.data
      });
      
      if (isValidJSON) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Anthropic JSON Schema", 
        passed: false,
        result: `❌ Exception: ${error.message}`,
        data: null
      });
      results.summary.failed++;
    }
    results.summary.total++;

    // Test 3: Error Recovery (Thinking Error Simulation)
    try {
      const { invokeLLM } = await import('./invokeLLM.js');
      
      // This should work even with potential thinking conflicts
      const errorTest = await invokeLLM.default(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Generate a simple response about cannabis growing tips.",
          provider: "anthropic",
          allowThinking: false, // Force thinking disabled
          response_json_schema: {
            type: "object",
            properties: {
              tip: { type: "string" },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "expert"] }
            },
            required: ["tip"]
          }
        })
      }));

      const errorResult = await errorTest.json();
      
      results.tests.push({
        name: "Error Recovery Test",
        passed: errorResult.ok,
        result: errorResult.ok ? "✅ No thinking errors" : `❌ ${errorResult.error}`,
        data: errorResult.data
      });
      
      if (errorResult.ok) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Error Recovery Test",
        passed: false,
        result: `❌ Exception: ${error.message}`,
        data: null
      });
      results.summary.failed++;
    }
    results.summary.total++;

    // Test 4: Performance Test
    const performanceStart = Date.now();
    try {
      const { invokeLLM } = await import('./invokeLLM.js');
      
      const perfTest = await invokeLLM.default(new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Quick response: best cannabis strain for beginners?",
          provider: "anthropic",
          max_tokens: 100
        })
      }));

      const performanceEnd = Date.now();
      const duration = performanceEnd - performanceStart;
      
      const perfResult = await perfTest.json();
      
      results.tests.push({
        name: "Performance Test",
        passed: perfResult.ok && duration < 10000,
        result: perfResult.ok ? `✅ Completed in ${duration}ms` : `❌ ${perfResult.error}`,
        data: { duration_ms: duration, response: perfResult.data }
      });
      
      if (perfResult.ok && duration < 10000) results.summary.passed++;
      else results.summary.failed++;
    } catch (error) {
      results.tests.push({
        name: "Performance Test",
        passed: false,
        result: `❌ Exception: ${error.message}`,
        data: null
      });
      results.summary.failed++;
    }
    results.summary.total++;

    // Final assessment
    const successRate = (results.summary.passed / results.summary.total) * 100;
    
    results.assessment = {
      success_rate: successRate,
      status: successRate >= 75 ? "🟢 HEALTHY" : successRate >= 50 ? "🟡 WARNING" : "🔴 CRITICAL",
      recommendation: successRate >= 75 ? 
        "LLM integration is working properly" :
        successRate >= 50 ?
        "Some issues detected, monitor closely" :
        "Multiple failures - requires immediate attention"
    };

    console.log(`🧪 LLM Self-Test Complete: ${results.summary.passed}/${results.summary.total} passed (${successRate.toFixed(1)}%)`);

    return Response.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ LLM Self-Test Error:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      assessment: {
        status: "🔴 CRITICAL",
        recommendation: "Self-test failed to execute - check LLM integration"
      }
    });
  }
});