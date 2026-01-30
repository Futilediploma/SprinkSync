# 🔧 SprinkSync Troubleshooting Guide

Common issues and solutions for the AI-enhanced schedule parser.

---

## 🚨 LLM Issues

### "LLM backend not available"

**Symptoms:**
- Gray AI badge instead of colored
- "AI Verified" stat shows 0
- No reasoning sections on activities

**Solutions:**

1. **Check if Ollama is running:**
```bash
ollama list
```

If you see an error:
```bash
ollama serve
```

2. **Verify model is downloaded:**
```bash
ollama list
```

Should show:
```
NAME            ID              SIZE    MODIFIED
llama3.2:latest abc123def456    2.0 GB  2 hours ago
```

If not:
```bash
ollama pull llama3.2
```

3. **Test Ollama directly:**
```bash
curl http://localhost:11434/api/tags
```

Should return JSON with available models.

4. **Restart services:**
```bash
# Stop backend (Ctrl+C)
# Stop Ollama (Ctrl+C)
ollama serve
# In new terminal:
cd schedule-extractor/server
npm start
```

---

### Slow Classification Performance

**Symptoms:**
- Activities taking 10+ seconds each
- UI freezes during processing
- High CPU/RAM usage

**Solutions:**

1. **Use a smaller model:**
```bash
ollama pull llama3.2:1b  # 1B parameter model (faster)
```

Edit `server/index.js`:
```javascript
model: 'llama3.2:1b',  // Instead of 'llama3.2'
```

2. **Reduce batch size:**

Edit `server/index.js`:
```javascript
// Process fewer at once
if ((i + 1) % 5 === 0) {  // Was 10
  console.log(`Processed ${i + 1}/${activities.length}`)
}
```

3. **Check system resources:**
```bash
# Windows
Task Manager → Performance

# macOS/Linux
top
htop
```

**Requirements:**
- 8GB RAM minimum (16GB recommended)
- Modern CPU (4+ cores recommended)
- SSD recommended for model loading

4. **Clear cache:**
```bash
curl -X POST http://localhost:3001/api/cache-clear
```

5. **Optimize Ollama:**
```bash
# Set lower thread count
OLLAMA_NUM_THREADS=4 ollama serve
```

---

### Incorrect Classifications

**Symptoms:**
- AI marks non-FP activities as fire protection
- AI misses obvious sprinkler work
- Confidence scores seem wrong

**Solutions:**

1. **Use user feedback:**
- Click "▶ AI Reasoning"
- Use 👍/👎 buttons to correct
- This invalidates cache and logs corrections

2. **Try a different model:**

**For better accuracy:**
```bash
ollama pull mistral
```

Edit `server/index.js`:
```javascript
model: 'mistral',
```

3. **Adjust temperature:**

Edit `server/index.js`:
```javascript
options: {
  temperature: 0.1,  // Lower = more consistent (was 0.3)
  top_p: 0.9,
}
```

4. **Provide better context:**

Ensure activities have surrounding context:
```javascript
// Frontend automatically provides this, but verify:
context: [previousActivity, nextActivity]
```

5. **Check prompt template:**

Review `buildClassificationPrompt()` in `server/index.js` - you can customize the prompt for your specific needs.

---

### JSON Parsing Errors

**Symptoms:**
- Console shows "Invalid response structure from LLM"
- Activities show no AI enhancement
- Backend logs show JSON errors

**Solutions:**

1. **Verify model is complete:**
```bash
ollama list
# Check SIZE column - should be ~2GB for llama3.2
```

If size is wrong:
```bash
ollama rm llama3.2
ollama pull llama3.2
```

2. **Restart Ollama:**
```bash
# Ctrl+C to stop
ollama serve
```

3. **Clear cache and retry:**
```bash
curl -X POST http://localhost:3001/api/cache-clear
```

4. **Check Ollama logs:**
```bash
# Ollama terminal will show errors
# Look for "out of memory" or "connection refused"
```

5. **Test model directly:**
```bash
ollama run llama3.2 "Say hello"
```

Should respond normally.

---

## 📄 PDF Parsing Issues

### No Activities Found

**Symptoms:**
- Upload succeeds but 0 activities shown
- "Activities Found" stat shows 0

**Solutions:**

1. **Check PDF format:**
- Should be text-based PDF (not scanned image)
- Test: Try to select/copy text in the PDF

2. **Verify file structure:**

Check browser console for parsing logs:
```
📄 Starting PDF parsing: schedule.pdf
📊 PDF loaded: 5 pages
Page 1: Found 42 rows
```

If "Found 0 rows", PDF might be image-based.

3. **Try a different PDF:**

Test with a simple text PDF to verify parser works.

4. **Check for errors:**

Browser Console (F12) should show detailed errors.

---

### Wrong Activities Detected

**Symptoms:**
- Non-FP activities in results
- Missing obvious sprinkler work
- Phase classifications wrong

**Solutions:**

1. **Check keyword detection:**

Review `src/utils/fireProtectionKeywords.ts` - you can add custom keywords:

```typescript
strongCore: [
  'sprinkler', 'fire protection',
  'your-custom-term',  // Add here
]
```

2. **Adjust confidence thresholds:**

In `fireProtectionKeywords.ts`:
```typescript
if (score >= 5) return 'high'
if (score >= 3) return 'medium'  // Adjust these
return 'low'
```

3. **Enable LLM enhancement:**

Make sure "Use AI Enhancement" is toggled on.

---

## 🌐 Backend Issues

### Backend Won't Start

**Symptoms:**
- `npm start` fails
- Port 3001 errors
- Connection refused errors

**Solutions:**

1. **Check port availability:**
```powershell
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001
```

If port is in use:
```powershell
# Kill process on Windows
taskkill /PID <PID> /F

# Kill process on macOS/Linux
kill -9 <PID>
```

2. **Change port:**

Edit `server/index.js`:
```javascript
const PORT = 3002;  // Use different port
```

Also update `src/utils/llmService.ts`:
```typescript
const API_BASE_URL = 'http://localhost:3002/api'
```

3. **Check dependencies:**
```bash
cd server
rm -rf node_modules
npm install
```

4. **Check Node version:**
```bash
node --version  # Should be 18+
```

---

### CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Frontend can't reach backend
- Network requests fail

**Solutions:**

1. **Verify CORS is enabled:**

In `server/index.js`:
```javascript
app.use(cors());  // Should be present
```

2. **Check URLs match:**

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001`

Don't mix http/https.

3. **Restart both services:**
```bash
# Stop frontend (Ctrl+C)
# Stop backend (Ctrl+C)
# Restart both
```

---

## 🖥️ Frontend Issues

### Frontend Won't Start

**Symptoms:**
- `npm run dev` fails
- Port 5173 errors
- Build errors

**Solutions:**

1. **Clear build cache:**
```bash
rm -rf node_modules .vite
npm install
npm run dev
```

2. **Check port:**
```powershell
netstat -ano | findstr :5173
```

Kill process if needed.

3. **Check dependencies:**
```bash
npm install
```

4. **Try different port:**

Edit `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5174,  // Different port
  }
})
```

---

### TypeScript Errors

**Symptoms:**
- Red squiggles in editor
- Build fails with type errors

**Solutions:**

1. **Restart TypeScript server:**

VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

2. **Check types are installed:**
```bash
npm install --save-dev @types/react @types/react-dom
```

3. **Verify tsconfig.json:**

Should include:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

---

## 🐛 General Debugging

### Enable Verbose Logging

**Backend:**

Edit `server/index.js`:
```javascript
// Add detailed logging
console.log('Request received:', req.body)
console.log('LLM response:', response)
```

**Frontend:**

Browser Console (F12) shows detailed logs:
```
📄 Starting PDF parsing
🤖 Enhancing activities with LLM intelligence
✨ LLM enhancement complete
```

---

### Reset Everything

**Nuclear option - start fresh:**

```bash
# Stop all services (Ctrl+C everywhere)

# Clear Ollama
ollama rm llama3.2
ollama pull llama3.2

# Clear backend
cd schedule-extractor/server
rm -rf node_modules
npm install

# Clear frontend
cd ..
rm -rf node_modules .vite
npm install

# Restart services
# Terminal 1:
ollama serve

# Terminal 2:
cd schedule-extractor/server
npm start

# Terminal 3:
cd schedule-extractor
npm run dev
```

---

## 🔍 Health Check Checklist

Run through this checklist if something's wrong:

```bash
# 1. Check Ollama
ollama list
# Should show llama3.2

# 2. Check Ollama is running
curl http://localhost:11434/api/tags
# Should return JSON

# 3. Check backend
curl http://localhost:3001/api/health
# Should return {"status": "ok", ...}

# 4. Check frontend
# Open http://localhost:5173 in browser
# Should see upload interface

# 5. Test classification
curl -X POST http://localhost:3001/api/classify-activity \
  -H "Content-Type: application/json" \
  -d '{"activity": "Sprinkler rough-in"}'
# Should return classification JSON
```

---

## 📊 Performance Monitoring

### Check Cache Stats

```bash
curl http://localhost:3001/api/cache-stats
```

**Good cache performance:**
```json
{
  "keys": 150,
  "stats": {
    "hits": 450,      // Higher is better
    "misses": 150,    // Lower is better
    "hit_rate": 0.75  // 75% hit rate is good
  }
}
```

**If hit rate < 50%:**
- Increase cache TTL
- Check if activities are similar enough

---

## 🆘 Still Having Issues?

1. **Check GitHub Issues:**
   - https://github.com/Futilediploma/SprinkSync/issues

2. **Collect Debug Info:**
```bash
# System info
node --version
npm --version
ollama --version

# Service health
curl http://localhost:11434/api/tags
curl http://localhost:3001/api/health

# Browser console logs (F12)
# Copy all errors
```

3. **Create Detailed Issue:**
   - OS and version
   - Node version
   - Ollama version
   - Model used
   - Full error messages
   - Steps to reproduce
   - What you've already tried

---

## 🎯 Quick Fixes

**Most common issues (90% of problems):**

1. ❌ Ollama not running → `ollama serve`
2. ❌ Model not downloaded → `ollama pull llama3.2`
3. ❌ Backend not started → `cd server && npm start`
4. ❌ Wrong port → Check 3001 (backend), 5173 (frontend)
5. ❌ Cache issues → `curl -X POST http://localhost:3001/api/cache-clear`

---

**Pro tip:** Keep all three terminals visible:
```
Terminal 1: ollama serve
Terminal 2: cd server && npm start
Terminal 3: cd schedule-extractor && npm run dev
```

Then you can see logs from all services at once.
