# Steam Profile XML to JSON

Cloudflare Worker that converts Steam's XML profile endpoint to JSON. Steam
profiles are available without API keys:
https://partner.steamgames.com/documentation/community_data

## Development

Install dependencies and start the Cloudflare local development server:

```sh
npm install
npx wrangler dev
```

Deploy with `npx wrangler deploy`.

## Endpoints

### `/:steamid`
Returns the Steam profile as JSON.

Example: `https://steam-profile-xml-to-json.dnrvs.workers.dev/76561198032229961`

### `/resize?url=<cdn-url>`
Proxies a Steam avatar CDN URL as a transparent PNG padded to a 9:10 portrait
canvas. The URL must point to a Steam avatar CDN host:
`avatars.akamai.steamstatic.com` or `avatars.cloudflare.steamstatic.com`.

The default output is `90x100`. Use `w` and `h` query parameters for another
bounded size, for example `/resize?url=<encoded-cdn-url>&w=72&h=80`.

The profile endpoint leaves avatar URLs unchanged. Use this endpoint explicitly
when a padded portrait image is needed.

For example, an avatar URL can be proxied with:
`https://steam-profile-xml-to-json.dnrvs.workers.dev/resize?url=https://avatars.cloudflare.steamstatic.com/ae4f292ce715a84c7a77673e29ad0dcf676f0e66.jpg`.
