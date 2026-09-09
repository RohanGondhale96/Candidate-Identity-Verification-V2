// Vercel serverless function: joining-day photo quality pre-flight via AWS Rekognition (DetectFaces).
// POST body: { photo: {mime, data(base64)} }
// Response:  { usable, reason, message }   (unchanged contract — drop-in for the old Gemini version)
//   reason is one of: ok | blurry | not_facing | face_obscured | multiple_faces | no_face
//
// Credentials come from env vars set in Vercel: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION.
// IAM permission required: rekognition:DetectFaces

const { RekognitionClient, DetectFacesCommand } = require('@aws-sdk/client-rekognition');

// tunable quality thresholds (Rekognition scores are 0-100; pose angles in degrees)
const MIN_SHARPNESS = 20;   // below this the photo reads as blurry
const MIN_BRIGHTNESS = 25;  // below this the photo is too dark
const MAX_POSE_DEG = 33;    // yaw/pitch beyond this = not facing the camera

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
    const { photo } = body;
    if (!photo || !photo.data) { res.status(400).json({ error: 'photo is required' }); return; }

    const out = await client().send(new DetectFacesCommand({
      Image: { Bytes: Buffer.from(photo.data, 'base64') },
      Attributes: ['ALL'],   // need Quality (Sharpness/Brightness), Pose, and FaceOccluded
    }));

    const faces = out.FaceDetails || [];
    if (faces.length === 0) return res.status(200).json({ usable: false, reason: 'no_face', message: 'No clear face was detected.' });
    if (faces.length > 1)   return res.status(200).json({ usable: false, reason: 'multiple_faces', message: 'More than one face is visible.' });

    const f = faces[0];
    const q = f.Quality || {};
    const pose = f.Pose || {};

    if (f.FaceOccluded && f.FaceOccluded.Value === true) {
      return res.status(200).json({ usable: false, reason: 'face_obscured', message: 'The face is partly covered.' });
    }
    if ((q.Sharpness || 0) < MIN_SHARPNESS) {
      return res.status(200).json({ usable: false, reason: 'blurry', message: 'This photo looks blurry.' });
    }
    if ((q.Brightness || 0) < MIN_BRIGHTNESS) {
      return res.status(200).json({ usable: false, reason: 'blurry', message: 'This photo is too dark.' });
    }
    if (Math.abs(pose.Yaw || 0) > MAX_POSE_DEG || Math.abs(pose.Pitch || 0) > MAX_POSE_DEG) {
      return res.status(200).json({ usable: false, reason: 'not_facing', message: 'The person isn’t facing the camera.' });
    }

    return res.status(200).json({ usable: true, reason: 'ok', message: '' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
