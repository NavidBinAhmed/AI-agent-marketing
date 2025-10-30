## This file serves as the Agent for marketing analysis using Google Gemini and SerpAPI
## It includes web search, prompt construction, response parsing, and insight generation.
## While testing APIs especially Gemini 2.5-flash, this code prints detailed debug information to the console.
## Kept for now to help with debugging and future enhancements.

import asyncio
import json
import re
from typing import List, Dict, Any
import google.generativeai as genai
import httpx
from .schemas import AnalyzeResponse, Insight, Source
from .config import get_settings


class MarketingAgent:
    """Marketing analysis agent using Google Gemini and SerpAPI"""
    
    def __init__(self):
        settings = get_settings()
        
        # Configure Gemini
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        
        # SerpAPI
        self.serpapi_key = settings.serpapi_api_key
        
        print(f"Agent initialized with {settings.gemini_model}")
    
    async def search_web(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search the web using SerpAPI"""
        try:
            async with httpx.AsyncClient() as client:
                response = await asyncio.wait_for(
                    client.get(
                        "https://serpapi.com/search",
                        params={
                            "q": query,
                            "api_key": self.serpapi_key,
                            "num": num_results,
                            "engine": "google"
                        }
                    ),
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = []
                    
                    for result in data.get("organic_results", [])[:num_results]:
                        results.append({
                            "title": result.get("title", ""),
                            "url": result.get("link", ""),
                            "snippet": result.get("snippet", "")
                        })
                    
                    print(f"SerpAPI: Found {len(results)} results")
                    return results
                else:
                    print(f"SerpAPI error: {response.status_code}")
                    return []
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def extract_json_from_text(self, text: str) -> str:
        """Extract JSON from text that might have markdown or other formatting"""
        # Remove markdown code blocks
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        
        # Try to find JSON object
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        return text
    
    async def analyze_with_gemini(self, prompt: str, search_results: List[Dict]) -> Dict[str, Any]:
        """Analyze with Gemini"""
        
        if not search_results:
            context = "No search results available. Provide insights based on general marketing knowledge."
        else:
            context = "\n\n".join([
                f"Source {i+1}: {r['title']}\n{r['snippet']}\nURL: {r['url']}"
                for i, r in enumerate(search_results)
            ])
        
        full_prompt = f"""You are an expert marketing analyst. Analyze this marketing query and provide actionable insights.

Marketing Query: {prompt}

Web Search Results:
{context}

INSTRUCTIONS:
1. Generate 3-5 high-quality marketing insights
2. Each insight must have: title, detail, confidence (0.7-0.95), category
3. Categories can be: Strategy, Channels, Content, Analytics, Audience, ROI, Tools
4. Use specific data from search results
5. Make insights actionable

CRITICAL: Return ONLY this JSON structure (no other text):
{{
    "insights": [
        {{
            "title": "Content Marketing Drives B2B Growth",
            "detail": "Content marketing generates 3x more leads than traditional methods. Focus on long-form blog posts, whitepapers, and case studies to establish thought leadership.",
            "confidence": 0.87,
            "category": "Strategy"
        }},
        {{
            "title": "LinkedIn Outperforms for Professional Engagement",
            "detail": "LinkedIn delivers the highest B2B engagement rates at 2.8% compared to 0.5% on other platforms. Invest in LinkedIn Ads and organic content strategy.",
            "confidence": 0.82,
            "category": "Channels"
        }}
    ]
}}

Return ONLY the JSON object above with 3-5 insights. No explanation, no markdown formatting."""

        try:
            print("\n" + "="*60)
            print("Calling Google Gemini...")
            print("="*60)
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(
                    full_prompt,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 2048,
                    }
                )
            )
            
            raw_content = response.text
            
            print(f"\n RAW GEMINI RESPONSE ({len(raw_content)} chars):")
            print("-" * 60)
            print(raw_content[:500])  # Print first 500 chars
            print("-" * 60)
            
            # Clean the response
            cleaned_content = self.extract_json_from_text(raw_content)
            
            print(f"\n CLEANED RESPONSE ({len(cleaned_content)} chars):")
            print("-" * 60)
            print(cleaned_content[:500])
            print("-" * 60)
            
            # Try to parse JSON
            try:
                parsed = json.loads(cleaned_content)
                print(f"\n JSON PARSED SUCCESSFULLY")
                print(f"Keys in response: {list(parsed.keys())}")
                
                if "insights" in parsed:
                    insights = parsed["insights"]
                    print(f" Found 'insights' key with {len(insights)} items")
                    
                    if len(insights) > 0:
                        print(f"\n First Insight:")
                        print(json.dumps(insights[0], indent=2))
                    else:
                        print("Insights array is EMPTY!")
                else:
                    print("No 'insights' key in response!")
                    print(f"Available keys: {list(parsed.keys())}")
                
                return parsed
                
            except json.JSONDecodeError as e:
                print(f"\n JSON PARSE ERROR: {e}")
                print(f"Error at position: {e.pos}")
                print(f"Problem area: {cleaned_content[max(0, e.pos-50):e.pos+50]}")
                
                # Try to manually construct valid JSON
                print("\n Attempting manual JSON construction...")
                
                # Create fallback insights
                return {
                    "insights": [
                        {
                            "title": "Manual Fallback Insight 1",
                            "detail": "This is a fallback insight because Gemini response couldn't be parsed. The search found relevant sources about: " + prompt,
                            "confidence": 0.6,
                            "category": "General"
                        },
                        {
                            "title": "Manual Fallback Insight 2", 
                            "detail": "Based on the search results, consider researching this topic further with the sources provided.",
                            "confidence": 0.5,
                            "category": "General"
                        }
                    ]
                }
            
        except Exception as e:
            print(f"\n GEMINI ERROR: {e}")
            import traceback
            print("\nFull traceback:")
            traceback.print_exc()
            return {"insights": []}
    
    async def run(self, prompt: str, max_results: int = 5) -> AnalyzeResponse:
        """Execute analysis"""
        import time
        start = time.time()
        
        print("\n" + "="*60)
        print(f"Starting Analysis")
        print(f"Query: {prompt}")
        print(f"Max Results: {max_results}")
        print("="*60)
        
        try:
            # Step 1: Search
            print("\n Step 1: Web Search")
            sources_data = await self.search_web(prompt, max_results)
            print(f"✓ Retrieved {len(sources_data)} sources")
            
            # Step 2: Analyze
            print("\n Step 2: Gemini Analysis")
            analysis = await self.analyze_with_gemini(prompt, sources_data)
            
            # Step 3: Format insights
            print("\n Step 3: Formatting Insights")
            insights = []
            
            raw_insights = analysis.get("insights", [])
            print(f"Raw insights from Gemini: {len(raw_insights)}")
            
            if not raw_insights:
                print("WARNING: No insights received from Gemini!")
            
            for idx, data in enumerate(raw_insights[:max_results]):
                try:
                    print(f"\nProcessing insight {idx + 1}:")
                    print(f"  Title: {data.get('title', 'N/A')}")
                    print(f"  Confidence: {data.get('confidence', 'N/A')}")
                    print(f"  Category: {data.get('category', 'N/A')}")
                    
                    insight = Insight(
                        title=str(data.get("title", f"Insight {idx + 1}"))[:200],
                        detail=str(data.get("detail", "No detail provided"))[:5000],
                        confidence=min(max(float(data.get("confidence", 0.5)), 0.0), 1.0),
                        category=str(data.get("category", "General"))[:50]
                    )
                    insights.append(insight)
                    print(f"  Successfully created insight object")
                    
                except Exception as e:
                    print(f"  Error creating insight: {e}")
                    print(f"  Data was: {data}")
            
            # Step 4: Format sources
            print(f"\n Step 4: Formatting Sources")
            sources = []
            for idx, data in enumerate(sources_data[:max_results]):
                try:
                    sources.append(Source(
                        title=data.get("title", "Source"),
                        url=data.get("url", ""),
                        snippet=data.get("snippet", "")[:200]
                    ))
                    print(f"Source {idx + 1}: {data.get('title', 'N/A')[:50]}")
                except Exception as e:
                    print(f"Error: {e}")
            
            elapsed = time.time() - start
            
            print("\n" + "="*60)
            print(" ANALYSIS COMPLETE")
            print(f"   Insights Generated: {len(insights)}")
            print(f"   Sources Found: {len(sources)}")
            print(f"   Processing Time: {elapsed:.2f}s")
            print("="*60 + "\n")
            
            return AnalyzeResponse(
                insights=insights,
                sources=sources,
                total_insights=len(insights),
                processing_time=round(elapsed, 2)
            )
            
        except Exception as e:
            print(f"\n FATAL ERROR: {e}")
            import traceback
            traceback.print_exc()
            
            return AnalyzeResponse(
                insights=[],
                sources=[],
                total_insights=0,
                processing_time=0.0
            )