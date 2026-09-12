export default async function handler(req, res) {
  // CORS Headers so client browsers (like FlipLab) don't block the request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS Preflight silently
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ---- NEW: HANDLE THE EMBED "BOOT" GET REQUEST ----
    if (req.method === 'GET' && req.query.action === 'settings') {
      const clientId = req.query.client_id;
      const domain = req.query.domain;
      
      const bootWebhook = "https://hook.eu2.make.com/wp6o7o74vq7aoxg649zsmx6pglqj8g7k";
      const makeBootWebhookUrl = `${bootWebhook}?client_id=${clientId}&domain=${domain}`;
      
      const makeResponse = await fetch(makeBootWebhookUrl);
      const data = await makeResponse.json();
      
      return res.status(makeResponse.status).json(data);
    }

    // ---- HANDLE POST REQUESTS (RENDER & UPSCALE) ----
    if (req.method === 'POST') {
      // Default to the original API Gateway Bouncer
      let targetWebhook = "https://hook.eu2.make.com/qrygnwrae7n2w869ce143pikidjskdfi";
      
      // If the request comes specifically from the new UI Embed, route it to the Embed Bouncer
      if (req.body && req.body.source === 'Embed') {
        targetWebhook = "https://hook.eu2.make.com/yk3tb3g8dyy6c59jjxn9b8xfooylg7m6";
      }

      const makeResponse = await fetch(targetWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });

      // Safely parse the Make.com response (prevents 500 crashes if Make returns plain text)
      const makeText = await makeResponse.text();
      try {
        const makeData = JSON.parse(makeText);
        return res.status(makeResponse.status).json(makeData);
      } catch (err) {
        return res.status(makeResponse.status).send(makeText);
      }
    }

    return res.status(400).json({ success: false, error: "Invalid Action" });

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
