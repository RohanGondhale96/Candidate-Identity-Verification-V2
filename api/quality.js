// Vercel serverless function: source-photo quality pre-flight via Google Gemini.
// POST body: { photo: {mime, data(base64)} }
// Response:  { usable, reason, message }
// Gemini is well suited to this (describable visual attributes) unlike the similarity score.
// The API key is read from GEMINI_API_KEY (set in Vercel), never sent to the browser.

const MODEL = 'gemini-2.5-flash';

const PROMPT = [
  'You are a photo-quality checker for an identity check. You are given ONE newly captured',
  'joining-day photo. Decide ONLY whether it is good enough to compare a face against reference',
  'photos. Judge only these visual properties:',
  '  - exactly one clear, reasonably sharp (not blurry) human face is visible;',
  '  - the person is facing the camera roughly front-on, with eyes visible;',
  '  - the face is free of coverings that hide its features. Judge ONLY facial occlusion',
  '    (mask, hand, hair, sunglasses, heavy shadow). Do NOT judge or mention headwear type,',
  '    religion, ethnicity or clothing - a head covering that leaves the face visible is FINE.',
  'Respond with ONLY a compact JSON object, no markdown, exactly these keys:',
  '{"usable": <true or false>,',
  ' "reason": "<one of: ok, blurry, not_facing, face_obscured, multiple_faces, no_face>",',
  ' "message": "<one short plain sentence a recruiter can read>"}',
  'Set usable=true only when a single, sharp, front-facing, unobscured face is clearly visible.'
].join('\n');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const key = process.env.GEMINI_API_KEY;
  if (!key) { res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' }); return; }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { photo } = body;
    if (!photo || !photo.data) { res.status(400).json({ error: 'photo is required' }); return; }

    const payload = {
      contents: [{ parts: [
        { text: PROMPT },
        { inline_data: { mime_type: photo.mime || 'image/jpeg', data: photo.data } },
      ] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { res.status(r.status).json({ error: (j.error && j.error.message) || `Gemini ${r.status}` }); return; }

    let text = '';
    try { text = (j.candidates[0].content.parts || []).map((p) => p.text || '').join(''); } catch (e) {}
    if (!text) {
      const fb = j.promptFeedback && j.promptFeedback.blockReason;
      res.status(502).json({ error: fb ? `Blocked by Gemini: ${fb}` : 'Empty response from Gemini' });
      return;
    }

    let s = text.trim();
    if (s.slice(0, 3) === '```') s = s.replace(/^```json?/i, '').replace(/```$/, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < a) { res.status(502).json({ error: 'Model did not return JSON' }); return; }

    const o = JSON.parse(s.slice(a, b + 1));
    res.status(200).json({
      usable: !!o.usable,
      reason: o.reason || '',
      message: o.message || '',
    });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
