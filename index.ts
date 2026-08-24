import { XMLParser } from "fast-xml-parser";
const NOT_FOUND = JSON.stringify({ error: "not found" });
const parser = new XMLParser({
  ignoreDeclaration: true,
});

const STEAM_AVATAR_CDNS = new Set([
  "avatars.akamai.steamstatic.com",
  "avatars.cloudflare.steamstatic.com",
]);
const CANVAS_WIDTH = 90;
const CANVAS_HEIGHT = 100;
const AVATAR_SIZE_RANGE: [number, number] = [50, CANVAS_WIDTH];
const TRANSPARENT_CANVAS_URL =
  "https://placehold.co/90x100/transparent/transparent.png";

type ImageTransformOptions = {
  fit?: "contain";
  width: number;
  height: number;
  format: "png";
  draw?: [{
    url: string;
    width: number;
    height: number;
    fit: "contain";
    left: number;
    top: number;
  }];
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

  const size = parseDimension(url.searchParams.get("size"), CANVAS_WIDTH);
  if (size === null) {
    return new Response(`Invalid avatar size [${AVATAR_SIZE_RANGE.join("-")}]`, {
      status: 400,
    });
  }

  const options: ImageRequestInit = {
    cf: {
      image: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        format: "png",
        draw: [{
          url: imageUrl.toString(),
          width: size,
          height: size,
          fit: "contain",
          left: Math.floor((CANVAS_WIDTH - size) / 2),
          top: Math.floor((CANVAS_HEIGHT - size) / 2),
        }],
      },
    },
  };

  return fetch(TRANSPARENT_CANVAS_URL, options);
}

function parseDimension(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;

  const dimension = Number(value);
  if (!Number.isInteger(dimension) ||
      dimension < AVATAR_SIZE_RANGE[0] ||
      dimension > AVATAR_SIZE_RANGE[1]) {
    return null;
  }

  return dimension;
}
