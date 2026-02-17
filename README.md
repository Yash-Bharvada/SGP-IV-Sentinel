# 🧠 SGP-IV-Sentinel: The AI That *Feels* You

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![React](https://img.shields.io/badge/Frontend-Next.js_14-black.svg)
![AI](https://img.shields.io/badge/AI-Llama_3-orange.svg)
![Status](https://img.shields.io/badge/Status-Active_Development-brightgreen.svg)

> *"Words hide what code reveals."*

**SGP-IV-Sentinel** is not just a sentiment analysis tool. It's a **Multilingual Semantic Engine** capable of piercing through sarcasm, irony, and contradictions in human speech. Powered by **Groq LPU Inference**, **Edge Neural TTS**, and **HuggingFace Transformers**, it doesn't just listen—it *understands*.

---

## ⚡ Key Features

### 🎭 **True Semantic Perception**
Most AIs stop at "Positive" or "Negative". Sentinel goes deeper:
- **Sarcasm Detection**: "Oh, great, another error!" → *Negative (Detected Sarcasm)*
- **Irony & Contradiction**: Cross-references tone with semantic meaning.
- **Arbitration Logic**: When the sentiment model shouts "Happy" but the text screams "Pain", Sentinel overrides it.

### 🗣️ **Multilingual Neural Voice (TTS)**
- **Hyper-Realistic Gujarati Support**: Uses `Edge-TTS` to generate Dhwani-Neuralspeech.
- **Bilingual Processing**: Seamlessly handles English, Hindi, and Gujarati input.

### ⚡ **Instant Inference**
- **Groq LPU Acceleration**: Llama-3-70b inference at **300+ tokens/second**.
- **Real-Time Analysis**: Audio-to-Insight in milliseconds.

### 🎨 **Glassmorphic UI**
- **Cinematic Experience**: A Next.js 14 frontend with Tailwind CSS and Framer Motion.
- **Holographic Visualizations**: Typewriter effects, pulsing audio indicators, and glass-card outcomes.

---

## 🏗️ Architecture

```mermaid
graph LR
    A[User Voice/Text] --> B(Next.js Frontend);
    B --> C{FastAPI Backend};
    C -->|Audio| D[Gradio Space (Generic Sentiment)];
    C -->|Semantics| E[Groq LPU (Llama-3 Arbitration)];
    E -->|Correction| C;
    C -->|Text| F[Edge TTS (Neural Voice)];
    F -->|Audio MP3| B;
    B --> G[Result Card];
```

---

## 🛠️ Tech Stack

### **Backend (The Brain)**
- **Python 3.10+**
- **FastAPI**: High-performance async API.
- **Groq SDK**: For lightning-fast LLM inference.
- **Gradio Client**: To bridge with HuggingFace Spaces.
- **Edge TTS**: For neural speech synthesis.

### **Frontend (The Face)**
- **Next.js 14**: App Router & Server Actions.
- **TypeScript**: Type-safety at scale.
- **Tailwind CSS**: For that sleek, modern look.
- **Framer Motion**: Smooth, cinematic animations.
- **Lucide Icons**: Crisp, clean iconography.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key

### 1. Clone the Sentinel
```bash
git clone https://github.com/Yash-Bharvada/SGP-IV-Sentinel.git
cd SGP-IV-Sentinel
```

### 2. Ignite the Backend
```bash
cd server
pip install -r requirements.txt
# Set your GROQ_API_KEY in the code or environment variables
python backend.py
```
*Server runs on `http://localhost:8000`*

### 3. Launch the Interface
```bash
cd web
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 📸 Snapshots

*(Add your screenshots here)*
> "The interface isn't just a screen; it's a conversation."

---

## 🔮 Future Roadmap

- [ ] **Emotion-to-Color Mapping**: Dynamic UI themes based on user mood.
- [ ] **Real-time Conversation**: Full duplex voice chat.
- [ ] **Memory Vector DB**: Context-aware long-term conversations (Pinecone integration).

---

## 🤝 Contributing

Fork it. Break it. Fix it. Pull Request it.
We are building the future of Human-AI interaction.

---

*Built with ❤️ and ☕ by Yash Bharvada*
