# steam profile xml to json

Steam expose profiles in an XML format without any API keys required: https://partner.steamgames.com/documentation/community_data

This service is a simple Deno wrapper that converts the XML to JSON for easier consumption in web applications

## `/:steamid`
Returns the profile
