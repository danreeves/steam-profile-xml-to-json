import { parse } from "https://deno.land/x/xml@2.1.3/mod.ts";
const NOT_FOUND = JSON.stringify({ error: "not found"})

Deno.serve(async (request: Request) => {
  const steamId = request.url.split("/").pop() || "";

  if (steamId) {
    const response = await fetch(
      `https://steamcommunity.com/profiles/${steamId}?xml=1`
    );
    if (response.ok) {
      const text = await response.text();
      const json = parse(text);

      if (json.profile) {
        console.log(response.status, request.url)
        return new Response(JSON.stringify(json), {
          headers: { "content-type": "application/json" },
        });
      }
    }
  }

  console.log(404, request.url)
  return new Response(NOT_FOUND, { 
    status: 404,
    headers: {
      "content-type": "application/json" 
    }
  });
});
