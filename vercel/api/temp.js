export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ESP32_IP = '10.220.167.202';
  const { temp } = req.query;

  if (!temp) {
    return res.status(400).json({ error: 'Missing temp parameter' });
  }

  const temperature = parseInt(temp);
  if (temperature < 16 || temperature > 30) {
    return res.status(400).json({ error: 'Temperature out of range' });
  }

  try {
    const espUrl = `http://${ESP32_IP}/temp?temp=${temp}`;
    const response = await fetch(espUrl, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ 
      error: 'ESP32 unreachable',
      message: error.message 
    });
  }
}