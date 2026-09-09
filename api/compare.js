// Vercel serverless function: face comparison via AWS Rekognition (CompareFaces).
// POST body: { joining: {mime, data(base64)}, onfile: {mime, data(base64)} }
// Response:  { same_person, similarity, confidence, reason }   (unchanged contract — drop-in for the old Gemini version)
//
// Credentials come from env vars set in Vercel (never in the repo / browser):
//   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (e.g. ap-south-1)
// IAM permission required: rekognition:CompareFaces
//
// "Couldn't compare" signal: when the reference (on-file) image has NO detectable face we return
// HTTP 422 with an error — the browser proxy throws, which the report renders as "Couldn't compare".

const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition');

// similarity (0-100) at/above which we call it the same person
const SAME_PERSON_THRESHOLD = 80;

let _client = null;
function client() {
  if (_client) return _client;
  _client = new RekognitionClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    res.status(500).json({ error: 'AWS credentials are not configured on the server' }); return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { joining, onfile } = body;
    if (!joining || !joining.data || !onfile || !onfile.data) {
      res.status(400).json({ error: 'Both images (joining, onfile) are required' });
      return;
    }

    let out;
    try {
      out = await client().send(new CompareFacesCommand({
        SourceImage: { Bytes: Buffer.from(joining.data, 'base64') },   // the joining-day photo
        TargetImage: { Bytes: Buffer.from(onfile.data, 'base64') },    // the reference on file
        SimilarityThreshold: 0,     // return the best match with its score regardless; we decide same/not
        QualityFilter: 'NONE',      // don't drop faces for quality — the quality gate already ran
      }));
    } catch (e) {
      // CompareFaces throws InvalidParameterException when EITHER image has no detectable face.
      // The joining photo is quality-gated (DetectFaces) before we get here, so it always has a
      // face — meaning this is the on-file reference. Render it as "Couldn't compare".
      if (e && e.name === 'InvalidParameterException') {
        res.status(422).json({ error: 'No face detected in the reference photo.' });
        return;
      }
      throw e;
    }

    const targetFaceCount = ((out.FaceMatches && out.FaceMatches.length) || 0) +
                            ((out.UnmatchedFaces && out.UnmatchedFaces.length) || 0);

    // No face at all in the reference on file -> couldn't compare.
    if (targetFaceCount === 0) {
      res.status(422).json({ error: 'No face detected in the reference photo.' });
      return;
    }

    const best = (out.FaceMatches && out.FaceMatches.length) ? out.FaceMatches[0] : null;
    const similarity = best ? best.Similarity : 0;   // a face exists but didn't match -> low score (different person)
    const confidence = (best && best.Face && best.Face.Confidence != null)
      ? best.Face.Confidence
      : ((out.SourceImageFace && out.SourceImageFace.Confidence) || 0);

    res.status(200).json({
      same_person: similarity >= SAME_PERSON_THRESHOLD,
      similarity: Math.round(similarity * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      reason: '',
    });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
