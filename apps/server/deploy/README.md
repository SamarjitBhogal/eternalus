# Running the Duel server on a Linux host (systemd, no container)

For a demo host you own. The container route is `apps/server/Dockerfile` (see
`apps/server/AGENTS.md`). The server has no database: ratings and guest ids live in memory and a
restart loses them.

## Layout

- `~/.local/share/eternalus-duel/server/`: `main.js` (the server bundle) and `node_modules/ws`.
- `~/.local/share/eternalus-client/`: the static client build.
- `~/.config/systemd/user/`: the two units in this folder.

## First install

1. Build (Node 24): `npm ci`, then `npm run build -w @eternalus/server`, and for the client
   `VITE_DUEL_SERVER_URL=wss://<your-host> npm run build -w @eternalus/client`. The client needs
   `wss://` when it is served over HTTPS; TLS is the proxy's job (for example `tailscale serve`
   or the platform in front of the host).
2. Copy `apps/server/dist/main.js` to `~/.local/share/eternalus-duel/server/` and install the one
   runtime dependency beside it with the version pinned in `apps/server/package.json`:
   `npm install --prefix ~/.local/share/eternalus-duel/server ws@<that version>`.
3. Copy `apps/client/dist` to `~/.local/share/eternalus-client`.
4. Copy the two `.service` files to `~/.config/systemd/user/`, set `ExecStart` to your Node 24 in
   `eternalus-duel.service`, then:
   `systemctl --user daemon-reload && systemctl --user enable --now eternalus-duel eternalus-client`.
5. To start without a login session: `loginctl enable-linger "$USER"`.

## Redeploy

Rebuild, replace `main.js` (and the client folder), then `systemctl --user restart eternalus-duel`.

## Check

`curl http://127.0.0.1:8788/health` answers `ok`; `npm run duel:bots` plays a Duel against the
running server.

## Behind a proxy

`ClientAddress` reads `X-Forwarded-For` only when the peer is loopback, which is the case behind
a local reverse proxy, and it takes the first entry: the proxy must replace the header, not append
to a client-supplied one. On a platform whose proxy is not on the loopback address the per-IP
connection cap would apply to every player at once. Both points are open owner questions: see the
item on the connection cap behind a platform proxy in `INBOX.md`.
