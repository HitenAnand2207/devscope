# 2026-08-11 — Analyze Route Improvements

- Added GET support for `/api/analyze?username=...` to allow shareable links.
- Improved client IP parsing to handle `x-forwarded-for` lists and strip `::ffff:` prefixes.
- Exposed rate-limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) and returned `X-Cache: HIT` on cache hits.
- Added username length validation to avoid malformed GitHub usernames.
