import os
import shutil
import tempfile
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client, handle_file
from groq import Groq

app = FastAPI()

# --- CORS Config ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
# REPLACE THIS with the actual name or URL of your Hugging Face Space
# Example: "marshal-yash/SGP-IV-Voice-Sentiment-Brain"
GRADIO_SPACE_URL = "marshal-yash/Indic-Sentiment-Audio-App" 

# Groq API Configuration
GROQ_API_KEY = ""

# Global Client Variables
gradio_client = None
groq_client = None


# ==========================================
# Lifespan Manager (Startup/Shutdown)
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load resources
    print("🚀 Connecting to Cloud Brain at: marshal-yash/Indic-Sentiment-Audio-App...")
    try:
        # Initialize the connection to your HF Space
        global gradio_client
        gradio_client = Client("marshal-yash/Indic-Sentiment-Audio-App")
        print("✅ Successfully connected to Gradio App!")
    except Exception as e:
        print(f"❌ Failed to connect to Gradio App: {e}")

    # Initialize Groq client
    global groq_client
    try:
        api_key = os.environ.get("GROQ_API_KEY") or GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment or code")
            
        groq_client = Groq(api_key=api_key)
        print("✅ Successfully initialized Groq AI client!")
    except Exception as e:
        print(f"❌ Failed to initialize Groq client: {e}")
        
    yield
    # Shutdown: Clean up resources
    print("🛑 Shutting down...")

app = FastAPI(lifespan=lifespan)

# --- CORS Config ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (rest of configuration)
# REPLACE THIS with the actual name or URL of your Hugging Face Space
GRADIO_SPACE_URL = "marshal-yash/Indic-Sentiment-Audio-App"
GROQ_API_KEY = ""

# Global Client Variables
gradio_client = None
groq_client = None


@app.post("/analyze")
async def analyze(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    source_lang: Optional[str] = Form(None)  # Now optional - will auto-detect if not provided
):
    """
    Receives Audio/Text -> Sends to Gradio App -> Returns Result
    Now with automatic language detection!
    """
    global gradio_client

    if not gradio_client:
        raise HTTPException(status_code=503, detail="Backend not connected to Cloud Brain")

    temp_file_path = None
    
    try:
        # --- Language Detection Helper ---
        def detect_language(text_input: str) -> str:
            """Detect language from text and map to Gradio format"""
            try:
                from langdetect import detect
                detected = detect(text_input)
                
                # Map language codes to Gradio format
                lang_map = {
                    'en': 'eng',
                    'hi': 'hin',
                    'gu': 'guj'
                }
                
                result = lang_map.get(detected, 'eng')  # Default to English
                print(f"🔍 Detected language: {detected} -> {result}")
                return result
            except Exception as e:
                print(f"⚠️ Language detection failed: {e}, defaulting to 'eng'")
                return 'eng'
        
        # --- Step 1: Handle Audio File ---
        if file:
            # Create a temporary file with the correct extension
            suffix = os.path.splitext(file.filename)[1] or ".wav"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                temp_file_path = tmp.name
            
            print(f"🎤 Received Audio. Saved temp file: {temp_file_path}")
            
            # Prepare audio argument for Gradio
            audio_input = handle_file(temp_file_path)
        else:
            audio_input = None

        # --- Step 2: Auto-detect language if not provided ---
        if not source_lang:
            if text:
                # Detect from text input
                source_lang = detect_language(text)
                print(f"📝 Auto-detected language from text: {source_lang}")
            elif file:
                # Use Groq Whisper to detect spoken language directly from audio
                try:
                    print("🎧 Using Groq to detect spoken language from audio...")
                    with open(temp_file_path, "rb") as audio_file:
                        transcription_obj = groq_client.audio.transcriptions.create(
                            file=(os.path.basename(temp_file_path), audio_file.read()),
                            model="whisper-large-v3",
                            response_format="verbose_json",
                        )
                    detected_lang_str = str(transcription_obj.language).lower()
                    print(f"👂 Groq detected language: {detected_lang_str}")
                    
                    lang_map = {
                        'english': 'eng', 'en': 'eng',
                        'hindi': 'hin', 'hi': 'hin',
                        'gujarati': 'guj', 'gu': 'guj'
                    }
                    source_lang = lang_map.get(detected_lang_str, 'eng')
                    print(f"✅ Set language to: {source_lang}")
                except Exception as e:
                    print(f"⚠️ Groq language detection failed: {e}, defaulting to 'eng'")
                    source_lang = 'eng'
            else:
                source_lang = 'eng'
        else:
            print(f"✓ Using provided language: {source_lang}")

        # --- Step 3: Call Gradio API ---
        print(f"☁️ Sending request to Gradio (Lang: {source_lang})...")
        
        try:
            result = gradio_client.predict(
                audio_input,     # Input 1: Audio filepath
                source_lang,     # Input 2: Dropdown value ("hin", "guj", "eng")
                text or "",      # Input 3: Textbox value
            )
        except Exception as api_error:
            # If auto-detect fails, try common endpoint names
            print(f"⚠️ Auto-detect failed: {api_error}")
            print("🔍 Trying alternative API endpoints...")
            
            for endpoint in ["/analyze", "/process", "/inference", "/run"]:
                try:
                    print(f"   Trying: {endpoint}")
                    result = gradio_client.predict(
                        audio_input,
                        source_lang,
                        text or "",
                        api_name=endpoint
                    )
                    print(f"✅ Success with endpoint: {endpoint}")
                    break
                except:
                    continue
            else:
                raise Exception(
                    f"Could not find valid API endpoint. "
                    f"Please visit https://huggingface.co/spaces/{GRADIO_SPACE_URL} "
                    f"and click 'Use via API' to see available endpoints."
                )
        
        # --- Step 4: Parse Results ---
        print(f"✅ Raw Result from Gradio: {result}")

        transcription = result[0]
        sentiment_data = result[1]
        confidence_score = result[2]

        # --- Step 5: Finalize output language ---
        # We KEEP source_lang as the detected_language, even if Gradio translated the transcription to English.
        # This ensures the final insights and voice output remain in the original spoken language!
        detected_language = source_lang
        print(f"🗣️ Using spoken language for output: {detected_language}")

        # Normalize Sentiment Label
        sentiment_label = "Neutral"
        if isinstance(sentiment_data, dict):
            sentiment_label = sentiment_data.get('label', 'Neutral')
        elif isinstance(sentiment_data, str):
            sentiment_label = sentiment_data
        
        # Clean emoji if present (e.g., "Positive 🟢" -> "Positive")
        clean_sentiment = sentiment_label.split(" ")[0]

        return {
            "transcription": transcription,
            "sentiment": clean_sentiment,
            "confidence": float(confidence_score),
            "language_used": detected_language,
            "detected_language": detected_language  # Explicitly return detected language
        }

    except Exception as e:
        print(f"❌ Error during processing: {e}")
        return {
            "transcription": "",
            "sentiment": "Error",
            "confidence": 0.0,
            "error_details": str(e)
        }
        
    finally:
        # --- Cleanup ---
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print("🧹 Temp file cleaned up.")

@app.post("/insights")
async def get_insights(
    transcription: str = Form(...),
    sentiment: str = Form(...),
    language: str = Form("en")
):
    """
    Uses Llama-3.1-8b-instant to generate insights about user sentiment
    Returns: summary, likes[], dislikes[], final_sentiment
    """
    global groq_client
    
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq AI client not initialized")
    
    try:
        if not transcription or not sentiment:
            raise HTTPException(status_code=400, detail="Missing transcription or sentiment")

        # Create a structured system prompt
        system_prompt = f"""You are an expert semantic analyst and sarcasm detector.
        
YOUR GOAL: Understand the TRUE semantic meaning of the user's statement and check if it contradicts the detected emotion.

Current Language Mode: {language.upper()}
"""
        
        # User message with EXPLICIT instructions for arbitration
        user_message = f"""
        User said: "{transcription}"
        Gradio Detected Sentiment: {sentiment}
        Language Code: {language}

        TASK (VERY IMPORTANT):
        1. Understand the TRUE MEANING of the sentence.
        2. Detect sarcasm, irony, negation, or hidden dissatisfaction ONLY if CLEAR.
        3. Decide whether the Gradio sentiment is WRONG or CORRECT.

        STRICT RULES:
        - Do NOT change sentiment unless there is STRONG semantic contradiction.
        - Mixed emotions are NOT contradiction.
        - Tone mismatch alone is NOT enough.
        
        CRITICAL OUTPUT RULES:
        - SUMMARY MUST BE IN {language.upper()}!
        - If language is 'eng' -> Use ENGLISH.
        - If language is 'guj' -> Use GUJARATI.
        - If language is 'hin' -> Use HINDI.

        Respond ONLY in valid JSON:
        {{
          "semantic_sentiment": "Positive|Negative|Neutral",
          "contradiction": true|false,
          "confidence": 0.0-1.0,
          "reason": "Short explanation",
          "summary": "1 short sentence component summary in {language.upper()}",
          "likes": [{{"point": "...", "description": "..."}}],
          "dislikes": [{{"point": "...", "description": "..."}}]
        }}
        """

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse response
        response_text = chat_completion.choices[0].message.content.strip()
        
        # Try to extract JSON if there's any markdown formatting
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        import json
        insights = json.loads(response_text)
        
        # --- ARBITRATION LOGIC ---
        semantic_sentiment = insights.get("semantic_sentiment")
        contradiction = insights.get("contradiction", False)
        confidence = insights.get("confidence", 0.0)
        reason = insights.get("reason", "")

        final_sentiment = sentiment  # Default → TRUST SPACE

        print(f"🕵️ Arbitration Check:")
        print(f"   - Input Sentiment: {sentiment}")
        print(f"   - Semantic Sentiment: {semantic_sentiment}")
        print(f"   - Contradiction Detected: {contradiction}")
        print(f"   - Confidence: {confidence}")

        # Only override if contradiction is strong and confident
        if contradiction and confidence >= 0.75:
            if semantic_sentiment and semantic_sentiment != sentiment:
                final_sentiment = semantic_sentiment
                insights["corrected_sentiment"] = semantic_sentiment
                insights["correction_reason"] = reason
                print(f"❗ OVERRIDE: Changing {sentiment} -> {final_sentiment} (Reason: {reason})")
            else:
                print(f"✅ Keeping {sentiment} (Semantic matches or is invalid)")
        else:
            print(f"✅ Keeping {sentiment} (No strong contradiction)")

        # Clean up response (remove intermediate arbitration fields)
        insights.pop("semantic_sentiment", None)
        insights.pop("contradiction", None)
        insights.pop("confidence", None)
        insights.pop("reason", None)

        insights["final_sentiment"] = final_sentiment
        
        print(f"✅ Final Insights: {insights}")
        return insights
        
    except Exception as e:
        print(f"❌ Error generating insights: {e}")
        # Return valid fallback structure
        return {
            "summary": f"Could not analyze: {str(e)}",
            "likes": [],
            "dislikes": [],
            "final_sentiment": sentiment
        }


# ==========================================
# Edge TTS Integration (Neural Voice)
# ==========================================

@app.post("/tts")
async def generate_speech(request: dict):
    """Generate high-quality neural speech using Edge TTS."""
    text = request.get("text")
    language = request.get("language")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Only process Gujarati via Edge TTS (others use browser API)
    if language == "guj":
        try:
            import edge_tts
            
            # Voice: Gujarati (India) - Dhwani (Female) or Niranjan (Male)
            VOICE = "gu-IN-DhwaniNeural"
            
            communicate = edge_tts.Communicate(text, VOICE)
            
            # Stream audio to memory buffer
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            # Encode as base64 (MP3 format)
            import base64
            audio_base64 = base64.b64encode(audio_data).decode()
            
            return {
                "audio": audio_base64,
                "format": "mp3",
                "source": "Edge TTS (Neural)"
            }
        except ImportError:
            print("⚠️ edge-tts library not found. Please install: pip install edge-tts")
            raise HTTPException(status_code=500, detail="TTS library missing")
        except Exception as e:
            print(f"❌ Edge TTS Error: {e}")
            raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")
    
    return {"error": "Language handled by browser", "supported": ["guj"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)