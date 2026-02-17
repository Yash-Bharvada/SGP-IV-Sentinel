import urllib.request
import json
import base64
import os
import sys

# Ensure backend is running
url = "http://localhost:8000/tts"
text = "નમસ્તે! મારું નામ AI છે. હું તમારી મદદ કરવા માટે અહીં છું."

print(f"🔄 Requesting Gujarati TTS from: {url}")
print(f"📝 Text: {text}")

data = {
    "text": text,
    "language": "guj"
}

try:
    req = urllib.request.Request(url, 
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    with urllib.request.urlopen(req) as response:
        if response.status != 200:
            print(f"❌ Error: Backend returned status {response.status}")
            sys.exit(1)
            
        result = json.loads(response.read().decode())
        
        if "audio" in result:
            audio_data = base64.b64decode(result["audio"])
            filename = "test_gujarati.mp3"
            
            with open(filename, "wb") as f:
                f.write(audio_data)
                
            abs_path = os.path.abspath(filename)
            print(f"\n✅ SUCCESS! Audio saved to:\n   {abs_path}")
            print(f"\n👉 Open this file to hear the sample.")
        else:
            print("❌ Backend Error (No audio data):", result)

except urllib.error.URLError as e:
    print(f"\n❌ FAILED to connect to backend: {e}")
    print("⚠️  Is 'python backend.py' running? Please start it first!")
except Exception as e:
    print(f"\n❌ Unexpected Error: {e}")
