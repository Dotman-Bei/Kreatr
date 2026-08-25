# Kreatr — Deployment

> Deploying to the VPS the repo is already cloned onto. Ten minutes, one script.
>
> **Status: deployed and live at <https://kreatr-demo.duckdns.org>** (25 Aug 2026).
> Certificate valid to 23 November 2026, auto-renewal enabled. This document is
> now both the record of how it was done and the runbook for re-running it.
>
> **Written:** 25 August 2026

---

## 1. What this box already looks like

The deployment plan is shaped by facts about this specific server, not by a
generic template. Checked directly:

| Fact | Consequence |
| :--- | :--- |
| **nginx already owns ports 80 and 443** | Kreatr gets a sibling nginx vhost. Caddy is out — two things cannot bind 443 |
| **Another project (`financehub`) is live** on `financehub-demo.duckdns.org` | Every step below is additive and validated before reload. Nothing touches that site |
| **Ports 8000–8003 are taken** by that project's uvicorn workers | Kreatr uses **8010** (API) and **3010** (web) |
| **certbot is installed**, with a working Let's Encrypt cert already issued | HTTPS is one command, using the pattern already proven here |
| **Docker is not installed** | Deploy natively with systemd, matching how this box already runs things |
| Ubuntu 24.04, 4 cores, 7.8 GB RAM, 84 GB free | Comfortable. A live run is I/O-bound on Bedrock, not CPU-bound |
| ffmpeg was **not** installed | `provision.sh` installed it (6.1.1) — Stage A ingest needs it |

### Why not Docker

`handoff.md` originally sketched a `docker-compose` + Caddy setup. That was
written before anyone had looked at the box. Installing Docker here would mean
adding a container runtime next to a live production app, then running a second
reverse proxy that cannot have 443 because nginx already has it. The native path
is fewer moving parts, matches the convention this server already follows, and
leaves the existing site alone. Nothing in the app changed to make this work.

## 2. The port map

Only nginx is public. Both app processes bind loopback, so neither can be
reached except through the proxy.

```text
                    :80 / :443   nginx  (already running, shared with financehub)
                                   │
              ┌────────────────────┴────────────────────┐
              │  server_name kreatr-demo.duckdns.org    │
              └────────────────────┬────────────────────┘
                                   │
            /api/… ────────────────┤────────────── /  (everything else)
                                   │
              127.0.0.1:8010       │       127.0.0.1:3010
              kreatr-api           │       kreatr-web
              uvicorn/FastAPI      │       next start
                    │                            │
                    └──── loopback ──────────────┘
                      server components fetch the API directly
```

**One hostname serves both.** That is the single most important choice here.
The workspace calls the API from the browser; if the page were `https://` and
the API `http://ip:8010`, the browser would block the call as mixed content —
and `apps/web/lib/api.ts` fails soft, so the workspace would silently render
seeded fixture data. A demo that looks like it works while showing invented
numbers is worse than one that is visibly down. Same origin makes that
impossible by construction.

## 3. About the domain — the short version

A domain is just a name pointing at this box's IP, `169.58.153.9`. You need one
because a TLS certificate cannot be issued for a bare IP address, and without
TLS the demo is served over plain `http`.

The other project on this box uses **DuckDNS**, which is free and takes about two
minutes. Do the same:

1. Go to <https://www.duckdns.org> and sign in (GitHub login works).
2. Create a subdomain, e.g. `kreatr-demo` → you get `kreatr-demo.duckdns.org`.
3. In the **current ip** box, enter `169.58.153.9` and click **update ip**.
4. Confirm it resolves — from the box:

   ```bash
   dig +short kreatr-demo.duckdns.org     # must print 169.58.153.9
   ```

If you would rather use a domain you own, point an `A` record at
`169.58.153.9` instead and use that name below. Everything else is identical.

You can deploy before doing this — the site just serves over plain `http` until
the certificate step in §5.

## 4. Deploy

```bash
cd /root/kreatr/Kreatr
sudo DOMAIN=kreatr-demo.duckdns.org ./deploy/provision.sh
```

The script is idempotent — re-run it after every `git pull`. It:

1. **Verifies 8010 and 3010 are free**, and refuses to continue naming the
   conflicting process rather than leaving a service in a restart loop
2. Installs **ffmpeg** (Stage A ingest needs `ffmpeg` and `ffprobe`)
3. Creates `.venv` and installs Python dependencies
4. Writes `.env` from `.env.example` if absent — **defaulting to replay mode**,
   because with no AWS credentials a live run only fails partway through
5. Runs `npm ci && next build` with `NEXT_PUBLIC_API_URL=/`
6. Installs and starts the two systemd units
7. **Waits for both to answer** before continuing, so a failure surfaces here
   rather than as a 502 later
8. Installs the nginx vhost, runs `nginx -t`, and only then reloads

Step 8 matters: nginx also serves the other project, so the config is validated
before reload. A syntax error takes down both sites; `nginx -t` catches it while
both are still running.

## 5. HTTPS

Once `dig` returns the right IP:

```bash
sudo certbot --nginx -d kreatr-demo.duckdns.org
```

Certbot rewrites the vhost with the TLS directives and adds the `http → https`
redirect — the same shape as the existing site. Renewal is already handled by
the system's certbot timer.

Then pin the API's CORS to the real origin and rebuild the frontend so the
browser bundle is built against the final origin:

```bash
sudo sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=https://kreatr-demo.duckdns.org|' .env
sudo systemctl restart kreatr-api
```

Re-running `provision.sh` is unnecessary here — the browser base is `/`, which
is scheme-relative, so the existing build already works over https.

## 6. Verify the deployment

```bash
# Both services up
systemctl status kreatr-api kreatr-web --no-pager

# API answering, and honest about which mode it is in
curl -s https://kreatr-demo.duckdns.org/api/health

# Start a run, then look at the workspace
curl -s -X POST https://kreatr-demo.duckdns.org/api/runs/sync \
  -H 'Content-Type: application/json' -d '{"contentId":"vid_100saas"}' | head -c 300
```

Then open `https://kreatr-demo.duckdns.org` and click into the workspace.

**Check the source badge.** It is on every workspace screen and says whether you
are looking at a real run or the seeded fixture. If it says *Seeded demo data*
after you started a run, the frontend could not reach the API — check
`journalctl -u kreatr-api -n 50`. Do not demo past that badge; it exists so a
fallback can never be mistaken for the agent working (FR-25).

### What was verified on the live deployment (25 Aug 2026)

Over public HTTPS, against `https://kreatr-demo.duckdns.org`:

- `http://` returns 301 to `https://`; TLS chain validates
- all five routes returned 200
- server-side rendering read the **real run** (`m_pricing_psychology`, the
  backend id) rather than falling back to the fixture's `m_pricing`
- the SSE activity stream arrived **incrementally** (52 lines within 1s), not
  buffered until the run ended
- approve → resume → publish → verify worked over a relative browser path, with
  the deliberate 504 retry firing (`recoveries: 1`)
- the approval gate held every unapproved asset at `pending`
- certbot's rewrite preserved the SSE block *and* its ordering ahead of `/api/`
- both services are `systemctl enable`d, so they survive a reboot
- `certbot renew --dry-run` passed, so auto-renewal works
- the existing `financehub` site returned 200 throughout

## 7. Going live with Bedrock

The deployment ships in **replay mode**, which runs the same tools with no model
in the loop. A replay run is a test double, not the agent deciding — never
present it as an agent run.

When AWS credentials exist:

```bash
sudo nano /root/kreatr/Kreatr/.env      # KREATR_AGENT_MODE=live, AWS_REGION, credentials
cd /root/kreatr/Kreatr
.venv/bin/python scripts/live_smoke.py --preflight    # seconds, near-free
.venv/bin/python scripts/live_smoke.py                # full run + behavioural verdict
sudo systemctl restart kreatr-api
```

Run the smoke test *before* restarting the service — it prints an actionable fix
for every failure mode (missing model access, wrong `global.`/`us.`/`eu.`
inference-profile prefix, expired keys). Expect the first live run to be too
generous with `select`; `memory.md` §6 has the tuning order.

An IAM role is not available on a non-AWS VPS, so this box needs an access key
pair in `.env`. Keep it `chmod 600` and scoped to Bedrock invoke plus Transcribe
and S3 if you use real ingest.

## 8. Operating it

```bash
journalctl -u kreatr-api -f          # agent activity, tool calls, errors
journalctl -u kreatr-web -f          # Next.js
systemctl restart kreatr-api         # NB: in-memory run store — restarting loses runs
```

**Restarting the API discards every run in progress.** The store is in memory
(`agent/store.py`); the JSON files in `data/runs/` are a mirror for inspection
and are not reloaded on boot. Start a fresh run after any restart, and do not
restart the API between recording takes for the demo video.

### Updating after a git push

```bash
cd /root/kreatr/Kreatr && git pull
sudo DOMAIN=kreatr-demo.duckdns.org ./deploy/provision.sh
```

### Both services are single-process on purpose

`kreatr-api.service` has no `--workers` flag. More than one worker gives each
process its own copy of the in-memory run store, so the workspace would read an
empty store roughly half the time. Scaling out means moving `agent/store.py` to
Redis first — redis is already running on this box if that becomes necessary.

## 9. Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| 502 on every page | `kreatr-web` is down | `journalctl -u kreatr-web -n 50`; usually a missing `next build` |
| 502 only on `/api/…` | `kreatr-api` is down | `journalctl -u kreatr-api -n 50` |
| Workspace shows *Seeded demo data* | Frontend could not reach the API | Check the API is up; confirm no run exists yet (`/api/runs`) |
| Agent feed arrives all at once at the end | `proxy_buffering` got re-enabled | The SSE `location` block must be matched *before* `/api/` in the vhost |
| Upload returns 422 mentioning ffmpeg | ffmpeg missing | `sudo apt install ffmpeg` |
| `provision.sh` refuses to start, names a port holder | 8010 or 3010 taken by something new | Change the port in `provision.sh`, both `.service` files, and `deploy/nginx/kreatr.conf` |
| certbot fails to validate | DNS not pointing here yet | `dig +short <domain>` must return `169.58.153.9` |
| Runs vanished | API restarted | Expected — in-memory store. Start a new run |
