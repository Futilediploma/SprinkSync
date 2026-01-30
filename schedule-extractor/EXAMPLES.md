# 🎯 SprinkSync LLM Classification Examples

Real-world examples showing how the AI classifies construction activities.

---

## ✅ High Confidence Examples

### Example 1: MEP Overhead Rough-in

**Activity:** `"MEP Overhead Rough-in Level 2"`

**Context:**
- Previous: `"Electrical Rough Level 1"`
- Next: `"Plumbing Rough Level 2"`

**LLM Classification:**
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

**Why High Confidence:**
- ✓ "MEP" commonly includes sprinklers
- ✓ "Overhead" indicates above-ceiling work
- ✓ "Level 2" shows specific floor
- ✓ Context shows trade sequencing

---

### Example 2: Underground Fire Service

**Activity:** `"Underground fire service connection"`

**LLM Classification:**
```json
{
  "is_fire_protection": true,
  "confidence": 0.95,
  "category": "underground",
  "reasoning": "Explicitly mentions 'fire service' which is the underground water supply line for the sprinkler system. This is clearly fire protection work installed before foundations.",
  "suggestion": "Underground fire service line installation",
  "phase": "Underground"
}
```

**Why High Confidence:**
- ✓ Explicit "fire service" mention
- ✓ Clear phase indicator
- ✓ Standard fire protection work

---

### Example 3: Hydrostatic Testing

**Activity:** `"Hydro test all floors"`

**Context:**
- Previous: `"Sprinkler rough complete"`
- Next: `"Sprinkler trim Level 1"`

**LLM Classification:**
```json
{
  "is_fire_protection": true,
  "confidence": 0.90,
  "category": "testing",
  "reasoning": "Hydrostatic testing is a standard fire protection requirement to verify sprinkler system integrity and detect leaks. The context shows this follows rough-in and precedes trim work, confirming it's sprinkler system testing.",
  "suggestion": "Hydrostatic testing of sprinkler system",
  "phase": "Testing"
}
```

**Why High Confidence:**
- ✓ "Hydro test" is definitive FP term
- ✓ Context confirms sprinkler work
- ✓ Proper sequencing

---

## 🟡 Medium Confidence Examples

### Example 4: Ceiling Work

**Activity:** `"Level 3 Ceiling Close-in"`

**Context:**
- Previous: `"Level 3 MEP Rough Complete"`
- Next: `"Level 3 Final Inspection"`

**LLM Classification:**
```json
{
  "is_fire_protection": true,
  "confidence": 0.70,
  "category": "trim_final",
  "reasoning": "Ceiling close-in occurs after MEP rough and typically includes installation of sprinkler heads and cover plates. The context shows this is in sequence with MEP work and final inspection, strongly suggesting sprinkler trim work is included.",
  "suggestion": "Sprinkler head installation and trim for Level 3",
  "phase": "Trim & Final"
}
```

**Why Medium Confidence:**
- ✓ Context suggests sprinkler work
- ✓ Proper sequencing
- ⚠️ No explicit sprinkler mention
- ⚠️ Could be just drywall/grid

---

### Example 5: MEP Coordination

**Activity:** `"MEP Coordination Meeting - Week 15"`

**Context:**
- Previous: `"Structural Inspections"`
- Next: `"Begin MEP Rough-in"`

**LLM Classification:**
```json
{
  "is_fire_protection": false,
  "confidence": 0.65,
  "category": "unknown",
  "reasoning": "This is a coordination meeting, not actual construction work. While fire protection may be discussed, no physical sprinkler work is being performed. Meetings are typically planning activities.",
  "suggestion": "",
  "phase": "Unknown"
}
```

**Why Medium Confidence:**
- ✓ Correct identification as meeting
- ✓ Context helps
- ⚠️ Some MEP meetings do involve FP inspections
- ⚠️ Could include sprinkler coordination

---

### Example 6: Overhead Work (Vague)

**Activity:** `"Overhead utilities Level 2"`

**Context:**
- Previous: `"Slab on grade complete"`
- Next: `"Inspection scheduled"`

**LLM Classification:**
```json
{
  "is_fire_protection": true,
  "confidence": 0.60,
  "category": "rough_in",
  "reasoning": "Overhead utilities in a multi-floor building often include sprinkler mains and branch lines. The timing between slab completion and inspection suggests MEP trades including fire protection. However, without explicit mention, confidence is moderate.",
  "suggestion": "Overhead utilities including possible sprinkler work for Level 2",
  "phase": "Overhead Rough-in"
}
```

**Why Medium Confidence:**
- ✓ "Overhead" is common FP term
- ✓ Context suggests MEP work
- ⚠️ "Utilities" is vague
- ⚠️ Could be electrical/HVAC only

---

## 🔴 Low Confidence Examples

### Example 7: General Coordination

**Activity:** `"Site coordination - General contractor"`

**LLM Classification:**
```json
{
  "is_fire_protection": false,
  "confidence": 0.90,
  "category": "unknown",
  "reasoning": "This is general site coordination by the GC, not specific to any trade. No indicators of fire protection work.",
  "suggestion": "",
  "phase": "Unknown"
}
```

**Why Low Confidence (but correct):**
- ✓ Clearly not FP work
- ✓ No relevant indicators

---

### Example 8: Ambiguous Floor Work

**Activity:** `"3rd Floor Activities"`

**Context:** None

**LLM Classification:**
```json
{
  "is_fire_protection": false,
  "confidence": 0.30,
  "category": "unknown",
  "reasoning": "Activity name is too vague to determine if fire protection work is included. Without context or specific trade mention, cannot confidently classify.",
  "suggestion": "",
  "phase": "Unknown"
}
```

**Why Low Confidence:**
- ⚠️ No specific indicators
- ⚠️ No context provided
- ⚠️ Could be anything

---

## 📊 Pattern Recognition

### Patterns AI Recognizes:

#### 1. **Trade Sequencing**
```
✓ Slab complete → MEP rough → Inspection
✓ Electrical rough → Overhead work → Drywall
✓ Underground utilities → Foundation → Rough-in
```

#### 2. **Testing Indicators**
```
✓ "hydro", "hydrotest", "hydrostatic"
✓ "air test", "pressure test"
✓ "flow test", "flush"
✓ Following rough-in activities
```

#### 3. **Spatial Clues**
```
✓ "Level 1", "L2", "3rd Floor"
✓ "Underground", "below grade"
✓ "Overhead", "above ceiling"
✓ "Riser", "vertical distribution"
```

#### 4. **Equipment Keywords**
```
✓ "fire pump", "jockey pump"
✓ "backflow", "BFP", "RPZ"
✓ "FDC", "fire department connection"
✓ "standpipe", "fire hydrant"
```

#### 5. **Combined MEP Activities**
```
✓ "MEP rough", "MEP overhead"
✓ "MEP coordination" (with construction context)
✓ "Utilities rough-in"
✓ "Ceiling work" (when following MEP rough)
```

---

## 🚫 Common Misclassifications

### False Positives (AI thinks it's FP, but isn't)

**Example:** `"Fire escape installation"`
```json
{
  "is_fire_protection": false,
  "confidence": 0.40,
  "reasoning": "Fire escape is structural/architectural, not fire protection systems."
}
```

**Example:** `"Meeting with fire marshal - code review"`
```json
{
  "is_fire_protection": false,
  "confidence": 0.55,
  "reasoning": "This is a meeting, not actual construction work."
}
```

### False Negatives (AI misses FP work)

**Example:** `"Red pipe installation Level 2"`
- Should detect: Sprinkler piping (often painted red)
- AI might miss if no context

**Example:** `"BFP startup and commissioning"`
- Should detect: Backflow preventer = sprinkler equipment
- AI usually catches this (high confidence)

---

## 💡 Tips for Best Results

### 1. **Provide Context**
```javascript
// ❌ Poor
{ activity: "Level 2 rough" }

// ✅ Better
{
  activity: "Level 2 rough",
  context: ["Level 1 complete", "Inspection scheduled"]
}
```

### 2. **Be Specific in Activity Names**
```javascript
// ❌ Vague: "Work on 3rd floor"
// ✅ Better: "MEP rough-in 3rd floor"
// ✅ Best: "Sprinkler overhead rough-in 3rd floor"
```

### 3. **Use Standard Terminology**
```javascript
// ✅ "Overhead rough-in"
// ✅ "Underground fire service"
// ✅ "Hydro test"
// ✅ "Trim & Final"
```

### 4. **Include Project Type**
```javascript
{
  activity: "Utilities rough-in",
  projectType: "commercial"  // Helps AI understand scale
}
```

---

## 📈 Confidence Thresholds

**How to interpret confidence scores:**

| Confidence | Interpretation | Action |
|------------|----------------|--------|
| **0.90-1.00** | Very High | Trust classification |
| **0.70-0.89** | High | Generally reliable |
| **0.50-0.69** | Medium | Review reasoning |
| **0.30-0.49** | Low | Verify manually |
| **0.00-0.29** | Very Low | Likely incorrect |

---

## 🔄 Feedback Loop

When you find misclassifications, use the correction feature:

```javascript
await submitCorrection({
  activity: "MEP Coordination Meeting",
  wasFireProtection: true,
  shouldBeFireProtection: false,
  userNote: "This was just a meeting, no actual work"
})
```

This helps:
- ✓ Invalidates cache for similar activities
- ✓ Logs pattern for future improvements
- ✓ Improves accuracy over time

---

## 🎓 Learning from Corrections

The AI learns patterns from your corrections:

**User corrects:** `"Fire alarm panel installation"` → NOT fire protection (different trade)

**AI adapts:** Future "fire alarm" activities get lower FP confidence

**User corrects:** `"Red pipe Level 3"` → IS fire protection (sprinkler piping)

**AI adapts:** "Red pipe" now recognized as sprinkler indicator

---

For more examples and live testing, see the interactive demo in the application.
