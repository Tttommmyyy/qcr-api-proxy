export default async function handler(req, res) {
  // CORS Headers so client browsers (like Framer) don't block the request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS Preflight silently
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    // 1. Get the Outseta JWT from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid Authorization header' });
    }
    
    const outsetaToken = authHeader.substring(7);

    // 2. Verify the token with Outseta
    // Calling the profile endpoint with the user's JWT validates they are genuinely logged in
    const outsetaRes = await fetch("https://quickcabrender.outseta.com/api/v1/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${outsetaToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!outsetaRes.ok) {
      console.error("Outseta validation failed:", await outsetaRes.text());
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
    }

    const outsetaProfile = await outsetaRes.json();
    const verifiedEmail = outsetaProfile.Email || outsetaProfile.email;

    if (!verifiedEmail) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Could not extract email from session' });
    }

    // 3. Build the payload for Make.com
    const makePayload = req.body;
    
    // SECURITY: Override whatever email the frontend sent with the cryptographically verified one
    makePayload.email = verifiedEmail;
    
    // SECURITY: Inject the internal auth token so Make.com knows this request passed Vercel validation
    makePayload.internal_auth_token = process.env.INTERNAL_AUTH_TOKEN || "";

    // 4. Forward to the Render V13 Make.com Webhook
    const targetWebhook = "https://hook.eu2.make.com/bf74h9xsn2cuhxm3xzv5kv5upqumx7a6";
    
    const makeResponse = await fetch(targetWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Inject the Make Keychain Secret to bypass the Make.com gate
        "x-make-apikey": process.env.MAKE_WEBHOOK_SECRET || ""
      },
      body: JSON.stringify(makePayload)
    });

    // Safely parse the Make.com response
    const makeText = await makeResponse.text();
    try {
      const makeData = JSON.parse(makeText);
      return res.status(makeResponse.status).json(makeData);
    } catch (err) {
      return res.status(makeResponse.status).send(makeText);
    }

  } catch (error) {
    console.error("Frontend Proxy Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
