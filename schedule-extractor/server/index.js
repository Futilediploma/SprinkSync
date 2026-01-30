const express = require('express');
const cors = require('cors');
const { Ollama } = require('ollama');
const NodeCache = require('node-cache');

const app = express();
const PORT = 3001;

// Initialize Ollama client
const ollama = new Ollama({ host: 'http://localhost:11434' });

// Cache for LLM responses (TTL: 1 hour)
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * Fire Protection Activity Classifier
 * Uses local LLM to intelligently identify FP work
 */
async function classifyActivity(activity, context = [], projectType = 'commercial') {
  const cacheKey = `${activity}_${context.join(',')}_${projectType}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit for:', activity.substring(0, 50));
    return cached;
  }

  const prompt = buildClassificationPrompt(activity, context, projectType);

  try {
    const response = await ollama.chat({
      model: 'llama3.2',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent results
        top_p: 0.9,
      }
    });

    const content = response.message.content.trim();

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes('```')) {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
    }

    const result = JSON.parse(jsonStr);

    // Validate response structure
    if (
      typeof result.is_fire_protection === 'boolean' &&
      typeof result.confidence === 'number' &&
      typeof result.reasoning === 'string'
    ) {
      // Cache the result
      cache.set(cacheKey, result);
      return result;
    } else {
      throw new Error('Invalid response structure from LLM');
    }
  } catch (error) {
    console.error('LLM classification error:', error);

    // Fallback to keyword-based classification
    return {
      is_fire_protection: false,
      confidence: 0.0,
      category: 'unknown',
      reasoning: 'LLM classification failed, using keyword fallback',
      suggestion: '',
      error: error.message
    };
  }
}

/**
 * Build enhanced classification prompt
 */
function buildClassificationPrompt(activity, context, projectType) {
  const contextStr = context.length > 0 
    ? `Context (surrounding activities): ${context.join(', ')}`
    : 'No surrounding context available';

  return `You are a fire protection scheduling expert analyzing construction activities.

Activity: "${activity}"
${contextStr}
Project Type: ${projectType}

Determine if this is fire protection/sprinkler work. Consider:

**CRITICAL - Design/Engineering vs Construction:**
- "Design", "Design System", "Design Development", "Engineering", "Delegated Design" = Design phase
- "Submittal", "Shop Drawings", "Coordination Drawings", "PREP & SUBMIT", "Submit" = Design/Pre-construction (category "design")
- "Review", "Approval", "Permit", "Permit Review", "[AHJ]", "REVIEW & APPROVE", "RECEIVE" = Design/Pre-construction (category "design")
- "FILE FOR PERMIT", "RECEIVE PERMIT", "RECEIVE FIRE PROTECTION PERMIT", "Permit Application" = category "design", phase "Design/Engineering"
- Mark these as category "design" and phase "Design/Engineering"
- These ARE fire protection activities (is_fire_protection=true) but in design phase, not construction
- DO NOT confuse "Permit Review" or "RECEIVE PERMIT" with "Testing" - permits are paperwork, not physical testing
- "Review by EOR" (Engineer of Record), "Review by GC" (General Contractor) = category "design"

**CRITICAL - Procurement vs Installation vs Testing:**
- "PROCURE", "Purchase", "Order", "Procurement" = category "equipment", phase "Mobilization" (acquiring materials/equipment)
- "SET", "Install", "Mount" (equipment like fire pumps, VESDA, valves) = category "equipment", phase "Mobilization" or specific phase
- "Mains", "Branch Lines", "Risers", "Piping", "Rough-in", "OH" (Overhead), "ROUGH-IN SPRINKLER" = INSTALLATION work (category "rough_in")
- "TEST POINTS", "Test", "Hydro", "Hydrostatic", "Flow Test", "Air Test", "HYDRO/VISUAL", "Inspect", "Inspection" = TESTING (category "testing", phase "Testing")
- DO NOT classify "PROCURE" as "Testing" - procurement is acquiring equipment before installation
- DO NOT classify installation activities as "Testing & Inspection"
- If activity mentions "Mains", "OH", or "ROUGH-IN" without "Test" or "Inspect", it's installation work

**CRITICAL - VESDA Systems (Very Early Smoke Detection):**
- "ROUGH-IN VESDA", "VESDA ROUGH-IN" = category "rough_in", phase "Overhead Rough-in" (installing detection pipes)
- "SET VESDA", "Install VESDA", "Mount VESDA" = category "equipment", phase "Equipment" (mounting detection units)
- "FINISH VESDA", "VESDA FINISH", "VESDA BELOW FLOOR", "VESDA TRIM" = category "trim_final", phase "Trim & Final"
- "TEST VESDA", "VESDA TEST" = category "testing", phase "Testing"
- VESDA is fire detection (smoke), so it IS fire protection work

**Fire Alarm Systems:**
- Fire alarm panels, pull stations, horns, strobes, notification devices = fire protection
- "Fire Alarm" activities ARE fire protection (is_fire_protection=true)
- Fire alarm rough-in, installation, testing all count as fire protection work

**MEP Context:**
- MEP rough-in often includes sprinkler piping
- "Overhead" or "OH" typically means above-ceiling sprinkler mains
- MEP coordination meetings may involve fire protection
- MEP inspections often include sprinkler system checks

**Spatial Indicators:**
- Floor levels (L1, L2, Level 3, etc.) indicate riser and branch line work
- "Ceiling work", "drop ceiling", "T-bar" may indicate sprinkler head installation
- "Underground" utilities may include fire service lines
- "Riser" work typically involves vertical fire protection piping

**Testing & Commissioning:**
- Hydro test, air test, flow test following rough-in suggest sprinkler systems
- "Flush" activities often relate to sprinkler system cleaning
- Pressure testing indicates sprinkler system verification

**Trade Sequencing:**
- Activities between "slab complete" and "MEP inspection" often include sprinklers
- Work scheduled after electrical rough but before drywall may be sprinkler trim
- Activities before "ceiling close-in" may include sprinkler rough-in

**Equipment:**
- Fire pumps, backflow preventers, FDC (Fire Department Connection)
- Standpipes, fire hydrants, fire alarm systems
- Sprinkler control valves, risers, mains

Classify the activity and respond with ONLY valid JSON in this exact format:
{
  "is_fire_protection": true or false,
  "confidence": 0.0 to 1.0,
  "category": "underground" | "rough_in" | "equipment" | "testing" | "inspection" | "trim_final" | "commissioning" | "design" | "unknown",
  "reasoning": "Detailed explanation of why this is or isn't fire protection work, referencing specific indicators",
  "suggestion": "Clean, professional activity name for fire protection work (e.g., 'Fire Protection System Design', 'Sprinkler Overhead Rough-in - Level 2', 'Fire Pump Installation'). Remove abbreviations, clarify ambiguous terms, use proper capitalization. Empty string if not fire protection.",
  "phase": "Design/Engineering" | "Mobilization" | "Underground" | "Overhead Rough-in" | "Testing" | "Inspections" | "Trim & Final" | "Commissioning" | "Unknown"
}

**IMPORTANT for 'suggestion' field:**
- Always provide a cleaned, professional name when is_fire_protection=true
- Expand abbreviations (MEP → Mechanical/Electrical/Plumbing, OH → Overhead, FP → Fire Protection)
- PRESERVE specific level/location info from the original (L3 → Level 3, B1 → Building 1, Admin → Administration Area)
- Use proper title case and standard fire protection terminology
- Be specific about the work type (rough-in, installation, testing, inspection, etc.)
- Include ALL location information when present (building, area, level)
- Make it immediately clear what sprinkler/fire protection work is being done
- DO NOT guess or invent level numbers - use exactly what's in the activity name

**Examples:**

Activity: "SDC-FIRE- Fire Protection - Design System"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "design",
  "reasoning": "This is fire protection system design work. While not physical construction, it's a critical part of the fire protection project lifecycle and should be tracked. The 'Design System' clearly indicates engineering/planning phase.",
  "suggestion": "Fire Protection System Design",
  "phase": "Design/Engineering"
}

Activity: "Fire Protection Submittal Review"
{
  "is_fire_protection": true,
  "confidence": 0.90,
  "category": "design",
  "reasoning": "This is fire protection related but in the submittal/approval phase. Important for tracking project progress through design and approval stages.",
  "suggestion": "Fire Protection Submittal Review & Approval",
  "phase": "Design/Engineering"
}

Activity: "SDC-FIRE- Fire Protection - Permit Review [AHJ]"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "design",
  "reasoning": "This is a permit review process with the Authority Having Jurisdiction (AHJ). This is pre-construction regulatory approval, not physical testing or construction work. The [AHJ] designation clearly indicates government/regulatory review.",
  "suggestion": "Fire Protection Permit Review & Approval",
  "phase": "Design/Engineering"
}

Activity: "PER- FILE FOR / RECEIVE FIRE PROTECTION PERMIT"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "design",
  "reasoning": "Filing for and receiving permits is administrative/regulatory work in the design/pre-construction phase. This is not physical construction or testing - it's paperwork and approvals necessary before construction can begin.",
  "suggestion": "File for Fire Protection Permit",
  "phase": "Design/Engineering"
}

Activity: "CFCI- PREP & SUBMIT FIRE SUPPRESSION (DELEGATED DESIGN)"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "design",
  "reasoning": "Preparing and submitting fire suppression delegated design documents is design phase work. This involves engineering calculations, drawings, and submittal packages sent to the General Contractor or Engineer of Record for review. Not construction work.",
  "suggestion": "Prepare & Submit Fire Suppression Delegated Design",
  "phase": "Design/Engineering"
}

Activity: "CFCI- REVIEW & APPROVE FIRE SUPPRESSION (DELEGATED DESIGN)"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "design",
  "reasoning": "Review and approval of fire suppression design by the Engineer of Record (EOR) or authority. This is design phase review, not physical testing or inspection. Design must be approved before installation begins.",
  "suggestion": "Review & Approve Fire Suppression Design",
  "phase": "Design/Engineering"
}

Activity: "DH-1200 ROUGH-IN SPRINKLER"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "rough_in",
  "reasoning": "This clearly states 'ROUGH-IN SPRINKLER' which is physical installation of sprinkler piping. The 'DH-1200' appears to be a building or area identifier. This is construction work installing pipes, not design or testing.",
  "suggestion": "Sprinkler Rough-in - DH1200 Area",
  "phase": "Overhead Rough-in"
}

Activity: "PROCURE FIRE SUPPRESSION"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "equipment",
  "reasoning": "PROCURE means purchasing/acquiring fire suppression equipment or materials. This is a pre-installation logistics activity, not testing or construction. Procurement happens before installation can begin.",
  "suggestion": "Procure Fire Suppression Equipment",
  "phase": "Mobilization"
}

Activity: "SET VESDA"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "equipment",
  "reasoning": "SET means physically mounting/installing the VESDA (Very Early Smoke Detection Apparatus) units. This is equipment installation, distinct from rough-in piping or testing. VESDA is fire detection equipment.",
  "suggestion": "Install VESDA Smoke Detection Units",
  "phase": "Equipment"
}

Activity: "ROUGH-IN VESDA"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "rough_in",
  "reasoning": "ROUGH-IN VESDA means installing the detection piping/tubing system for VESDA units. This is rough-in work similar to sprinkler piping, not equipment mounting or testing.",
  "suggestion": "VESDA Detection System Rough-in",
  "phase": "Overhead Rough-in"
}

Activity: "FINISH VESDA BELOW FLOOR"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "trim_final",
  "reasoning": "FINISH indicates final/trim work completing the VESDA installation. This is finishing work after rough-in and equipment installation, making connections and finalizing the system.",
  "suggestion": "VESDA System Finish Work - Below Floor",
  "phase": "Trim & Final"
}

Activity: "SPRINKLER HYDRO/VISUAL"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "testing",
  "reasoning": "HYDRO/VISUAL explicitly indicates hydrostatic testing and visual inspection of the sprinkler system. This is testing work done after installation to verify system integrity.",
  "suggestion": "Sprinkler System Hydrostatic Testing & Visual Inspection",
  "phase": "Testing"
}

Activity: "TEST POINTS"
{
  "is_fire_protection": true,
  "confidence": 0.90,
  "category": "testing",
  "reasoning": "TEST POINTS refers to installing or verifying test connection points in the fire protection system. These are used for testing system functionality. While installation of test points happens during rough-in, the activity name emphasizes testing, so this is categorized as testing infrastructure.",
  "suggestion": "Fire Protection System Test Points",
  "phase": "Testing"
}

Activity: "RECEIVE FIRE PROTECTION PERMIT"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "design",
  "reasoning": "RECEIVE PERMIT is an administrative milestone indicating permit approval was obtained from the authority. This is design/pre-construction phase paperwork, not physical construction or testing.",
  "suggestion": "Receive Fire Protection Permit",
  "phase": "Design/Engineering"
}

Activity: "Fire Alarm ROUGH-IN"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "rough_in",
  "reasoning": "Fire alarm systems are part of fire protection. ROUGH-IN indicates installing conduit, boxes, and wiring infrastructure before drywall. This is rough-in installation work.",
  "suggestion": "Fire Alarm System Rough-in",
  "phase": "Overhead Rough-in"
}

Activity: "SDC- B1/Admin/L3 - Fire Protection OH Rough-in"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "rough_in",
  "reasoning": "This clearly states Fire Protection OH (Overhead) Rough-in. B1/Admin/L3 indicates Building 1, Administration area, Level 3. This is sprinkler overhead rough-in work with specific location details.",
  "suggestion": "Fire Protection Overhead Rough-in - Building 1, Administration Area, Level 3",
  "phase": "Overhead Rough-in"
}

Activity: "MEP OH L2"
{
  "is_fire_protection": true,
  "confidence": 0.85,
  "category": "rough_in",
  "reasoning": "MEP overhead rough-in typically includes sprinkler mains and branch lines above the ceiling. Level 2 indicates second floor distribution piping. This is a standard phase where sprinkler piping is installed before drywall.",
  "suggestion": "Sprinkler Overhead Rough-in - Level 2",
  "phase": "Overhead Rough-in"
}

Activity: "M OH Sprinkler Mains - Admin 1st Floor OH Plumbing Mains - Admin 1st Floor"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "rough_in",
  "reasoning": "This describes installation of sprinkler mains and plumbing mains overhead. The 'OH' (Overhead) and 'Mains' keywords clearly indicate rough-in installation work, NOT testing. This is physical pipe installation in the Administration area, 1st Floor. No testing keywords present.",
  "suggestion": "Overhead Sprinkler Mains Installation - Administration Area, 1st Floor",
  "phase": "Overhead Rough-in"
}

Activity: "FP Test & Inspect"
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "testing",
  "reasoning": "FP abbreviation stands for Fire Protection. This activity clearly involves testing and inspection of the fire protection system.",
  "suggestion": "Fire Protection System Testing & Inspection",
  "phase": "Testing"
}

Activity: "Concrete Pour Foundation"
{
  "is_fire_protection": false,
  "confidence": 0.95,
  "category": "unknown",
  "reasoning": "This is structural concrete work with no indicators of fire protection. No mention of underground fire lines, sprinkler connections, or fire protection elements.",
  "suggestion": "",
  "phase": "Unknown"
}

Activity: "Level 3 Ceiling Close"
Context: ["Level 3 MEP Rough Complete", "Level 3 Electrical Trim", "Level 3 Final Inspection"]
{
  "is_fire_protection": true,
  "confidence": 0.70,
  "category": "trim_final",
  "reasoning": "Ceiling close-in occurs after MEP rough and typically includes installation of sprinkler heads and cover plates. The context shows this is in sequence with MEP work and final inspection, strongly suggesting sprinkler trim work is included.",
  "suggestion": "Sprinkler head installation and trim for Level 3",
  "phase": "Trim & Final"
}

Activity: "Underground Utilities Rough-in"
Context: ["Site Excavation", "Foundation Prep", "Fire Service Connection"]
{
  "is_fire_protection": true,
  "confidence": 0.80,
  "category": "underground",
  "reasoning": "Underground utilities in early construction phases typically include fire service lines. The context mentions 'Fire Service Connection' which confirms fire protection is part of this work. Underground fire protection is installed before foundations.",
  "suggestion": "Underground fire service and sprinkler supply lines",
  "phase": "Underground"
}

Activity: "Hydro Test All Floors"
{
  "is_fire_protection": true,
  "confidence": 0.90,
  "category": "testing",
  "reasoning": "Hydrostatic testing is a standard fire protection requirement to verify sprinkler system integrity and detect leaks. This is typically done after rough-in is complete and before trim work begins.",
  "suggestion": "Hydrostatic testing of sprinkler system",
  "phase": "Testing"
}

Now classify the activity above. Return ONLY the JSON, no other text.`;
}

/**
 * API endpoint to classify a single activity
 */
app.post('/api/classify-activity', async (req, res) => {
  try {
    const { activity, context, projectType } = req.body;

    if (!activity) {
      return res.status(400).json({ error: 'Activity text is required' });
    }

    const classification = await classifyActivity(
      activity, 
      context || [], 
      projectType || 'commercial'
    );
    
    res.json(classification);
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({
      error: 'Failed to classify activity',
      details: error.message
    });
  }
});

/**
 * API endpoint to classify multiple activities in batch
 */
app.post('/api/classify-batch', async (req, res) => {
  try {
    const { activities, projectType } = req.body;

    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: 'Activities must be an array' });
    }

    console.log(`Processing batch of ${activities.length} activities`);

    const results = [];
    for (let i = 0; i < activities.length; i++) {
      const item = activities[i];
      const activity = typeof item === 'string' ? item : item.activity;
      const context = item.context || [];
      
      const classification = await classifyActivity(
        activity, 
        context, 
        projectType || 'commercial'
      );
      
      results.push({
        activity,
        ...classification
      });

      // Log progress
      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/${activities.length} activities`);
      }
    }

    res.json({ results, total: results.length });
  } catch (error) {
    console.error('Batch classification error:', error);
    res.status(500).json({
      error: 'Failed to classify activities',
      details: error.message
    });
  }
});

/**
 * API endpoint to enhance existing parsed activities with LLM
 */
app.post('/api/enhance-activities', async (req, res) => {
  try {
    const { activities, projectType } = req.body;

    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: 'Activities must be an array' });
    }

    console.log(`Enhancing ${activities.length} activities with LLM intelligence`);

    const enhanced = [];
    const CONCURRENCY = 5; // Process 5 activities simultaneously
    
    // Process in batches with concurrency
    for (let i = 0; i < activities.length; i += CONCURRENCY) {
      const batch = activities.slice(i, i + CONCURRENCY);
      
      // Process batch in parallel
      const promises = batch.map(async (activity, batchIndex) => {
        const globalIndex = i + batchIndex;
        
        // Build context from surrounding activities
        const context = [];
        if (globalIndex > 0) context.push(activities[globalIndex - 1].name || activities[globalIndex - 1]);
        if (globalIndex < activities.length - 1) context.push(activities[globalIndex + 1].name || activities[globalIndex + 1]);
        
        const classification = await classifyActivity(
          activity.name || activity,
          context,
          projectType || 'commercial'
        );

        return {
          ...activity,
          llm_classification: classification.is_fire_protection,
          llm_confidence: classification.confidence,
          llm_category: classification.category,
          llm_reasoning: classification.reasoning,
          llm_suggestion: classification.suggestion,
          llm_phase: classification.phase
        };
      });

      const batchResults = await Promise.all(promises);
      enhanced.push(...batchResults);

      // Log progress
      console.log(`Enhanced ${Math.min(i + CONCURRENCY, activities.length)}/${activities.length} activities`);
    }

    res.json({ 
      activities: enhanced,
      total: enhanced.length,
      fire_protection_count: enhanced.filter(a => a.llm_classification).length
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({
      error: 'Failed to enhance activities',
      details: error.message
    });
  }
});

/**
 * API endpoint to learn from user corrections
 */
app.post('/api/learn-correction', async (req, res) => {
  try {
    const { activity, context, wasFireProtection, shouldBeFireProtection, userNote } = req.body;

    if (!activity) {
      return res.status(400).json({ error: 'Activity is required' });
    }

    // Log the correction for future model fine-tuning
    const correction = {
      timestamp: new Date().toISOString(),
      activity,
      context: context || [],
      was_fp: wasFireProtection,
      should_be_fp: shouldBeFireProtection,
      user_note: userNote || '',
    };

    console.log('User correction received:', correction);

    // In production, you would save this to a database for fine-tuning
    // For now, we'll just invalidate the cache for this activity
    const cacheKeys = cache.keys();
    const relevantKeys = cacheKeys.filter(key => key.includes(activity.substring(0, 30)));
    relevantKeys.forEach(key => cache.del(key));

    res.json({ 
      message: 'Correction recorded and cache invalidated',
      correction 
    });
  } catch (error) {
    console.error('Learn correction error:', error);
    res.status(500).json({
      error: 'Failed to record correction',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  try {
    // Test Ollama connection
    const models = await ollama.list();
    const hasLlama = models.models.some(m => m.name.includes('llama3.2'));

    res.json({
      status: 'ok',
      ollama_connected: true,
      model_available: hasLlama,
      cache_keys: cache.keys().length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      ollama_connected: false,
      error: error.message
    });
  }
});

/**
 * Cache stats endpoint
 */
app.get('/api/cache-stats', (req, res) => {
  res.json({
    keys: cache.keys().length,
    stats: cache.getStats()
  });
});

/**
 * Clear cache endpoint
 */
app.post('/api/cache-clear', (req, res) => {
  cache.flushAll();
  res.json({ message: 'Cache cleared successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 SprinkSync LLM Server running on http://localhost:${PORT}`);
  console.log(`📊 Using Ollama at http://localhost:11434`);
  console.log(`💾 Response caching enabled (1 hour TTL)`);

  // Test Ollama connection on startup
  ollama.list()
    .then((models) => {
      const llama32 = models.models.find(m => m.name.includes('llama3.2'));
      if (llama32) {
        console.log(`✅ Found model: ${llama32.name}`);
      } else {
        console.log('⚠️  Warning: llama3.2 not found. Install with: ollama pull llama3.2');
      }
    })
    .catch((error) => {
      console.error('❌ Could not connect to Ollama. Make sure it\'s running: ollama serve');
      console.error('   Error:', error.message);
    });
});
