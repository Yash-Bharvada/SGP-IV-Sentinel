# 🛡️ SGP-IV Sentinel — Indic Voice Sentiment Analyzer

> **Real-time multilingual voice sentiment analysis for English, Hindi, and Gujarati — powered by Whisper, Llama 3.3, and Edge TTS.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?logo=next.js)](https://nextjs.org/)
[![Groq](https://img.shields.io/badge/AI-Groq%20%7C%20Llama%203.3-F55036?logo=groq)](https://groq.com/)
[![HuggingFace](https://img.shields.io/badge/Model-HuggingFace%20Space-FFD21F?logo=huggingface)](https://huggingface.co/)

---

## 📌 Overview

**SGP-IV Sentinel** is an intelligent voice sentiment analysis platform that:

- 🎤 **Accepts audio recordings or typed text** in English, Hindi, or Gujarati
- 🤖 **Transcribes speech** using Groq Whisper (`whisper-large-v3`)
- 🧠 **Detects sentiment** (Positive / Negative / Neutral) via a fine-tuned Hugging Face Gradio Space
- 🕵️ **Arbitrates sarcasm & negation** using Llama 3.3-70B on Groq
- 🔊 **Reads back insights** in the user's original language using Edge TTS (Gujarati) or the browser Speech API (Hindi/English)
- 🌐 **Auto-detects language** — no need to manually select

---

## 🏗️ Project Architecture

```
SGP-IV-Sentinel/
├── server/                   # Python FastAPI backend
│   ├── backend.py            # Main API server
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # 🔐 Local secrets (NOT committed)
│   └── .env.example          # Template for environment variables
│
├── web/                      # Next.js 16 frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utility functions
│   ├── package.json
│   └── next.config.ts
│
├── README.md                 # ← You are here
├── docs/
│   ├── API.md                # Full API reference
│   └── SETUP.md              # Detailed setup guide
└── .gitignore
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Groq API Key](https://console.groq.com/keys) *(free)*

### 1. Clone the repository
```bash
git clone https://github.com/Yash-Bharvada/SGP-IV-Sentinel.git
cd SGP-IV-Sentinel
```

### 2. Set up the backend
```bash
cd server
pip install -r requirements.txt
cp .env.example .env        # Then fill in your GROQ_API_KEY
python backend.py
```
> Backend runs at **http://localhost:8000**

### 3. Set up the frontend
```bash
cd web
npm install
npm run dev
```
> Frontend runs at **http://localhost:3000**

---

## 🔑 Required API Keys

| Service | Key Name | Free Tier | Get It |
|---------|----------|-----------|--------|
| **Groq** | `GROQ_API_KEY` | ✅ Yes | [console.groq.com/keys](https://console.groq.com/keys) |

> The **Hugging Face Gradio Space** (`marshal-yash/Indic-Sentiment-Audio-App`) is publicly accessible — no API key needed.
> Edge TTS is free with no key required.

See **[docs/SETUP.md](./docs/SETUP.md)** for full setup instructions.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4, Framer Motion |
| Backend | FastAPI, Uvicorn, Python 3.10+ |
| Speech-to-Text | Groq Whisper (`whisper-large-v3`) |
| Sentiment Model | HuggingFace Gradio Space (`marshal-yash/Indic-Sentiment-Audio-App`) |
| Insight Generation | Groq LLM (`llama-3.3-70b-versatile`) |
| Text-to-Speech | Edge TTS (Gujarati), Web Speech API (Hindi/English) |
| Language Detection | `langdetect` (text), Groq Whisper (audio) |

---

## 🌍 Supported Languages

| Language | Code | STT | Sentiment | TTS |
|----------|------|-----|-----------|-----|
| English | `eng` | ✅ | ✅ | Browser API |
| Hindi | `hin` | ✅ | ✅ | Browser API |
| Gujarati | `guj` | ✅ | ✅ | Edge TTS (Neural) |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Project overview (this file) |
| [docs/API.md](./docs/API.md) | Full REST API reference |
| [docs/SETUP.md](./docs/SETUP.md) | Step-by-step environment setup guide |

---

## 🤝 Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is part of the **SGP-IV (Senior Group Project IV)** academic submission.

---

<p align="center">Built with ❤️ by Yash Bharvada</p>
