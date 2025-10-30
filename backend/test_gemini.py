# backend/test_gemini.py
# Test Gemini API directly to see what's happening

import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
print(f"API Key: {GOOGLE_API_KEY[:20]}...")

genai.configure(api_key=GOOGLE_API_KEY)

# Create model
model = genai.GenerativeModel('gemini-2.5-flash')

# Test prompt
prompt = """You are an expert marketing analyst.

Query: What are the best marketing channels for B2B SaaS companies?

Return ONLY this JSON (no other text):
{
    "insights": [
        {
            "title": "Content Marketing Drives Growth",
            "detail": "Content marketing generates 3x more leads than traditional methods.",
            "confidence": 0.87,
            "category": "Strategy"
        },
        {
            "title": "LinkedIn Leads Professional Engagement",
            "detail": "LinkedIn delivers highest B2B engagement at 2.8% vs 0.5% on other platforms.",
            "confidence": 0.82,
            "category": "Channels"
        },
        {
            "title": "SEO Provides Long-term Value",
            "detail": "Organic search drives 53% of B2B website traffic with sustainable ROI.",
            "confidence": 0.79,
            "category": "Channels"
        }
    ]
}

Return ONLY the JSON above with 3 insights."""

print("\n" + "="*60)
print("Testing Gemini API")
print("="*60)

try:
    print("\n🤖 Calling Gemini...")
    response = model.generate_content(prompt)
    
    print("\n📝 RAW RESPONSE:")
    print("-" * 60)
    print(response.text)
    print("-" * 60)
    
    # Try to parse as JSON
    print("\n🧪 Attempting to parse JSON...")
    try:
        # Clean markdown formatting
        content = response.text.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        parsed = json.loads(content)
        
        print("✅ JSON PARSED SUCCESSFULLY!")
        print(f"\nKeys: {list(parsed.keys())}")
        
        if "insights" in parsed:
            insights = parsed["insights"]
            print(f"✅ Found {len(insights)} insights")
            
            for i, insight in enumerate(insights, 1):
                print(f"\nInsight {i}:")
                print(f"  Title: {insight.get('title')}")
                print(f"  Category: {insight.get('category')}")
                print(f"  Confidence: {insight.get('confidence')}")
                print(f"  Detail: {insight.get('detail')[:80]}...")
        else:
            print("❌ No 'insights' key found!")
            
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error: {e}")
        print(f"Error position: {e.pos}")
        print(f"\nTrying to fix...")
        
        # Show what's wrong
        if hasattr(e, 'pos'):
            start = max(0, e.pos - 50)
            end = min(len(content), e.pos + 50)
            print(f"Problem area: ...{content[start:end]}...")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("Test complete")
print("="*60)