require('dotenv').config();
const FormData = require('form-data');
const { resolveOrganizationId } = require('../utils/resolveOrganizationId');
const { enrichExtractResponse } = require('../utils/aiAnalysis');

const AI_ENGINE_URL = (process.env.AI_ENGINE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const EXTRACT_TIMEOUT_MS = 180_000;

function describeNonJsonResponse(status, rawText) {
  const snippet = rawText.slice(0, 280).replace(/\s+/g, ' ').trim();
  if (rawText.trimStart().startsWith('<')) {
    return (
      'AI extraction service returned HTML instead of JSON. ' +
      'Verify AI_ENGINE_URL on Render points to your live AI service and that the service is awake.'
    );
  }
  if (status === 404) {
    return 'AI extraction endpoint not found. Check AI_ENGINE_URL ends at the service host (no /extract path).';
  }
  return `AI engine returned invalid JSON (HTTP ${status}). ${snippet}`;
}

function normalizeAiPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  if (!Array.isArray(payload.extracted_data) && Array.isArray(payload.entries)) {
    return { ...payload, extracted_data: payload.entries };
  }
  return payload;
}

async function wakeAiEngine() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    await fetch(`${AI_ENGINE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
  } catch {
    // Best-effort wake-up for Render free-tier cold starts.
  }
}

async function proxyExtract(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send multipart field "file".' });
    }

    if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(AI_ENGINE_URL)) {
      console.error('Extract proxy misconfigured: AI_ENGINE_URL still points to localhost in production.');
      return res.status(503).json({
        error: 'AI extraction is not configured on the server. Set AI_ENGINE_URL on Render.',
      });
    }

    const orgResult = await resolveOrganizationId(req, req.body.organization_id);
    if (typeof orgResult === 'object' && orgResult?.error) {
      return res.status(400).json({ error: 'Missing organization_id.', hint: orgResult.message });
    }

    await wakeAiEngine();

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype || 'application/octet-stream',
    });
    form.append('organization_id', String(orgResult));

    const aiResponse = await fetch(`${AI_ENGINE_URL}/extract`, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form,
      signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
    });

    const rawText = await aiResponse.text();
    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch {
      console.error('AI non-JSON response:', aiResponse.status, rawText.slice(0, 400));
      return res.status(502).json({
        error: describeNonJsonResponse(aiResponse.status, rawText),
        details: rawText.slice(0, 400),
      });
    }

    if (!aiResponse.ok) {
      const detail = payload.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
        : detail || payload.error || 'AI extraction failed.';
      return res.status(aiResponse.status >= 400 ? aiResponse.status : 502).json({
        error: message,
        details: payload,
      });
    }

    const enriched = enrichExtractResponse(normalizeAiPayload(payload));
    res.status(200).json({
      ...enriched,
      organization_id: orgResult,
    });
  } catch (error) {
    console.error('Extract proxy error:', error.message);
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    res.status(502).json({
      error: isTimeout
        ? 'AI extraction timed out. The AI service may be waking up — try again in a minute.'
        : 'Could not reach AI extraction service. Check AI_ENGINE_URL and that the AI engine is running.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = { proxyExtract };
