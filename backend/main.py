"""
main.py - API Layer (Ollama edition)
Financial Intelligence Suite
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from chat_logic import ARIAChatAgent, ChatRequest, OLLAMA_MODEL, OLLAMA_BASE_URL
from engine import FinancialEngine

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Financial Intelligence Suite API",
    description="Predictive analysis + offline LLM chat via Ollama.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://financial-intelligence-suite.vercel.app",  # ← your Vercel URL
        "https://*.vercel.app",  # ← covers all preview deployments too
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------

_engine    = FinancialEngine()
_agent     = ARIAChatAgent(
    base_url=os.getenv("OLLAMA_BASE_URL", OLLAMA_BASE_URL),
    model=os.getenv("OLLAMA_MODEL", OLLAMA_MODEL),
)
_executor  = ThreadPoolExecutor(max_workers=4)

_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 300   # 5 minutes

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatBody(BaseModel):
    message:    str           = Field(..., min_length=1, max_length=2000)
    ticker:     Optional[str] = Field(None, max_length=20)
    session_id: str           = Field(default="default", max_length=64)

    @field_validator("ticker")
    @classmethod
    def upper(cls, v):
        return v.upper().strip() if v else v


class ChatOut(BaseModel):
    response:            str
    disclaimer_appended: bool
    session_id:          str
    model:               str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_CHARS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-^")

def validate_ticker(t: str) -> str:
    t = t.upper().strip()
    if not t or len(t) > 20:
        raise HTTPException(400, "Ticker must be 1–20 characters.")
    bad = set(t) - VALID_CHARS
    if bad:
        raise HTTPException(400, f"Invalid characters in ticker: {bad}")
    return t

async def run(fn, *args):
    return await asyncio.get_event_loop().run_in_executor(_executor, fn, *args)

def _sanitize(obj):
    """
    Recursively convert numpy scalars → native Python types so FastAPI's
    jsonable_encoder never sees numpy.bool_, numpy.float64, etc.
    """
    import numpy as np
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return None if np.isnan(obj) else float(obj)
    if isinstance(obj, np.ndarray):
        return [_sanitize(v) for v in obj.tolist()]
    return obj

def to_dict(result) -> dict:
    from dataclasses import asdict
    return _sanitize(asdict(result))

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def timing(request: Request, call_next):
    t0  = time.perf_counter()
    res = await call_next(request)
    res.headers["X-Process-Time"] = f"{time.perf_counter()-t0:.4f}s"
    return res

@app.exception_handler(Exception)
async def global_err(request: Request, exc: Exception):
    logger.exception("Unhandled: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health():
    return {"status": "healthy", "llm_backend": "ollama", "model": _agent._ollama.model}


@app.get("/ollama-status", tags=["System"])
async def ollama_status():
    """Check whether Ollama is reachable and which models are available."""
    available = await run(_agent._ollama.is_available)
    models    = await run(_agent._ollama.list_models) if available else []
    return {
        "ollama_running": available,
        "active_model":   _agent._ollama.model,
        "available_models": models,
    }


@app.get("/get-analysis/{ticker}", tags=["Analysis"])
async def get_analysis(ticker: str, period: str = "2y"):
    ticker = validate_ticker(ticker)

    # Validate period
    VALID_PERIODS = {"1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"}
    if period not in VALID_PERIODS:
        period = "2y"

    cache_key = f"{ticker}:{period}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key][0] < CACHE_TTL:
        d = dict(_cache[cache_key][1]); d["cached"] = True
        return d

    try:
        result = await asyncio.wait_for(
            run(_engine.analyze, ticker, period), timeout=60.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(504, f"Analysis timed out for '{ticker}'.")

    if result.error:
        raise HTTPException(404, result.error)

    d = to_dict(result)
    d["cached"] = False
    _cache[cache_key] = (now, d)
    return d


@app.get("/get-recommendations", tags=["Analysis"])
async def get_recommendations():
    WATCHLIST = ["AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","JPM","V","JNJ"]

    async def _one(t):
        try:
            r = await asyncio.wait_for(run(_engine.analyze, t), timeout=45.0)
            if r.error: return None
            return {
                "ticker": r.ticker, "company_name": r.company_name,
                "current_price": r.current_price, "signal": r.signal,
                "signal_strength": r.signal_strength,
                "expected_return_pct": r.forecast.expected_return_pct,
                "sector": r.sector,
            }
        except Exception as e:
            logger.warning("Rec failed %s: %s", t, e); return None

    results = await asyncio.gather(*[_one(t) for t in WATCHLIST])
    valid   = [r for r in results if r]
    valid.sort(key=lambda x: x["signal_strength"], reverse=True)
    return valid


@app.post("/chat", response_model=ChatOut, tags=["Chat"])
async def chat(body: ChatBody):
    ctx = None
    if body.ticker:
        t = validate_ticker(body.ticker)
        if t in _cache:
            _, ctx = _cache[t]
        else:
            try:
                r = await asyncio.wait_for(run(_engine.analyze, t), timeout=45.0)
                if not r.error:
                    ctx = to_dict(r)
                    _cache[t] = (time.time(), ctx)
            except Exception as e:
                logger.warning("Could not fetch context: %s", e)

    req = ChatRequest(message=body.message, ticker=body.ticker, analysis_context=ctx)

    try:
        res = await asyncio.wait_for(
            run(_agent.chat, req, body.session_id),
        timeout=180.0,   # local inference may take time
        )
    except asyncio.TimeoutError:
        raise HTTPException(504, "LLM inference timed out. Try a smaller/faster model.")

    if res.error in ("ollama_unavailable", "connect_error"):
        raise HTTPException(503, res.response)

    return ChatOut(
        response=res.response,
        disclaimer_appended=res.disclaimer_appended,
        session_id=body.session_id,
        model=_agent._ollama.model,
    )


@app.delete("/chat/session/{sid}", tags=["Chat"])
async def clear_session(sid: str):
    _agent.clear_session(sid)
    return {"cleared": True, "session_id": sid}


@app.delete("/cache/{ticker}", tags=["System"])
async def bust_cache(ticker: str):
    t = validate_ticker(ticker)
    removed = _cache.pop(t, None)
    return {"invalidated": removed is not None, "ticker": t}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)