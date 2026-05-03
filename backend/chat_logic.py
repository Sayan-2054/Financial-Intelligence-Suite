"""
chat_logic.py - Conversational AI Engine (Ollama / local LLM)
Financial Intelligence Suite

Calls the local Ollama REST API (http://localhost:11434) instead of
any cloud provider. No API keys required — fully offline.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Ollama config — change model name to whatever you have pulled locally
# e.g. "llama3", "mistral", "gemma3", "phi3", "deepseek-r1", etc.
# ---------------------------------------------------------------------------

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL    = "llama3.2"   # ← change to your preferred model
OLLAMA_TIMEOUT  = 180          # seconds — increase if your GPU/CPU is slow

# ---------------------------------------------------------------------------
# System Prompt — Disciplined Financial Analyst Persona
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are ARIA (Analytical Risk Intelligence Assistant), a disciplined,
institutional-grade financial analyst embedded in a professional trading platform.

## CORE PERSONA
- Speak with the precision and measured tone of a seasoned portfolio manager
- Back every claim with the technical data provided in your context
- Use financial terminology correctly but explain concepts clearly when needed
- Maintain analytical objectivity — neither blindly bullish nor catastrophically bearish

## STRICT GUARDRAILS (NON-NEGOTIABLE)
1. NEVER guarantee returns, predict exact prices, or promise profits
2. ALWAYS include a risk disclaimer when giving investment-related guidance
3. NEVER recommend leverage, margin trading, or specific position sizing
4. If asked about illegal activities (market manipulation, insider trading), refuse clearly
5. Clearly distinguish between historical data (fact) and forecasts (probabilistic estimates)

## RESPONSE STRUCTURE
- Lead with the most critical insight from the provided indicators
- Support with 2-3 specific data points from the context
- Close with a balanced risk consideration
- Add: "This is not financial advice. Always consult a SEBI-registered advisor before investing."

## CONTEXT USAGE
You will receive structured context including technical indicators, price forecasts,
and signal classifications. Use this as your primary source of truth.
Do not fabricate data points not present in the context.

## TONE
- Professional but accessible
- Confident in analysis, humble about uncertainty
- Avoid: "definitely", "guaranteed", "sure thing", "will crash"
- Use: "suggests", "indicates", "historically correlated", "probability-weighted"
"""

# ---------------------------------------------------------------------------
# Data Containers
# ---------------------------------------------------------------------------

@dataclass
class ChatRequest:
    message: str
    ticker: Optional[str] = None
    analysis_context: Optional[dict] = None


@dataclass
class ChatResponse:
    response: str
    disclaimer_appended: bool = False
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Context Builder (RAG injection)
# ---------------------------------------------------------------------------

class ContextBuilder:
    """Formats live analysis data into a structured context block."""

    def build(self, ticker: str, analysis: dict) -> str:
        if not analysis:
            return f"No analysis data available for {ticker}."

        ind      = analysis.get("indicators", {})
        forecast = analysis.get("forecast",   {})
        signal   = analysis.get("signal",     "HOLD")
        strength = analysis.get("signal_strength", 50)

        lines = [
            f"## CURRENT ANALYSIS CONTEXT FOR {ticker}",
            f"Company      : {analysis.get('company_name', ticker)}",
            f"Current Price: {analysis.get('currency','USD')} {analysis.get('current_price','N/A')}",
            f"Sector       : {analysis.get('sector', 'N/A')}",
            "",
            "### COMPOSITE SIGNAL",
            f"Signal: {signal}  (Strength: {strength}/100)",
            "",
            "### TECHNICAL INDICATORS",
            f"RSI (14)        : {ind.get('rsi', 'N/A')}  "
            f"({'Oversold' if (ind.get('rsi') or 50) < 30 else 'Overbought' if (ind.get('rsi') or 50) > 70 else 'Neutral'})",
            f"MACD Line       : {ind.get('macd', 'N/A')}",
            f"MACD Signal     : {ind.get('macd_signal', 'N/A')}",
            f"MACD Histogram  : {ind.get('macd_histogram', 'N/A')}  "
            f"({'Bullish' if (ind.get('macd_histogram') or 0) > 0 else 'Bearish'} momentum)",
            f"50-Day SMA      : {ind.get('sma_50', 'N/A')}  — price is {ind.get('price_vs_sma50', 'N/A')} this level",
            f"200-Day SMA     : {ind.get('sma_200', 'N/A')} — price is {ind.get('price_vs_sma200', 'N/A')} this level",
            f"Golden Cross    : {ind.get('golden_cross', False)}",
            f"Death Cross     : {ind.get('death_cross',  False)}",
            "",
            "### 7-DAY PRICE FORECAST (ML Model)",
            f"Direction       : {forecast.get('direction', 'neutral').upper()}",
            f"Expected Return : {forecast.get('expected_return_pct', 0):.2f}%",
            "",
            "### FUNDAMENTALS",
            f"Market Cap : {self._fmt_cap(analysis.get('market_cap'))}",
            f"P/E Ratio  : {analysis.get('pe_ratio', 'N/A')}",
            "",
            "Note: All forecasts are probabilistic estimates. Past performance does not guarantee future results.",
        ]
        return "\n".join(lines)

    def _fmt_cap(self, cap) -> str:
        if cap is None: return "N/A"
        if cap >= 1e12: return f"${cap/1e12:.2f}T"
        if cap >= 1e9:  return f"${cap/1e9:.2f}B"
        if cap >= 1e6:  return f"${cap/1e6:.2f}M"
        return f"${cap:,.0f}"


# ---------------------------------------------------------------------------
# Conversation Manager (sliding window)
# ---------------------------------------------------------------------------

class ConversationManager:
    MAX_TURNS = 10   # keep last N user+assistant pairs

    def __init__(self):
        self._sessions: dict[str, list[dict]] = {}

    def get(self, sid: str) -> list[dict]:
        return self._sessions.get(sid, [])

    def add(self, sid: str, role: str, content: str):
        hist = self._sessions.setdefault(sid, [])
        hist.append({"role": role, "content": content})
        # Trim to window (×2 because each turn = user + assistant)
        if len(hist) > self.MAX_TURNS * 2:
            self._sessions[sid] = hist[-(self.MAX_TURNS * 2):]

    def clear(self, sid: str):
        self._sessions.pop(sid, None)


# ---------------------------------------------------------------------------
# Ollama Client
# ---------------------------------------------------------------------------

class OllamaClient:
    """
    Thin wrapper around Ollama's /api/chat endpoint.
    Uses the OpenAI-compatible messages format that Ollama supports.
    """

    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model    = model

    def chat(self, messages: list[dict], system: str) -> str:
        """
        Send a conversation to Ollama and return the assistant reply.
        Raises on network / model errors.
        """
        payload = {
            "model":    self.model,
            "messages": [{"role": "system", "content": system}, *messages],
            "stream":   False,
            "options": {
                "temperature": 0.3,   # lower = more factual / less creative
                "num_predict": 1024,
            },
        }

        with httpx.Client(timeout=OLLAMA_TIMEOUT) as client:
            resp = client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()

        # Ollama returns: {"message": {"role": "assistant", "content": "..."}, ...}
        return data["message"]["content"]

    def list_models(self) -> list[str]:
        """Return names of locally available models."""
        with httpx.Client(timeout=10) as client:
            resp = client.get(f"{self.base_url}/api/tags")
            resp.raise_for_status()
        return [m["name"] for m in resp.json().get("models", [])]

    def is_available(self) -> bool:
        """Quick health check — returns False if Ollama isn't running."""
        try:
            with httpx.Client(timeout=3) as client:
                client.get(f"{self.base_url}/api/tags").raise_for_status()
            return True
        except Exception:
            return False


# ---------------------------------------------------------------------------
# ARIA Chat Agent
# ---------------------------------------------------------------------------

DISCLAIMER = (
    "\n\n---\n"
    "*⚠️ Disclaimer: This analysis is for informational purposes only "
    "and does not constitute financial advice. Please consult a SEBI-registered "
    "investment advisor before making any investment decisions.*"
)

DISCLAIMER_TRIGGERS = {
    "buy", "sell", "invest", "should i", "good stock", "recommend",
    "worth", "portfolio", "return", "profit", "loss", "risk", "entry",
}


class ARIAChatAgent:
    """
    RAG-augmented conversational agent backed by a local Ollama model.

    Pattern:
      1. Build context from analysis data  (Retrieval)
      2. Inject context into user message  (Augmentation)
      3. Call local Ollama model           (Generation)
    """

    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self._ollama  = OllamaClient(base_url=base_url, model=model)
        self._ctx     = ContextBuilder()
        self._convmgr = ConversationManager()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def chat(self, request: ChatRequest, session_id: str = "default") -> ChatResponse:
        # 1 — Check Ollama is reachable
        if not self._ollama.is_available():
            return ChatResponse(
                response=(
                    "⚠ Cannot reach Ollama at `localhost:11434`. "
                    "Make sure Ollama is running (`ollama serve`) and the model "
                    f"`{self._ollama.model}` is pulled (`ollama pull {self._ollama.model}`)."
                ),
                error="ollama_unavailable",
            )

        # 2 — Build RAG context block
        context_prefix = ""
        if request.ticker and request.analysis_context:
            ctx_text = self._ctx.build(request.ticker, request.analysis_context)
            context_prefix = f"<retrieved_context>\n{ctx_text}\n</retrieved_context>\n\n"

        user_content = f"{context_prefix}{request.message}"

        # 3 — Retrieve session history and append new message
        history = self._convmgr.get(session_id)
        messages = history + [{"role": "user", "content": user_content}]

        # 4 — Call Ollama
        try:
            reply = self._ollama.chat(messages=messages, system=SYSTEM_PROMPT)
        except httpx.ConnectError:
            return ChatResponse(
                response="⚠ Could not connect to Ollama. Is `ollama serve` running?",
                error="connect_error",
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return ChatResponse(
                    response=(
                        f"⚠ Model `{self._ollama.model}` not found. "
                        f"Run: `ollama pull {self._ollama.model}`"
                    ),
                    error="model_not_found",
                )
            logger.exception("Ollama HTTP error: %s", exc)
            return ChatResponse(response="⚠ Ollama returned an error. Check the server logs.", error=str(exc))
        except Exception as exc:
            logger.exception("Unexpected chat error: %s", exc)
            return ChatResponse(response="⚠ Unexpected error. Please try again.", error=str(exc))

        # 5 — Append disclaimer if investment-related
        lower = request.message.lower()
        disclaimer_appended = any(t in lower for t in DISCLAIMER_TRIGGERS)
        if disclaimer_appended:
            reply += DISCLAIMER

        # 6 — Persist conversation
        self._convmgr.add(session_id, "user",      user_content)
        self._convmgr.add(session_id, "assistant", reply)

        return ChatResponse(response=reply, disclaimer_appended=disclaimer_appended)

    def clear_session(self, session_id: str):
        self._convmgr.clear(session_id)

    @property
    def available_models(self) -> list[str]:
        return self._ollama.list_models()