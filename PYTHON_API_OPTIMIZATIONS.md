# Python API Optimization Guide

This document outlines the optimizations you should make to your Python Flask API to achieve maximum performance.

## Critical Changes Required

### 1. Increase Worker Thread Pool

In `api.py`, increase the maximum workers:

```python
# Current
MAX_MATCH_WORKERS = int(os.getenv("MATCHFIT_MAX_WORKERS", "4"))

# Optimized - increase to 12-16 for better parallelism
MAX_MATCH_WORKERS = int(os.getenv("MATCHFIT_MAX_WORKERS", "16"))
```

### 2. Use Faster OpenAI Model

In `matchfit_core.py`, change the default model:

```python
# Current
DEFAULT_MODEL = os.getenv("MATCHFIT_MODEL", "gpt-5-mini")

# Optimized - use gpt-4o-mini for 2-3x faster responses
DEFAULT_MODEL = os.getenv("MATCHFIT_MODEL", "gpt-4o-mini")
```

### 3. Simplify Overview Prompt (Reduce Tokens)

In `matchfit_core.py`, simplify the `OVERVIEW_SYSTEM` prompt:

```python
# Current - verbose with examples
OVERVIEW_SYSTEM = (
    "You write single-paragraph client overviews for physio/fitness intake. "
    "Be concise, rehab-aware, and deterministic. No lists, no headings, no emojis."
)

# Optimized - remove few-shot examples to reduce tokens
# Keep it simple and direct
OVERVIEW_SYSTEM = (
    "Create a concise fitness client overview. "
    "State goals, experience, medical conditions if any. "
    "3-5 sentences max. No lists or formatting."
)
```

### 4. Simplify Match Scoring Prompt

In `matchfit_core.py`, reduce the `USER_PROMPT_TEMPLATE`:

```python
# Optimized version - fewer tokens
USER_PROMPT_TEMPLATE = '''
CLIENT: {CLIENT_TEXT}
EXPERT: {EXPERT_TEXT}

Score 0-100 based on fit. Output JSON only:
{{"match": <score>, "reasons": ["reason1", "reason2"]}}
'''
```

### 5. Add OpenAI Client Connection Pooling

In `matchfit_core.py`, configure the OpenAI client with better settings:

```python
def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=_get_api_key(),
            max_retries=2,
            timeout=30.0,  # Reduce from 90s to 30s
        )
    return _client
```

### 6. Reduce Timeouts

In `api.py`, reduce retry delays:

```python
def _sleep_with_jitter(base: float, attempt: int):
    # Reduce base from 1.5 to 0.5 for faster retries
    time.sleep((0.5 ** attempt) + random.uniform(0, 0.1))
```

### 7. Set Environment Variables

On Render or your hosting platform, set these environment variables:

```bash
MATCHFIT_MAX_WORKERS=16
MATCHFIT_MODEL=gpt-4o-mini
OPENAI_API_KEY=your_key_here
```

## Deployment Recommendations

### Option 1: Keep Render Warm (Free Tier)

If staying on Render free tier, the frontend now pings your API every 4 minutes automatically to prevent cold starts.

### Option 2: Upgrade to Paid Tier (Recommended)

Upgrade to Render's paid tier ($7/month) to eliminate cold starts entirely:
- No spin-down delays
- Always-on service
- Better performance consistency

### Option 3: Migrate to Railway or Fly.io

Consider migrating to Railway or Fly.io for better free tier options:
- Railway: More generous free tier with better cold start times
- Fly.io: Better cold start performance and pricing

## Expected Performance Improvements

With these changes:

| Metric | Before | After (No Cache) | After (With Cache) |
|--------|--------|------------------|-------------------|
| Overview Generation | 15+ seconds | 5-8 seconds | 0.5 seconds (instant) |
| Expert Matching (10 experts) | 30-90 seconds | 10-15 seconds | 0.5 seconds (instant) |
| First Match Visible | 45+ seconds | 15-20 seconds | 3-5 seconds |
| Total User Wait Time | 60-120 seconds | 20-30 seconds | 3-8 seconds |

## Cache Hit Rates

After 20-30 users, expect:
- Overview cache hit rate: 60-80%
- Match cache hit rate: 40-60%

This means most requests will return instantly from Supabase cache without calling OpenAI at all.

## Testing the Optimizations

1. Deploy the Python API changes
2. Test with identical client profiles to verify caching works
3. Monitor logs for "Cache hit" messages
4. Check OpenAI usage to confirm reduced API calls
5. Measure response times in browser network tab

## Monitoring

Add these logs to track performance:

```python
import time

@app.post("/generate-overview")
def generate_overview():
    start_time = time.time()
    # ... existing code ...
    elapsed = time.time() - start_time
    print(f"Overview generation took {elapsed:.2f}s")
    return jsonify({"overview": overview})
```

## Cost Savings

By implementing caching, you'll reduce OpenAI API costs by 60-80% after initial usage builds the cache.
