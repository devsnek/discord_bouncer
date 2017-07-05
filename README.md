# Discord Bouncer
An example of how to use this can be found in `test/index.js`

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

## Unix Domain Sockets (UDS)

UDS will be used in two situations:
1. Sending voice/video data
2. Sending messages that are larger than the system IPC buffer

#### Case 2:
If the server attempts to respond with a payload that is larger than the system IPC buffer, it will issue a `UNIX_DOMAIN_SOCKET_UPGRADE`, which looks a bit like:
```json
{
  "cmd": "UNIX_DOMAIN_SOCKET_UPGRADE",
  "evt": "CREATE",
  "data": {
    "file": "/Users/Gus/Desktop/projects/discord_bouncer/331970512651681792.sock"
  },
  "nonce":"331967930134822915"
}
```
As soon as you connect to the UDS, it will send the raw payload, and then immediately close, and then the main process will issue another `UNIX_DOMAIN_SOCKET_UPGRADE`, looking like this:
```json
{
  "cmd": "UNIX_DOMAIN_SOCKET_UPGRADE",
  "evt": "DELETE",
  "data": {
    "success": true
  },
  "nonce": "331967930134822915"
}
```
`data.success` represents if the server thinks the data was successfully sent.
the UDS will stay open for exactly 10 seconds, or until it delivers the payload, and then the data it has will be lost forever.
