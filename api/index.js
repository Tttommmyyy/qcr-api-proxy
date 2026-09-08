export default async function handler(req, res) {
  try {
    // Forward the exact request to your Make.com Bouncer
    const makeResponse = await fetch("https://hook.eu2.make.com/qrygnwrae7n2w869ce143pikidjskdfi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // Safely stringify the JSON body
      body: JSON.stringify(req.body)
    });

    // Get the response from Make.com
    const makeData = await makeResponse.json();

    // Send it back to the developer
    res.status(200).json(makeData);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
