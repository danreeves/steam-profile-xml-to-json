import { XMLParser } from "fast-xml-parser";
const NOT_FOUND = JSON.stringify({ error: "not found" });
const parser = new XMLParser({
  ignoreDeclaration: true,
});

const STEAM_AVATAR_CDNS = new Set([
  "avatars.akamai.steamstatic.com",
  "avatars.cloudflare.steamstatic.com",
]);
const DIMENSION_RANGE: [number, number] = [50, 3000];

type ImageTransformOptions = {
  fit: "pad";
  width: number;
  height: number;
  background: "transparent";
  format: "png";
};

type ImageRequestInit = RequestInit & {
  cf: { image: ImageTransformOptions };
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/resize") {
      return resizeAvatar(request, url);
    }

    const steamId = request.url.split("/").pop() || "";

    if (steamId) {
      const response = await fetch(
        `https://steamcommunity.com/profiles/${steamId}?xml=1`,
      );
      if (response.ok) {
        const text = await response.text();
        const json = parser.parse(text);

        if (json.profile) {
          proxyAvatarUrls(json.profile, request.url);
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
  },
};

async function resizeAvatar(request: Request, url: URL): Promise<Response> {
  const sourceUrl = url.searchParams.get("url");
  if (!sourceUrl) {
    return new Response("Missing image URL", { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(sourceUrl);
  } catch {
    return new Response("Invalid image URL", { status: 400 });
  }

  // Never turn this endpoint into an open proxy.
  if (imageUrl.protocol !== "https:" || !STEAM_AVATAR_CDNS.has(imageUrl.hostname) ||
      !/\.(?:jpe?g|png|webp)$/i.test(imageUrl.pathname)) {
    return new Response("Disallowed image URL", { status: 400 });
  }

  const width = parseDimension(url.searchParams.get("w"), 90);
  const height = parseDimension(url.searchParams.get("h"), 100);
  if (width === null || height === null) {
    return new Response(
      `Invalid image dimensions [${DIMENSION_RANGE.join("-")}]`,
      { status: 400 },
    );
  }

  const options: ImageRequestInit = {
    cf: {
      image: {
        fit: "pad",
        width,
        height,
        background: "transparent",
        format: "png",
      },
    },
  };

  return fetch(new Request(imageUrl, {
    headers: request.headers,
  }), options);
}

function proxyAvatarUrls(value: unknown, requestUrl: string): void {
  if (Array.isArray(value)) {
    for (const item of value) proxyAvatarUrls(item, requestUrl);
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [field, fieldValue] of Object.entries(value)) {
    if (/^avatar(?:icon|medium|full)$/i.test(field) && typeof fieldValue === "string") {
      const proxyUrl = new URL("/resize", requestUrl);
      proxyUrl.searchParams.set("url", fieldValue);
      (value as Record<string, unknown>)[field] = proxyUrl.toString();
    } else {
      proxyAvatarUrls(fieldValue, requestUrl);
    }
  }
}

function parseDimension(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;

  const dimension = Number(value);
  if (!Number.isInteger(dimension) ||
      dimension < DIMENSION_RANGE[0] ||
      dimension > DIMENSION_RANGE[1]) {
    return null;
  }

  return dimension;
}
