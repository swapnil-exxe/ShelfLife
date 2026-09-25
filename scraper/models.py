from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ExtractedMetadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None
    modified_at: Optional[str] = None
    canonical_url: Optional[str] = None
    site_name: Optional[str] = None
    language: Optional[str] = "en"
    image: Optional[str] = None
    json_ld: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class ExtractedContent(BaseModel):
    title: str = ""
    description: str = ""
    text: str = ""
    clean_text: str = ""
    ai_input_text: str = ""
    headings: List[str] = Field(default_factory=list)
    links: List[str] = Field(default_factory=list)

class ScrapeResult(BaseModel):
    url: str
    final_url: str
    status_code: int = 200
    html: Optional[str] = ""
    text: str = ""
    title: str = ""
    description: str = ""
    author: Optional[str] = None
    published_at: Optional[str] = None
    canonical_url: Optional[str] = None
    site_name: Optional[str] = None
    language: str = "en"
    image: Optional[str] = None
    fetch_method: str = "http" # http, scrapling_adaptive, dynamic_browser, metadata_fallback
    elapsed_ms: int = 0
    quality_score: int = 0 # 0-100 technical quality score
    content_hash: str = ""
    success: bool = True
    error: Optional[str] = None
    failure_reason: Optional[str] = None # DYNAMIC_CONTENT, RATE_LIMITED, ROBOTS_DISALLOWED, AUTH_REQUIRED, NETWORK_ERROR, PARSING_FAILED, UNSUPPORTED_CONTENT

class ScrapeError(BaseModel):
    url: str
    error: str
    code: str = "FETCH_FAILED"
