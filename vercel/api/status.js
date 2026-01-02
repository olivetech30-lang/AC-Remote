export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ESP32_IP = '10.220.167.202';

  try {
    const espUrl = `http://${ESP32_IP}/status`;
    const response = await fetch(espUrl, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    return res.status(200).json({
      ...data,
      proxy: 'vercel',
      vercel_url: 'ac-remote-flame.vercel.app'
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'ESP32 unreachable',
      esp32_ip: ESP32_IP
    });
  }
}