# 🚀 Quick Start: SprinkSync with AI Enhancement

Get the AI-powered schedule parser running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- 8GB RAM minimum (for LLM)
- Windows, macOS, or Linux

## Step-by-Step Setup

### 1️⃣ Install Ollama (2 minutes)

**Windows:**
```powershell
winget install Ollama.Ollama
```

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2️⃣ Download AI Model (1 minute)

```bash
ollama pull llama3.2
```

### 3️⃣ Start AI Service

```bash
ollama serve
```

Leave this terminal running.

### 4️⃣ Install & Start Backend (New terminal)

```bash
cd schedule-extractor/server
npm install
npm start
```

You should see:
```
🔥 SprinkSync LLM Server running on http://localhost:3001
✅ Found model: llama3.2
```

### 5️⃣ Install & Start Frontend (New terminal)

```bash
cd schedule-extractor
npm install
npm run dev
```

Open your browser to: **http://localhost:5173**

## 🎯 Usage

1. **Drag & drop** your PDF schedule
2. Watch the AI analyze activities
3. Click **"▶ AI Reasoning"** to see why it classified each activity
4. Use **👍/👎** buttons to improve accuracy

## 🤖 AI Features

### What the AI Understands:

✅ **Vague Terms**
- "MEP Overhead Rough" → Includes sprinkler mains
- "Level 3 Ceiling" → Sprinkler head installation
- "Underground Utilities" → May include fire service

✅ **Context Clues**
- Activities between "Slab Pour" and "MEP Inspection"
- Work scheduled after electrical rough
- Testing following rough-in phases

✅ **Trade Sequencing**
- Understands typical construction order
- Identifies hidden sprinkler work in combined MEP activities
- Recognizes testing patterns

### Confidence Levels:

- 🟢 **70-100%** - High confidence, trust this
- 🟡 **40-69%** - Medium confidence, review suggested
- 🔴 **0-39%** - Low confidence, verify manually

## Without AI (Keyword Mode)

If you don't want to install Ollama:

1. The app will automatically fall back to keyword matching
2. Still works great for explicit "sprinkler" mentions
3. May miss ambiguous activities like "MEP coordination"

## Quick Troubleshooting

**"LLM backend not available"**
```bash
# Check Ollama is running
ollama list

# Restart if needed
ollama serve
```

**Slow performance?**
```bash
# Use smaller model
ollama pull llama3.2:1b
```

**Wrong classifications?**
- Use 👍/👎 buttons to teach the AI
- Check you're using llama3.2 or mistral

## Next Steps

- Read [LLM_SETUP.md](./LLM_SETUP.md) for advanced configuration
- Check [API.md](./API.md) for integration details
- See [EXAMPLES.md](./EXAMPLES.md) for classification examples

## Need Help?

- Check the [Full Documentation](./LLM_SETUP.md)
- Open an issue on GitHub
- Join our community discussions

---

**Ready to parse smarter? Drop that schedule! 📄🔥**
