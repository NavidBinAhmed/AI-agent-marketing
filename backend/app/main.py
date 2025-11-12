from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import logging

from .schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
from .agent import MarketingAgent
from .config import get_settings, Settings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Marketing Analysis API",
    description="AI-powered brand and marketing growth assistant using Google Gemini and SerpAPI",
    version="1.0.0"
)

# CORS middleware that enables requests from frontend origins
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = MarketingAgent()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


@app.get("/", response_model=dict)
async def root():
    return {
        "message": "Marketing Analysis API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.environment
    )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_marketing(request: AnalyzeRequest):
    logger.info(f"Analyzing: {request.prompt[:50]}...")
    
    try:
        result = await asyncio.wait_for(
            agent.run(request.prompt, max_results=request.max_results),
            timeout=settings.request_timeout
        )
        
        logger.info(f"Analysis complete: {result.total_insights} insights")
        return result
        
    except asyncio.TimeoutError:
        logger.error("Request timeout")
        raise HTTPException(
            status_code=504,
            detail=f"Request timeout after {settings.request_timeout}s"
        )
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)