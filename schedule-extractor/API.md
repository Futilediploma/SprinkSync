# 🔥 SprinkSync LLM API Reference

Complete API documentation for the intelligent activity classification backend.

## Base URL
```
http://localhost:3001/api
```

## Endpoints

### Health Check

Check if the LLM backend is running and configured correctly.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "ollama_connected": true,
  "model_available": true,
  "cache_keys": 42
}
```

**Status Codes:**
- `200` - Service healthy
- `500` - Service error (check Ollama is running)

---

### Classify Single Activity

Classify a single construction activity with optional context.

**Request:**
```http
POST /api/classify-activity
Content-Type: application/json

{
  "activity": "MEP Overhead Rough-in Level 2",
  "context": ["Electrical rough complete", "Inspection scheduled"],
  "projectType": "commercial"
}
```

**Parameters:**
- `activity` (required): Activity name/description
- `context` (optional): Array of surrounding activities
- `projectType` (optional): "commercial", "residential", "industrial"

**Response:**
```json
{
  "is_fire_protection": true,
  "confidence": 0.85,
  "category": "rough_in",
  "reasoning": "MEP overhead rough-in typically includes sprinkler mains and branch lines above the ceiling. Level 2 indicates second floor distribution piping. This is a standard phase where sprinkler piping is installed before drywall.",
  "suggestion": "Sprinkler overhead rough-in for Level 2",
  "phase": "Overhead Rough-in"
}
```

**Categories:**
- `underground` - Underground fire service, mains
- `rough_in` - Overhead piping, branch lines
- `equipment` - Pumps, valves, FDC, backflow
- `testing` - Hydro, air, flow tests
- `inspection` - Fire marshal, AHJ inspections
- `trim_final` - Heads, escutcheons, devices
- `commissioning` - System startup, balancing
- `unknown` - Unable to categorize

**Phases:**
- `Mobilization`
- `Underground`
- `Overhead Rough-in`
- `Testing`
- `Inspections`
- `Trim & Final`
- `Commissioning`
- `Unknown`

---

### Batch Classification

Classify multiple activities efficiently.

**Request:**
```http
POST /api/classify-batch
Content-Type: application/json

{
  "activities": [
    {
      "activity": "Level 3 MEP Coordination",
      "context": ["Structural complete", "Drywall starting"]
    },
    "Underground Utilities",
    {
      "activity": "Ceiling Grid Installation",
      "context": []
    }
  ],
  "projectType": "commercial"
}
```

**Note:** Activities can be strings (no context) or objects with context.

**Response:**
```json
{
  "results": [
    {
      "activity": "Level 3 MEP Coordination",
      "is_fire_protection": true,
      "confidence": 0.65,
      "category": "rough_in",
      "reasoning": "...",
      "suggestion": "...",
      "phase": "Overhead Rough-in"
    },
    {
      "activity": "Underground Utilities",
      "is_fire_protection": true,
      "confidence": 0.75,
      "category": "underground",
      "reasoning": "...",
      "suggestion": "...",
      "phase": "Underground"
    },
    {
      "activity": "Ceiling Grid Installation",
      "is_fire_protection": false,
      "confidence": 0.40,
      "category": "unknown",
      "reasoning": "...",
      "suggestion": "",
      "phase": "Unknown"
    }
  ],
  "total": 3
}
```

---

### Enhance Activities

Enhance existing parsed activities with LLM intelligence. Automatically builds context from surrounding activities.

**Request:**
```http
POST /api/enhance-activities
Content-Type: application/json

{
  "activities": [
    {
      "name": "Overhead rough Level 2",
      "startDate": "01/15/2024",
      "finishDate": "01/22/2024",
      "duration": 7
    },
    {
      "name": "MEP Coordination Meeting",
      "startDate": "01/23/2024"
    },
    {
      "name": "Underground fire service",
      "startDate": "01/10/2024",
      "finishDate": "01/14/2024"
    }
  ],
  "projectType": "commercial"
}
```

**Response:**
```json
{
  "activities": [
    {
      "name": "Overhead rough Level 2",
      "startDate": "01/15/2024",
      "finishDate": "01/22/2024",
      "duration": 7,
      "llm_classification": true,
      "llm_confidence": 0.85,
      "llm_category": "rough_in",
      "llm_reasoning": "...",
      "llm_suggestion": "Sprinkler overhead rough-in for Level 2",
      "llm_phase": "Overhead Rough-in"
    },
    {
      "name": "MEP Coordination Meeting",
      "startDate": "01/23/2024",
      "llm_classification": false,
      "llm_confidence": 0.45,
      "llm_category": "unknown",
      "llm_reasoning": "...",
      "llm_suggestion": "",
      "llm_phase": "Unknown"
    },
    {
      "name": "Underground fire service",
      "startDate": "01/10/2024",
      "finishDate": "01/14/2024",
      "llm_classification": true,
      "llm_confidence": 0.95,
      "llm_category": "underground",
      "llm_reasoning": "...",
      "llm_suggestion": "Underground fire service line installation",
      "llm_phase": "Underground"
    }
  ],
  "total": 3,
  "fire_protection_count": 2
}
```

---

### Submit User Correction

Submit user feedback to improve the AI. Invalidates cache and logs correction.

**Request:**
```http
POST /api/learn-correction
Content-Type: application/json

{
  "activity": "MEP Coordination Meeting",
  "context": ["Site walkthrough", "RFI review"],
  "wasFireProtection": true,
  "shouldBeFireProtection": false,
  "userNote": "This was just a meeting, no actual work"
}
```

**Parameters:**
- `activity` (required): The activity text
- `context` (optional): Surrounding activities
- `wasFireProtection` (required): What the AI classified it as
- `shouldBeFireProtection` (required): What it should be
- `userNote` (optional): Additional context from user

**Response:**
```json
{
  "message": "Correction recorded and cache invalidated",
  "correction": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "activity": "MEP Coordination Meeting",
    "context": ["Site walkthrough", "RFI review"],
    "was_fp": true,
    "should_be_fp": false,
    "user_note": "This was just a meeting, no actual work"
  }
}
```

---

### Get Cache Statistics

View cache performance metrics.

**Request:**
```http
GET /api/cache-stats
```

**Response:**
```json
{
  "keys": 156,
  "stats": {
    "hits": 342,
    "misses": 156,
    "keys": 156,
    "ksize": 15600,
    "vsize": 245000
  }
}
```

---

### Clear Cache

Clear all cached LLM responses. Useful after model updates or corrections.

**Request:**
```http
POST /api/cache-clear
```

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Failed to classify activity",
  "details": "Ollama service not available"
}
```

**Common Status Codes:**
- `400` - Bad request (missing required parameters)
- `500` - Server error (LLM failure, Ollama unavailable)

---

## Rate Limiting

No rate limiting is currently implemented since this is a local service.

---

## Caching Behavior

- **Cache Key**: `${activity}_${context}_${projectType}`
- **TTL**: 1 hour (3600 seconds)
- **Invalidation**: Automatic after TTL, or via `/cache-clear` endpoint
- **Correction Impact**: Corrections invalidate related cache entries

---

## Integration Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('http://localhost:3001/api/classify-activity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    activity: 'MEP Overhead Level 3',
    context: ['Electrical complete'],
    projectType: 'commercial'
  })
})

const classification = await response.json()
console.log(classification.is_fire_protection) // true
console.log(classification.confidence)         // 0.85
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:3001/api/classify-activity',
    json={
        'activity': 'MEP Overhead Level 3',
        'context': ['Electrical complete'],
        'projectType': 'commercial'
    }
)

classification = response.json()
print(classification['is_fire_protection'])  # True
print(classification['confidence'])          # 0.85
```

### cURL
```bash
curl -X POST http://localhost:3001/api/classify-activity \
  -H "Content-Type: application/json" \
  -d '{
    "activity": "MEP Overhead Level 3",
    "context": ["Electrical complete"],
    "projectType": "commercial"
  }'
```

---

## Best Practices

### 1. Provide Context
Always include surrounding activities when possible:
```json
{
  "activity": "Level 2 Rough",
  "context": ["Level 1 Complete", "Level 3 Starting"]
}
```

### 2. Batch When Possible
Use `/classify-batch` for multiple activities:
- Reduces network overhead
- Better for sequential processing
- Progress logging

### 3. Cache Strategically
- Cache is automatic, but consider clearing after corrections
- Monitor cache stats to optimize TTL

### 4. Handle Errors Gracefully
```typescript
try {
  const result = await classifyActivity(activity)
} catch (error) {
  // Fallback to keyword-based classification
  console.warn('LLM unavailable, using fallback')
}
```

### 5. User Feedback Loop
Implement correction submission for continuous improvement:
```typescript
await submitCorrection(activity, context, wasClassified, shouldBe, note)
```

---

## Performance Tips

- **Batch size**: 10-20 activities per batch for optimal performance
- **Context window**: Limit to 2-3 surrounding activities
- **Model choice**: Use llama3.2 for speed, mistral for accuracy
- **Cache monitoring**: Check `/cache-stats` regularly

---

## Security Considerations

- Service runs on localhost by default
- No authentication required (local only)
- Do not expose port 3001 publicly
- All data processing is local

---

For more information, see [LLM_SETUP.md](./LLM_SETUP.md)
