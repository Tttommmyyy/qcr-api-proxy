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
      
      // 👉 NOTE: Update this URL inside Vercel Environment Variables or directly here once you have the Make.com URL
      const bootWebhook = "https://hook.eu2.make.com/wp6o7o74vq7aoxg649zsmx6pglqj8g7k";
      const makeBootWebhookUrl = `${bootWebhook}?client_id=${clientId}&domain=${domain}`;
      
      const makeResponse = await fetch(makeBootWebhookUrl);
      const data = await makeResponse.json();
      
      return res.status(makeResponse.status).json(data);
    }

    // ---- EXISTING LOGIC: FORWARD ALL POST REQUESTS (RENDER & UPSCALE) ----
    const makeResponse = await fetch("https://hook.eu2.make.com/qrygnwrae7n2w869ce143pikidjskdfi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const makeData = await makeResponse.json();
    return res.status(makeResponse.status).json(makeData);

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
