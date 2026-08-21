// Vercel serverless function: face comparison via Google Gemini.
// POST body: { joining: {mime, data(base64)}, onfile: {mime, data(base64)} }
// Response:  { same_person, similarity, confidence, reason }
// The Gemini API key is read from the GEMINI_API_KEY environment variable (set in Vercel),
// so it never appears in the repo or is sent to the browser.

const MODEL = 'gemini-2.5-flash';

const PROMPT = [
  'You are a strict face-verification system used for identity checks during employee onboarding.',
  'You are given TWO photographs:',
  '  - IMAGE 1 is a newly captured "joining-day" photo of the person who turned up to join.',
  "  - IMAGE 2 is the candidate's earlier photo already on file.",
  'Decide whether the two images show the SAME physical person. Judge facial identity only -',
  'ignore differences in lighting, background, pose, expression, hairstyle, glasses, age or image quality',
  'except insofar as they genuinely prevent a confident match.',
  '',
  'Respond with ONLY a single compact JSON object and nothing else (no markdown, no code fences,',
  'no commentary). Use exactly these keys:',
  '{"same_person": <true or false>,',
  ' "similarity": <integer 0-100, how strongly the two faces match as the same identity>,',
  ' "confidence": <integer 0-100, your confidence in the judgement given face visibility and quality>,',
  ' "reason": "<one short sentence>"}',
  '',
  'Calibrate the similarity score strictly:',
  '  - The SAME person: 85-100.',
  '  - The same person but a poor, ambiguous or partly obscured photo: 50-84.',
  '  - TWO DIFFERENT people: 0-15, and the more clearly different they are (face shape,',
  '    features, bone structure, skin tone, distinct identity) the closer to 0.',
  'Do NOT inflate the score for generic resemblance - both being adult, similar age, similar',
  'pose, clothing, expression or background is NOT a match. Judge ONLY whether it is the same',
  'individual. When they are clearly different people, set same_person=false and keep similarity',
  'very low (typically under 10). Use precise, non-round numbers rather than repeating one value.',
  '',
  'If a clear human face is not visible in either image, return same_person=false, similarity=0,',
  'a low confidence, and say so in reason.'
].join('\n');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const key = process.env.GEMINI_API_KEY;
  if (!key) { res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' }); return; }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { joining, onfile } = body;
    if (!joining || !joining.data || !onfile || !onfile.data) {
      res.status(400).json({ error: 'Both images (joining, onfile) are required' });
      return;
    }

    const payload = {
      contents: [{ parts: [
        { text: PROMPT },
        { inline_data: { mime_type: joining.mime || 'image/png', data: joining.data } },
        { inline_data: { mime_type: onfile.mime || 'image/png', data: onfile.data } },
      ] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
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
      same_person: !!o.same_person,
      similarity: o.similarity,
      confidence: o.confidence,
      reason: o.reason || '',
    });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
