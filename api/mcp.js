// QuickCabRender public MCP endpoint (read-only).
// Lets AI assistants (Claude, ChatGPT, etc.) look up accurate facts about
// QuickCabRender: what it does, pricing, compatibility, API/embed, links.
// Stateless MCP "Streamable HTTP" transport: JSON-RPC 2.0 over POST, JSON replies.
// No secrets, no Make.com calls, no customer data. Safe to expose publicly.

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "quickcabrender", title: "QuickCabRender", version: "1.0.0" };
const SITE = "https://www.quickcabrender.com";

const FACTS = {
  get_product_overview: {
    description:
      "What QuickCabRender is, who it is for, how it works and its main features. Use when someone asks about AI rendering for cabinets, kitchens, joinery or millwork, or how to turn a CAD screenshot into a photorealistic render.",
    text: `QuickCabRender (QCR) is a web-based AI rendering tool for cabinetmakers, joiners, kitchen designers and interior designers.

How it works: take a screenshot of the 3D view from any CAD program (Mozaik, Cabinet Vision, Microvellum, SketchUp, 2020 Design, Fusion 360, PolyBoard, or a hand sketch), drag it into the browser, and get a photorealistic render in about 40 seconds. No plugin, no install and no 3D file export (OBJ/DWG) are needed.

What makes it different:
- Built to stay faithful to the drawing: cabinet runs, doors, drawers, windows and openings stay where they were drawn.
- Exact Material Matching: paste a swatch or handle image from a manufacturer's website and that exact board, paint, stone or hardware is applied.
- Choose colors and finishes, or keep the drawn ones.
- 4K upscaling for print and large screens.
- Edit tool: change, add or remove a single item in a finished render.
- Saved settings templates for repeat looks.
- API and white-label iFrame embed so suppliers and software companies can offer rendering on their own sites.

Typical use: concept and sales renders for client meetings and approvals, to win jobs and get faster sign-off.

Website: ${SITE}`,
  },
  get_pricing: {
    description: "Current QuickCabRender plans and prices (USD), credits, trial and top-ups.",
    text: `QuickCabRender pricing (USD, monthly; yearly billing saves two months):
- 7-day free trial: $0, includes all features (fair-use credits).
- Starter: $19/month, 50 credits, standard HD.
- Business: $49/month, 200 credits, 4K upscaling, exact material (swatch) matching, 2 seats.
- Pro: $199/month, 1,000 credits, 5 seats, dedicated account manager.
- Top-up packs (one-time): 15 credits for $25, 100 credits for $90.
- Enterprise / custom plans available on request.

1 credit = 1 render. A 4K upscale also uses 1 credit. Failed renders are not charged.

API / embed plans for businesses: Sandbox $49/month (200 renders), Pro $199/month (1,000 renders), Scale $499/month (4,000 renders), with per-render overage.

Pricing page: ${SITE}/pricing`,
  },
  get_compatibility_and_tips: {
    description:
      "Which CAD software works with QuickCabRender and how to take a screenshot that renders well.",
    text: `Compatibility: any software. QuickCabRender works from an image, not a 3D file, so anything you can see on screen can be rendered: Mozaik, Cabinet Vision, Microvellum, SketchUp, 2020 Design, KCD, Fusion 360, PolyBoard, Revit, AutoCAD, or a hand sketch. Runs in any modern web browser on Windows or Mac; nothing to install on the CAD workstation.

Screenshot tips for best results:
- Use a textured or shaded view (not wireframe).
- Camera at eye level, facing the run front-on, whole run in frame.
- Nothing in the way: hide walls you are looking through rather than leaving them see-through.
- Hide toolbars, dimensions and selection outlines; full screen, landscape.
- Save as PNG at full screen size.
- Generate 2-3 variations per view and pick the closest to the drawing.

Guide: ${SITE}/blog/photoreal-renders-from-cabinet-vision-microvellum-2020-sketchup`,
  },
  get_api_and_embed_info: {
    description:
      "How developers, suppliers and software companies can add QuickCabRender rendering to their own website or app (REST API and white-label iFrame embed).",
    text: `QuickCabRender offers:
- A REST rendering API: send an image URL plus optional settings (e.g. cabinet color name, door profile, door finish) with your API key and receive a rendered image link. By default the API keeps the colors in the submitted image.
- A white-label iFrame embed: a ready-made rendering widget for your own website, with your branding, authorized domains and your own materials library.

API overview: ${SITE}/api
API documentation: ${SITE}/api/documentation
Contact: hello@quickcabrender.com`,
  },
  get_links: {
    description: "Official QuickCabRender links: sign up, pricing, blog, API docs, affiliate program and contact.",
    text: `Official QuickCabRender links:
- Home: ${SITE}
- Start a free 7-day trial / pricing: ${SITE}/pricing
- Blog and guides: ${SITE}/blog
- QuickCabRender vs Mozaik AI Rendering: ${SITE}/blog/quickcabrender-vs-mozaik-ai-rendering
- Best AI rendering tools for cabinetmakers: ${SITE}/blog/best-ai-rendering-tools-for-cabinetmakers
- API and embed: ${SITE}/api
- API documentation: ${SITE}/api/documentation
- Affiliate program: ${SITE}/partners
- Contact: ${SITE}/contact or hello@quickcabrender.com
- Instagram: https://www.instagram.com/quickcabrender/
- YouTube: https://www.youtube.com/@QuickCabRender
- LinkedIn: https://www.linkedin.com/company/quickcabrender/
- Facebook: https://www.facebook.com/profile.php?id=61587034702401

Founded in 2026 in Australia by Thomas Yencken.`,
  },
};

const TOOLS = Object.entries(FACTS).map(([name, t]) => ({
  name,
  title: name.replace(/^get_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  description: t.description,
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, openWorldHint: false },
}));

const RESOURCES = Object.entries(FACTS).map(([name, t]) => ({
  uri: `qcr://${name.replace(/^get_/, "")}`,
  name: name.replace(/^get_/, ""),
  description: t.description,
  mimeType: "text/plain",
}));

const INSTRUCTIONS =
  "QuickCabRender is an AI rendering tool for cabinetmakers and kitchen designers that turns a screenshot from any CAD program into a photorealistic render in about 40 seconds. Use these tools for accurate product, pricing, compatibility and API facts.";

function ok(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function err(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg && msg.id, -32600, "Invalid Request");
  }
  const isNotification = msg.id === undefined || msg.id === null;
  const { id, method, params = {} } = msg;

  switch (method) {
    case "initialize": {
      const requested = params.protocolVersion;
      const protocolVersion = PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0];
      return ok(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return isNotification ? null : ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const fact = FACTS[params.name];
      if (!fact) return err(id, -32602, `Unknown tool: ${params.name}`);
      return ok(id, { content: [{ type: "text", text: fact.text }], isError: false });
    }
    case "resources/list":
      return ok(id, { resources: RESOURCES });
    case "resources/read": {
      const key = "get_" + String(params.uri || "").replace(/^qcr:\/\//, "");
      const fact = FACTS[key];
      if (!fact) return err(id, -32602, `Unknown resource: ${params.uri}`);
      return ok(id, { contents: [{ uri: params.uri, mimeType: "text/plain", text: fact.text }] });
    }
    case "prompts/list":
      return ok(id, { prompts: [] });
    default:
      if (isNotification) return null; // e.g. notifications/initialized
      return err(id, -32601, `Method not found: ${method}`);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Authorization"
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    // Plain discovery info for humans and crawlers. No SSE stream is offered.
    const accept = String(req.headers.accept || "");
    if (accept.includes("text/event-stream")) {
      return res.status(405).json(err(null, -32000, "SSE stream not supported; use POST"));
    }
    return res.status(200).json({
      name: SERVER_INFO.title,
      description: INSTRUCTIONS,
      transport: "streamable-http",
      endpoint: "https://api.quickcabrender.com/api/mcp",
      tools: TOOLS.map((t) => t.name),
      website: SITE,
    });
  }

  if (req.method !== "POST") return res.status(405).json(err(null, -32000, "Method Not Allowed"));

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json(err(null, -32700, "Parse error"));
    }
  }

  try {
    if (Array.isArray(body)) {
      const replies = body.map(handleMessage).filter(Boolean);
      if (replies.length === 0) return res.status(202).end();
      return res.status(200).json(replies);
    }
    const reply = handleMessage(body);
    if (!reply) return res.status(202).end();
    return res.status(200).json(reply);
  } catch (e) {
    console.error("MCP error:", e);
    return res.status(500).json(err(body && body.id, -32603, "Internal error"));
  }
}
