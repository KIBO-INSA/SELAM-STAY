"""
Sentiment analysis for guest feedback.
Uses a simple keyword-based approach as fallback when transformers is unavailable,
and HuggingFace transformers when available.
"""

_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from transformers import pipeline
            _model = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
        except Exception:
            _model = "fallback"
    return _model


POSITIVE_WORDS = [
    "great", "amazing", "excellent", "wonderful", "fantastic", "love",
    "perfect", "beautiful", "good", "happy", "satisfied", "clean",
    "friendly", "helpful", "nice", "comfortable", "enjoyed"
]

NEGATIVE_WORDS = [
    "bad", "terrible", "awful", "horrible", "dirty", "broken",
    "rude", "cold", "slow", "problem", "issue", "complaint",
    "disappointed", "unacceptable", "poor", "fix", "wrong"
]


def _fallback_sentiment(text: str) -> dict:
    """Simple keyword-based sentiment when ML model unavailable."""
    text_lower = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in text_lower)
    neg = sum(1 for w in NEGATIVE_WORDS if w in text_lower)

    if neg > pos:
        return {"sentiment": "negative", "score": 0.85, "alert": True}
    elif pos > neg:
        return {"sentiment": "positive", "score": 0.85, "alert": False}
    else:
        return {"sentiment": "neutral", "score": 0.55, "alert": False}


def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment of guest feedback text."""
    model = _get_model()

    if model == "fallback":
        return _fallback_sentiment(text)

    try:
        result = model(text[:512])[0]
        label = result["label"].lower()
        score = result["score"]

        if label == "positive" and score > 0.85:
            tier = "positive"
        elif label == "negative" and score > 0.75:
            tier = "negative"
        else:
            tier = "neutral"

        return {
            "sentiment": tier,
            "score": round(score, 3),
            "alert": tier == "negative"
        }
    except Exception:
        return _fallback_sentiment(text)
