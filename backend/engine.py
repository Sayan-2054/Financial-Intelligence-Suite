"""
engine.py - Data & Prediction Engine
Financial Intelligence Suite

yfinance >= 1.3.0 uses curl_cffi internally to handle Yahoo Finance auth.
Do NOT pass a requests.Session — let yfinance manage its own session.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data Containers
# ---------------------------------------------------------------------------

@dataclass
class TechnicalIndicators:
    rsi:             Optional[float] = None
    macd:            Optional[float] = None
    macd_signal:     Optional[float] = None
    macd_histogram:  Optional[float] = None
    sma_50:          Optional[float] = None
    sma_200:         Optional[float] = None
    current_price:   Optional[float] = None
    price_vs_sma50:  Optional[str]   = None   # "above" | "below"
    price_vs_sma200: Optional[str]   = None
    golden_cross:    bool            = False
    death_cross:     bool            = False


@dataclass
class PriceForecast:
    dates:                  list[str]   = field(default_factory=list)
    predicted_prices:       list[float] = field(default_factory=list)
    confidence_band_upper:  list[float] = field(default_factory=list)
    confidence_band_lower:  list[float] = field(default_factory=list)
    direction:              str         = "neutral"
    expected_return_pct:    float       = 0.0


@dataclass
class AnalysisResult:
    ticker:           str
    company_name:     str
    current_price:    float
    currency:         str
    indicators:       TechnicalIndicators
    forecast:         PriceForecast
    signal:           str
    signal_strength:  float
    historical_prices: list[dict]
    sector:           Optional[str]   = None
    market_cap:       Optional[float] = None
    pe_ratio:         Optional[float] = None
    error:            Optional[str]   = None


# ---------------------------------------------------------------------------
# Technical Indicator Calculations
# ---------------------------------------------------------------------------

class IndicatorCalculator:

    @staticmethod
    def rsi(prices: pd.Series, period: int = 14) -> pd.Series:
        delta    = prices.diff()
        gain     = delta.clip(lower=0)
        loss     = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
        rs       = avg_gain / avg_loss.replace(0, np.nan)
        return 100 - (100 / (1 + rs))

    @staticmethod
    def macd(
        prices: pd.Series,
        fast: int = 12, slow: int = 26, signal: int = 9,
    ) -> tuple[pd.Series, pd.Series, pd.Series]:
        ema_fast    = prices.ewm(span=fast,   adjust=False).mean()
        ema_slow    = prices.ewm(span=slow,   adjust=False).mean()
        macd_line   = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        return macd_line, signal_line, macd_line - signal_line

    @staticmethod
    def sma(prices: pd.Series, period: int) -> pd.Series:
        return prices.rolling(window=period).mean()


# ---------------------------------------------------------------------------
# Prediction Model
# ---------------------------------------------------------------------------

class RandomForestPredictor:
    N_LAGS        = 10
    N_ESTIMATORS  = 200
    FORECAST_DAYS = 7

    def __init__(self):
        self._model  = RandomForestRegressor(
            n_estimators=self.N_ESTIMATORS, max_depth=8,
            min_samples_split=5, random_state=42, n_jobs=-1,
        )
        self._scaler = MinMaxScaler()

    def _build_features(self, df: pd.DataFrame) -> pd.DataFrame:
        feat  = pd.DataFrame(index=df.index)
        close = df["Close"]

        for lag in range(1, self.N_LAGS + 1):
            feat[f"lag_{lag}"] = close.pct_change(lag)

        feat["rsi"]          = IndicatorCalculator.rsi(close)
        ml, sl, _            = IndicatorCalculator.macd(close)
        feat["macd"]         = ml
        feat["macd_signal"]  = sl
        feat["sma50_ratio"]  = close / IndicatorCalculator.sma(close, 50)
        feat["sma200_ratio"] = close / IndicatorCalculator.sma(close, 200)
        feat["vol_ratio"]    = (
            df["Volume"] / df["Volume"].rolling(20).mean()
            if "Volume" in df.columns and df["Volume"].sum() > 0
            else 1.0
        )
        feat["volatility"]   = close.pct_change().rolling(10).std()
        return feat.dropna()

    def fit_and_forecast(self, df: pd.DataFrame):
        features = self._build_features(df)
        close    = df["Close"].reindex(features.index)
        target   = close.pct_change().shift(-1).reindex(features.index).dropna()
        X        = features.reindex(target.index)

        if len(X) < 60:
            raise ValueError("Need ≥ 60 rows of history.")

        X_scaled = self._scaler.fit_transform(X)
        self._model.fit(X_scaled, target.values)

        last_feat     = features.iloc[[-1]].copy()
        current_price = float(close.iloc[-1])
        preds, upper, lower = [], [], []

        for _ in range(self.FORECAST_DAYS):
            Xp           = self._scaler.transform(last_feat)
            tree_rets    = np.array([t.predict(Xp)[0] for t in self._model.estimators_])
            mean_ret     = float(np.mean(tree_rets))
            std_ret      = float(np.std(tree_rets))
            current_price *= (1 + mean_ret)
            preds.append(round(current_price, 4))
            upper.append(round(current_price * (1 + 1.5 * std_ret), 4))
            lower.append(round(current_price * (1 - 1.5 * std_ret), 4))
            last_feat["lag_1"] = mean_ret

        return preds, upper, lower


# ---------------------------------------------------------------------------
# Signal Generator
# ---------------------------------------------------------------------------

class SignalGenerator:

    def compute(self, ind: TechnicalIndicators, fc: PriceForecast) -> tuple[str, float]:
        score = 0.0

        if ind.rsi is not None:
            rsi = ind.rsi
            score += 30 if rsi < 30 else -30 if rsi > 70 else (50 - rsi) * 0.4

        if ind.macd_histogram is not None:
            score += min(20, max(-20, ind.macd_histogram * 100))

        if ind.price_vs_sma50  == "above": score += 15
        elif ind.price_vs_sma50 == "below": score -= 15
        if ind.price_vs_sma200 == "above": score += 15
        elif ind.price_vs_sma200 == "below": score -= 15

        if ind.golden_cross: score += 10
        if ind.death_cross:  score -= 10
        if fc.direction == "bullish": score += 10
        elif fc.direction == "bearish": score -= 10

        strength = min(100, max(0, (score + 100) / 2))
        signal   = "BUY" if strength >= 60 else "SELL" if strength <= 40 else "HOLD"
        return signal, round(strength, 1)


# ---------------------------------------------------------------------------
# Main Engine
# ---------------------------------------------------------------------------

class FinancialEngine:

    def __init__(self):
        self._predictor  = RandomForestPredictor()
        self._signal_gen = SignalGenerator()

    def analyze(self, ticker: str, period: str = "2y") -> AnalysisResult:
        ticker = ticker.upper().strip()
        logger.info("Analyzing %s period=%s", ticker, period)

        try:
            df, info = self._fetch(ticker, period)
        except Exception as exc:
            logger.error("Fetch failed for %s: %s", ticker, exc)
            return self._error_result(ticker, str(exc))

        indicators = self._indicators(df)
        forecast   = self._forecast(df)
        signal, strength = self._signal_gen.compute(indicators, forecast)

        return AnalysisResult(
            ticker           = ticker,
            company_name     = info.get("longName", ticker),
            current_price    = indicators.current_price or 0.0,
            currency         = info.get("currency", "USD"),
            indicators       = indicators,
            forecast         = forecast,
            signal           = signal,
            signal_strength  = strength,
            historical_prices= self._serialize(df),
            sector           = info.get("sector"),
            market_cap       = info.get("marketCap"),
            pe_ratio         = info.get("trailingPE"),
        )

    # ------------------------------------------------------------------
    # Private
    # ------------------------------------------------------------------

    @staticmethod
    def _interval(period: str) -> str:
        """Pick the best yfinance interval for a given period."""
        return {
            "1d":  "1m",
            "5d":  "5m",
            "1mo": "1h",
            "3mo": "1d",
            "6mo": "1d",
            "1y":  "1d",
            "2y":  "1d",
            "5y":  "1wk",
            "10y": "1wk",
            "ytd": "1d",
            "max": "1mo",
        }.get(period, "1d")

    def _fetch(self, ticker: str, period: str = "2y") -> tuple[pd.DataFrame, dict]:
        """
        Fetch OHLCV via yfinance >= 1.3.0.
        Do NOT pass session= — yfinance now uses curl_cffi internally.
        """
        interval = self._interval(period)
        stock    = yf.Ticker(ticker)
        df       = stock.history(period=period, interval=interval, auto_adjust=True)

        if df.empty:
            logger.warning("%s: history() empty, trying download()", ticker)
            df = yf.download(
                ticker, period=period, interval=interval,
                auto_adjust=True, progress=False,
            )

        if df.empty:
            raise ValueError(
                f"No price data found for '{ticker}'. "
                "Check the ticker symbol (e.g. use RELIANCE.NS for Indian stocks)."
            )

        # Flatten MultiIndex columns that download() sometimes returns
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df.index = pd.to_datetime(df.index)
        df.sort_index(inplace=True)

        # info can fail for some tickers — degrade gracefully
        try:
            info = stock.info or {}
        except Exception:
            info = {}

        return df, info

    def _indicators(self, df: pd.DataFrame) -> TechnicalIndicators:
        close = df["Close"]
        ind   = TechnicalIndicators()

        ind.current_price = round(float(close.iloc[-1]), 4)

        rsi_s = IndicatorCalculator.rsi(close)
        if not rsi_s.dropna().empty:
            ind.rsi = round(float(rsi_s.iloc[-1]), 2)

        ml, sl, hist = IndicatorCalculator.macd(close)
        ind.macd           = round(float(ml.iloc[-1]),   4)
        ind.macd_signal    = round(float(sl.iloc[-1]),   4)
        ind.macd_histogram = round(float(hist.iloc[-1]), 4)

        sma50  = IndicatorCalculator.sma(close, 50)
        sma200 = IndicatorCalculator.sma(close, 200)

        if not sma50.dropna().empty:
            ind.sma_50          = round(float(sma50.iloc[-1]), 4)
            ind.price_vs_sma50  = "above" if ind.current_price > ind.sma_50 else "below"

        if not sma200.dropna().empty:
            ind.sma_200         = round(float(sma200.iloc[-1]), 4)
            ind.price_vs_sma200 = "above" if ind.current_price > ind.sma_200 else "below"

        # Golden / Death cross — did the 50 cross the 200 in the last 5 days?
        if not sma50.dropna().empty and not sma200.dropna().empty:
            aligned = pd.DataFrame({"s50": sma50, "s200": sma200}).dropna().tail(5)
            if len(aligned) >= 2:
                prev = aligned["s50"].iloc[-2] - aligned["s200"].iloc[-2]
                curr = aligned["s50"].iloc[-1] - aligned["s200"].iloc[-1]
                ind.golden_cross = bool(prev < 0 < curr)
                ind.death_cross  = bool(prev > 0 > curr)

        return ind

    def _forecast(self, df: pd.DataFrame) -> PriceForecast:
        fc = PriceForecast()
        try:
            preds, upper, lower = self._predictor.fit_and_forecast(df)
        except Exception as exc:
            logger.warning("Forecast skipped: %s", exc)
            return fc

        start = datetime.now() + timedelta(days=1)
        fc.dates                 = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(len(preds))]
        fc.predicted_prices      = preds
        fc.confidence_band_upper = upper
        fc.confidence_band_lower = lower

        if preds:
            ret = (preds[-1] - float(df["Close"].iloc[-1])) / float(df["Close"].iloc[-1]) * 100
            fc.expected_return_pct = round(ret, 2)
            fc.direction = "bullish" if ret > 1.5 else "bearish" if ret < -1.5 else "neutral"

        return fc

    @staticmethod
    def _serialize(df: pd.DataFrame, tail: int = 180) -> list[dict]:
        return [
            {
                "date":   idx.strftime("%Y-%m-%d"),
                "open":   round(float(row.get("Open",   0)), 4),
                "high":   round(float(row.get("High",   0)), 4),
                "low":    round(float(row.get("Low",    0)), 4),
                "close":  round(float(row.get("Close",  0)), 4),
                "volume": int(row.get("Volume", 0)),
            }
            for idx, row in df.tail(tail).iterrows()
        ]

    @staticmethod
    def _error_result(ticker: str, msg: str) -> AnalysisResult:
        return AnalysisResult(
            ticker=ticker, company_name=ticker, current_price=0.0,
            currency="USD", indicators=TechnicalIndicators(),
            forecast=PriceForecast(), signal="HOLD", signal_strength=50.0,
            historical_prices=[], error=msg,
        )