# Imou integration
Implemented: authenticated server-side account device listing, regional allowlist,
HMAC-SHA256 signing, page navigation, filtered public response and mapping an Imou
device/channel to an existing camera. Credentials are transient React state and are
sent in the HTTPS POST body; neither credentials nor tokens are persisted or logged.
Re-enter credentials on reopening the connections panel. Tokens exist only during
one listing request. No automatic polling, external binding/transfer, callback
registration, event receipt, live player or clip download is implemented.

Protocol source, checked 2026-09-21:
https://open.imoulife.com/book/http/develop.html
The current specification uses SHA256(secret) encoded as lowercase hex as the HMAC
key, then Base64(HMAC-SHA256(source, key)). Its reference vector is tested.
The official pyimouapi 1.4.1 source still uses MD5. This adapter follows the current
published protocol instead; real credentials must validate provider acceptance.
No fallback to older authentication has been added.

Device listing fields and pagination reference:
https://github.com/Imou-OpenPlatform/Py-Imou-Open-Api
Official package pyimouapi 1.4.1, device.py and const.py.

Association is local metadata, not proof of ownership or device compatibility.
Only the currently owner-private site is supported. Before reseller access:
implement application identity and tenant authorization, encrypted per-tenant
credentials, provider ownership checks for mapping, quotas/rate limits, background
token lifecycle, and a provider callback receiver accessible without browser login.
Do not remove the existing private access gate to enable callbacks.

Validation: mocked provider responses, official signature test vector, server-side
identity/origin checks, non-disclosure of token/secret and duplicate device-channel
validation. No real account or C22E hardware was available.
