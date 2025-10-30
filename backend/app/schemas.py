# backend/app/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AnalyzeRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Marketing query to analyze"
    )
    max_results: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of insights"
    )


class Insight(BaseModel):
    title: str = Field(..., description="Insight title")
    detail: str = Field(..., description="Detailed explanation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    category: str = Field(..., description="Insight category")


class Source(BaseModel):
    title: str = Field(..., description="Source title")
    url: str = Field(..., description="Source URL")
    snippet: str = Field(..., description="Relevant excerpt")


class AnalyzeResponse(BaseModel):
    insights: List[Insight] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    total_insights: int = Field(..., ge=0)
    processing_time: float = Field(..., ge=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str