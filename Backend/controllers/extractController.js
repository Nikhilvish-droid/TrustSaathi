require('dotenv').config();
const { resolveOrganizationId } = require('../utils/resolveOrganizationId');
const { enrichExtractResponse } = require('../utils/aiAnalysis');

const AI_ENGINE_URL = (process.env.AI_ENGINE_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function proxyExtract(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send multipart field "file".' });
    }

    const orgResult = await resolveOrganizationId(req, req.body.organization_id);
    if (typeof orgResult === 'object' && orgResult?.error) {
      return res.status(400).json({ error: 'Missing organization_id.', hint: orgResult.message });
    }

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname,
    );
    formData.append('organization_id', String(orgResult));

    const aiResponse = await fetch(`${AI_ENGINE_URL}/extract`, {
      method: 'POST',
      body: formData,
    });

    const rawText = await aiResponse.text();
    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        error: 'AI engine returned invalid JSON.',
        details: rawText.slice(0, 200),
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

    const enriched = enrichExtractResponse(payload);
    res.status(200).json({
      ...enriched,
      organization_id: orgResult,
    });
  } catch (error) {
    console.error('Extract proxy error:', error.message);
    res.status(502).json({
      error: 'Could not reach AI extraction service.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = { proxyExtract };
