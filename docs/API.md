# 📡 SGP-IV Sentinel — API Reference

> Base URL: `http://localhost:8000`
> All endpoints accept `multipart/form-data` or `application/json` as noted.

---

## Table of Contents

- [POST /analyze](#post-analyze)
- [POST /insights](#post-insights)
- [POST /tts](#post-tts)
- [Error Codes](#error-codes)

---

## POST `/analyze`

Analyzes audio or text input and returns a transcription with detected sentiment.

### Description

Accepts an audio file or plain text, auto-detects the language (English / Hindi / Gujarati), runs transcription via Groq Whisper, and classifies sentiment using the HuggingFace Gradio Space.

### Request

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | `File` (audio) | Optional* | Audio file (`.wav`, `.mp3`, `.webm`, etc.) |
| `text` | `string` | Optional* | Plain text to analyze instead of audio |
| `source_lang` | `string` | Optional | Language code: `eng`, `hin`, or `guj`. Auto-detected if omitted. |

> *At least one of `file` or `text` must be provided.

### Language Auto-Detection Logic

```
Audio input  → Groq Whisper (whisper-large-v3) detects language
Text input   → langdetect library detects language
No input     → Defaults to 'eng'
```

### Response

**Content-Type:** `application/json`

```json
{
  "transcription": "I really love this product",
  "sentiment": "Positive",
  "confidence": 0.923,
  "language_used": "eng",
  "detected_language": "eng"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `transcription` | `string` | Transcribed or input text |
| `sentiment` | `string` | `Positive`, `Negative`, or `Neutral` |
| `confidence` | `float` | Confidence score from the model (0.0 – 1.0) |
| `language_used` | `string` | Language code used for analysis |
| `detected_language` | `string` | Same as `language_used` |

### Error Response

```json
{
  "transcription": "",
  "sentiment": "Error",
  "confidence": 0.0,
  "error_details": "Reason for failure"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success (even on soft errors — check `sentiment: "Error"`) |
| `503` | Backend not connected to HuggingFace Gradio Space |

### Example — cURL (Audio)

```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@recording.wav" \
  -F "source_lang=eng"
```

### Example — cURL (Text)

```bash
curl -X POST http://localhost:8000/analyze \
  -F "text=I absolutely love this!"
```

### Example — JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append("file", audioBlob, "recording.wav");

const response = await fetch("http://localhost:8000/analyze", {
  method: "POST",
  body: formData,
});
const result = await response.json();
console.log(result.sentiment); // "Positive"
```

---

## POST `/insights`

Generates detailed AI insights from a transcription using Llama 3.3-70B, with built-in sarcasm & contradiction detection.

### Description

Takes the transcription and sentiment from `/analyze` and passes them through the Groq LLM to:
- Detect sarcasm, irony, and negation
- Arbitrate if the model-detected sentiment contradicts the semantic meaning
- Return a structured summary with likes/dislikes in the user's language

### Request

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transcription` | `string` | ✅ | The text to analyze (from `/analyze`) |
| `sentiment` | `string` | ✅ | Detected sentiment: `Positive`, `Negative`, or `Neutral` |
| `language` | `string` | Optional | Language code: `eng`, `hin`, or `guj`. Defaults to `en`. |

### Arbitration Logic

The model overrides the Gradio-detected sentiment only if **both** conditions are met:
1. `contradiction = true` — LLM detects clear sarcasm/negation
2. `confidence >= 0.75` — LLM is highly confident in the contradiction

### Response

**Content-Type:** `application/json`

```json
{
  "summary": "The user expresses strong dissatisfaction with the service quality.",
  "likes": [
    { "point": "Quick delivery", "description": "Appreciated the fast shipping speed" }
  ],
  "dislikes": [
    { "point": "Poor packaging", "description": "Items were not secured properly" }
  ],
  "final_sentiment": "Negative",
  "corrected_sentiment": "Negative",
  "correction_reason": "Sarcasm detected — 'great job breaking everything' implies dissatisfaction"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string` | One-sentence summary in the user's language |
| `likes` | `array` | List of positive points extracted |
| `dislikes` | `array` | List of negative points extracted |
| `final_sentiment` | `string` | Final arbitrated sentiment |
| `corrected_sentiment` | `string` | Present only if sentiment was overridden |
| `correction_reason` | `string` | Explanation for the override |

### Fallback Response (on error)

```json
{
  "summary": "Could not analyze: <error message>",
  "likes": [],
  "dislikes": [],
  "final_sentiment": "Neutral"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Missing `transcription` or `sentiment` field |
| `503` | Groq client not initialized |

### Example — cURL

```bash
curl -X POST http://localhost:8000/insights \
  -F "transcription=I don't like ducks at all." \
  -F "sentiment=Negative" \
  -F "language=eng"
```

### Example — JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append("transcription", "I don't like ducks at all.");
formData.append("sentiment", "Negative");
formData.append("language", "eng");

const res = await fetch("http://localhost:8000/insights", {
  method: "POST",
  body: formData,
});
const insights = await res.json();
console.log(insights.final_sentiment); // "Negative"
```

---

## POST `/tts`

Generates neural text-to-speech audio for Gujarati using Microsoft Edge TTS.

> **Note:** English and Hindi TTS is handled client-side by the browser's Web Speech API. This endpoint only processes `language: "guj"`.

### Request

**Content-Type:** `application/json`

```json
{
  "text": "આ ઉત્પાદન ખૂબ સારું છે",
  "language": "guj"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | ✅ | Text to convert to speech |
| `language` | `string` | ✅ | Must be `"guj"` for server-side TTS |

### Response (Gujarati)

```json
{
  "audio": "<base64-encoded-mp3>",
  "format": "mp3",
  "source": "Edge TTS (Neural)"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `audio` | `string` | Base64-encoded MP3 audio data |
| `format` | `string` | Always `"mp3"` |
| `source` | `string` | TTS engine used |

### Response (Non-Gujarati)

```json
{
  "error": "Language handled by browser",
  "supported": ["guj"]
}
```

### Voice Used

| Language | Voice | Gender |
|----------|-------|--------|
| Gujarati | `gu-IN-DhwaniNeural` | Female (Neural) |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | `text` field is missing |
| `500` | Edge TTS library missing or generation failed |

### Example — cURL

```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "આ ઉત્પાદન ખૂબ સારું છે", "language": "guj"}'
```

### Example — Decode and Play in Browser

```javascript
const res = await fetch("http://localhost:8000/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "આ ઉત્પાદન ખૂબ સારું છે", language: "guj" }),
});
const { audio } = await res.json();

const audioEl = new Audio(`data:audio/mp3;base64,${audio}`);
audioEl.play();
```

---

## Error Codes

| HTTP Code | Description |
|-----------|-------------|
| `400` | Bad Request — missing required field |
| `500` | Server Error — internal processing failure |
| `503` | Service Unavailable — AI client not initialized (check startup logs) |

---

## Typical Request Flow

```
User records audio
       ↓
POST /analyze  (audio + optional lang)
       ↓
Returns: transcription + sentiment + confidence + language
       ↓
POST /insights  (transcription + sentiment + language)
       ↓
Returns: summary + likes + dislikes + final_sentiment
       ↓
POST /tts  (summary text + language="guj")   ← only for Gujarati
       ↓
Returns: base64 MP3 audio → play in browser
```
