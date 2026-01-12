export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ESP32_IP = process.env.ESP32_IP;
  if (!ESP32_IP) {
    return res.status(500).json({ error: 'ESP32_IP not set in Vercel env' });
  }

  const { cmd } = req.query;
  if (!cmd) {
    return res.status(400).json({ error: 'Missing cmd parameter' });
  }

  try {
    const espUrl = `http://${ESP32_IP}/learn?cmd=${encodeURIComponent(cmd)}`;
    const response = await fetch(espUrl, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'ESP32 unreachable', message: error.message });
  }
}