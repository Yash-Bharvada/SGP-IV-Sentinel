# 🛠️ SGP-IV Sentinel — Setup Guide

Complete step-by-step instructions to get the project running locally from scratch.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Required API Keys](#required-api-keys)
- [Backend Setup](#backend-setup-fastapi)
- [Frontend Setup](#frontend-setup-nextjs)
- [Environment Variables Reference](#environment-variables-reference)
- [Running the Project](#running-the-project)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure the following are installed on your machine:

| Tool | Minimum Version | Download |
|------|----------------|----------|
| Python | 3.10+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Included with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com/) |

**Verify your installations:**

```bash
python --version     # Should print Python 3.10.x or higher
node --version       # Should print v18.x.x or higher
npm --version        # Should print 9.x.x or higher
git --version
```

---

## Required API Keys

This project requires **one** external API key:

### 1. 🟠 Groq API Key — `GROQ_API_KEY`

Used for:
- **Speech-to-Text**: Transcribing audio using `whisper-large-v3`
- **Language Detection**: Detecting spoken language from audio
- **AI Insights**: Generating summaries and sentiment arbitration via `llama-3.3-70b-versatile`

**How to get it (Free):**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in with your Google/GitHub account
3. Navigate to **API Keys** in the left sidebar
4. Click **"Create API Key"**
5. Name it anything (e.g., `SGP-IV-Sentinel`)
6. **Copy the key immediately** — it won't be shown again

> ✅ Groq's free tier includes generous limits: **14,400 requests/day** and up to **30 requests/minute** for Whisper and Llama models.

---

### Services That Do NOT Need an API Key

| Service | Why No Key Needed |
|---------|-------------------|
| **HuggingFace Gradio Space** (`marshal-yash/Indic-Sentiment-Audio-App`) | Public space, no authentication required |
| **Microsoft Edge TTS** | Free service, no registration required |
| **Browser Web Speech API** | Built into modern browsers |
| **langdetect** | Runs locally, no external service |

---

## Backend Setup (FastAPI)

### Step 1 — Clone the repository

```bash
git clone https://github.com/Yash-Bharvada/SGP-IV-Sentinel.git
cd SGP-IV-Sentinel
```

### Step 2 — Create a Python virtual environment (recommended)

```bash
# Windows
cd server
python -m venv venv
venv\Scripts\activate

# macOS / Linux
cd server
python3 -m venv venv
source venv/bin/activate
```

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs:

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `python-multipart` | Form data parsing |
| `groq` | Groq SDK (Whisper + Llama) |
| `gradio-client` | Connect to HuggingFace Spaces |
| `langdetect` | Text language detection |
| `edge-tts` | Neural Gujarati TTS |
| `aiofiles` | Async file handling |
| `torch`, `torchaudio`, `transformers` | ML model utilities |

> ⚠️ **Note:** `torch` and `torchaudio` can be large (~2GB). If you don't need local model inference, you can remove them from `requirements.txt` — the project uses cloud APIs for inference.

### Step 4 — Create your `.env` file

```bash
# In the server/ directory
cp .env.example .env
```

Then open `.env` and fill in your key:

```env
GROQ_API_KEY=gsk_your_actual_key_here
```

> ⚠️ Never commit `.env` to git. It is already listed in `.gitignore`.

### Step 5 — Start the backend

```bash
# Windows (with emoji support)
$env:PYTHONIOENCODING="utf-8"; python backend.py

# macOS / Linux
python backend.py
```

**Expected output:**
```
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
🚀 Connecting to Cloud Brain at: marshal-yash/Indic-Sentiment-Audio-App...
✅ Successfully connected to Gradio App!
✅ Successfully initialized Groq AI client!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

> If you see `❌ Failed to connect to Gradio App: The read operation timed out`, the HuggingFace Space may be sleeping. Try the `/analyze` endpoint — it will wake it up.

---

## Frontend Setup (Next.js)

### Step 1 — Navigate to the web directory

```bash
cd web
```

### Step 2 — Install Node.js dependencies

```bash
npm install
```

### Step 3 — Start the development server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 16.1.4 (Turbopack)
- Local:   http://localhost:3000
✓ Ready in 2.2s
```

Open your browser at **http://localhost:3000**

---

## Environment Variables Reference

### `server/.env`

```env
# =============================================
# SGP-IV Sentinel — Environment Variables
# =============================================

# Groq AI API Key
# Get yours free at: https://console.groq.com/keys
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### `server/.env.example`

This file is committed to the repository as a template:

```env
GROQ_API_KEY=your_groq_api_key_here
```

---

## Running the Project

Both services must be running simultaneously. Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
# Activate venv if using one: venv\Scripts\activate
$env:PYTHONIOENCODING="utf-8"; python backend.py
```

**Terminal 2 — Frontend:**
```bash
cd web
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (auto-generated) | http://localhost:8000/docs |
| Redoc | http://localhost:8000/redoc |

---

## Troubleshooting

### ❌ `UnicodeEncodeError: 'charmap' codec can't encode character`

**Cause:** Windows terminal doesn't support emoji characters in Python output by default.

**Fix:**
```powershell
$env:PYTHONIOENCODING="utf-8"; python backend.py
```

---

### ❌ `Authentication failed for 'https://github.com/...'`

**Cause:** GitHub no longer supports password authentication. PAT is expired.

**Fix:** Generate a new Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens), then:
```bash
git remote set-url origin https://YOUR_USERNAME:YOUR_NEW_TOKEN@github.com/Yash-Bharvada/SGP-IV-Sentinel.git
```

---

### ❌ `503 Service Unavailable` from `/analyze`

**Cause:** The HuggingFace Gradio Space is not connected.

**Fix:** The space may be sleeping (free tier). Wait ~30 seconds and retry. Check the backend terminal for connection status.

---

### ❌ `Error code: 401 - Invalid API Key` from `/insights`

**Cause:** `GROQ_API_KEY` in your `.env` is missing, wrong, or expired.

**Fix:**
1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Regenerate your key
3. Update `server/.env`
4. Restart the backend

---

### ❌ `Module not found: edge-tts`

**Fix:**
```bash
pip install edge-tts
```

---

### ❌ Next.js workspace root warning

```
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
```

**Fix:** Add to `web/next.config.ts`:
```typescript
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
};
```

---

### 🔍 Checking Backend Health

Visit **http://localhost:8000/docs** in your browser to access the auto-generated Swagger UI and test all endpoints interactively.
