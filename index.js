export default async function handler(req, res) {
  // Catch ALL incoming traffic
  
  // Forward the request to Make.com
  const makeResponse = await fetch("https://hook.eu2.make.com/qrygnwrae7n2w869ce143pikidjskdfi", {
    method: req.method,
    headers: {
      "Content-Type": req.headers["content-type"] || "application/json"
    },
    // Pass the exact body they sent us
    body: req.method === "POST" ? JSON.stringify(req.body) : undefined
  });

  // Grab whatever Make.com replies with
  const makeData = await makeResponse.json();

  // Send it back to the developer with a 200 OK status
  res.status(200).json(makeData);
}
