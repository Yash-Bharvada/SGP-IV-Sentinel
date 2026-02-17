import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_arbitration(scenario_name, text, gradio_sentiment, expected_final, expected_override):
    print(f"\n🧪 Testing Scenario: {scenario_name}")
    print(f"   Input: '{text}' | Gradio Sentiment: {gradio_sentiment}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/insights",
            data={
                "transcription": text,
                "sentiment": gradio_sentiment,
                "language": "en"
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return
            
        data = response.json()
        final_sentiment = data.get("final_sentiment")
        corrected_sentiment = data.get("corrected_sentiment")
        correction_reason = data.get("correction_reason")
        
        print(f"   👉 Final Sentiment: {final_sentiment}")
        if corrected_sentiment:
            print(f"   ❗ Override Occurred: {corrected_sentiment} (Reason: {correction_reason})")
        else:
            print(f"   ✅ No Override")
            
        # Verification
        if final_sentiment == expected_final:
            print("   ✅ PASS: Final sentiment matches expectation.")
        else:
            print(f"   ❌ FAIL: Expected {expected_final}, got {final_sentiment}")
            
        if expected_override and not corrected_sentiment:
            print("   ❌ FAIL: Expected an override but none happened.")
        elif not expected_override and corrected_sentiment:
            print("   ❌ FAIL: Unexpected override.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("⏳ Waiting for server to be ready...")
    time.sleep(5) # Give server time to start
    
    # 1. Agreement
    test_arbitration(
        "Clear Positive",
        "I absolutely love this new feature, it works perfectly!",
        "Positive",
        expected_final="Positive",
        expected_override=False
    )
    
    # 2. Sarcasm (Strong Contradiction)
    test_arbitration(
        "Sarcasm",
        "Oh fantastic, I just love waiting on hold for 45 minutes. Best part of my day.",
        "Positive", # Gradio might mistake "fantastic", "love" for positive
        expected_final="Negative",
        expected_override=True
    )
    
    # 3. Negation
    test_arbitration(
        "Negation",
        "It's not bad at all.",
        "Negative", # Gradio might see "bad" and think Negative
        expected_final="Positive",
        expected_override=True
    )
    
    # 4. Mixed/Weak (Should keep Gradio)
    test_arbitration(
        "Mixed/Weak",
        "The product is good but the delivery was a bit slow.",
        "Positive",
        expected_final="Positive",
        expected_override=False
    )

if __name__ == "__main__":
    main()
