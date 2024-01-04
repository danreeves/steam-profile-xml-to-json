import { parse } from "https://deno.land/x/xml@2.1.3/mod.ts";

Deno.serve(async (request: Request) => {
  const steamId = request.url.split("/").pop() || "";

  if (steamId) {
    const response = await fetch(
      `https://steamcommunity.com/profiles/${steamId}?xml=1`
    );
    if (response.ok) {
      const text = await response.text();
      const json = parse(text);
      return new Response(JSON.stringify(json), {
        headers: { "content-type": "application/json" },
      });
    }
  }

  return new Response("not found", { status: 404 });
});
