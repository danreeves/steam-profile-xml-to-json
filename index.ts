import { XMLParser } from "fast-xml-parser";
const NOT_FOUND = JSON.stringify({ error: "not found" });
const parser = new XMLParser({
  ignoreDeclaration: true,
});

Deno.serve(async (request: Request) => {
  const steamId = request.url.split("/").pop() || "";

  if (steamId) {
    const response = await fetch(
      `https://steamcommunity.com/profiles/${steamId}?xml=1`,
    );
    if (response.ok) {
      const text = await response.text();
      const json = parser.parse(text);

      if (json.profile) {
        console.log(response.status, request.url);
        return new Response(JSON.stringify(json), {
          headers: { "content-type": "application/json" },
        });
      }
    }
  }

  console.log(404, request.url);
  return new Response(NOT_FOUND, {
    status: 404,
    headers: {
      "content-type": "application/json",
    },
  });
});
