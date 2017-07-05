# Discord Bouncer
An example of how to use this can be found in `test/index.js`

## All messages from the bouncer are **null terminated**

### Interface select
The first message the bouncer sends is a `SELECT`, which looks something like
```json
{
  "cmd": "SELECT",
  "evt": null,
  "args": {},
  "nonce": null
}
```

You should send a `SELECT` back, looking something like
```json
{
  "cmd": "SELECT",
  "evt": null,
  "args": {
    "interface": "mock"
  },
  "nonce": "61487326491873246"
}
```

In response you will get the `READY` `DISPATCH` from the `mock` or `rpc` interface

```json
{
  "cmd": "DISPATCH",
  "data": {
    "v": 1,
    "config": {
      "cdn_host": "cdn.discordapp.com",
      "api_endpoint": "https://discordapp.com",
      "environment": "production"
    }
  },
  "evt": "READY",
  "nonce": null,
  "interface": "mock"
}
```

At this point, the stdin/stdout behaves exactly like a regular RPC connection. However, if you are using mock, you can send your own `DISPATCH` packets to do things like ban users:
```json
{
  "cmd": "DISPATCH",
  "evt": "MEMBER_BAN_ADD",
  "nonce": "641872364918273",
  "args": {
    "guild_id": "188767514824671233",
    "member_id": "157982098022596609",
    "reason": "testing more"
  }
}
```
