#!/usr/bin/env bash
#
# Provision Kreatr on this VPS. Idempotent — safe to re-run after a git pull.
#
#   sudo DOMAIN=kreatr-demo.duckdns.org ./deploy/provision.sh
#
# This box already serves another project (financehub) through nginx on 80/443,
# so Kreatr installs *alongside* it: its own vhost, its own systemd units, its
# own loopback ports. Nothing here touches the existing site, and nginx is
# validated before it is reloaded so a bad config cannot take the box down.
#
# What it does NOT do: request a TLS certificate. That is one certbot command,
# run separately once DNS resolves — see DEPLOY.md.

set -euo pipefail

REPO="/root/kreatr/Kreatr"
API_PORT=8010
WEB_PORT=3010
DOMAIN="${DOMAIN:-}"

say()  { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
ok()   { printf '    \033[32mok\033[0m   %s\n' "$1"; }
warn() { printf '    \033[33mwarn\033[0m %s\n' "$1"; }
die()  { printf '    \033[31mfail\033[0m %s\n' "$1" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root (systemd units and nginx config need it)."
[[ -n "$DOMAIN" ]] || die "Set DOMAIN, e.g. DOMAIN=kreatr-demo.duckdns.org $0"
[[ -d "$REPO" ]]   || die "Repo not found at $REPO."

# ---------------------------------------------------------------------------
say "Checking the ports are actually free"
# 8000-8003 are taken by the other project on this box. Claiming a busy port
# would leave the service in a restart loop that looks like an app bug.
for port in "$API_PORT" "$WEB_PORT"; do
    if ss -tlnH "sport = :$port" | grep -q .; then
        # Our own service holding it across a re-run is fine.
        holder=$(ss -tlnpH "sport = :$port" | grep -oE 'users:\(\("[^"]+' | cut -d'"' -f2 | head -1)
        if systemctl is-active --quiet kreatr-api kreatr-web 2>/dev/null; then
            ok "port $port held by Kreatr itself (re-run)"
        else
            die "port $port is already in use by '${holder:-unknown}'. Pick another in this script, the systemd units and deploy/nginx/kreatr.conf."
        fi
    else
        ok "port $port free"
    fi
done

# ---------------------------------------------------------------------------
say "System packages"
if ! command -v ffmpeg >/dev/null; then
    apt-get update -qq
    # ffmpeg carries ffprobe; agent/ingest.py needs both.
    apt-get install -y -qq ffmpeg
    ok "installed ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3)"
else
    ok "ffmpeg present ($(ffmpeg -version | head -1 | cut -d' ' -f3))"
fi

# ---------------------------------------------------------------------------
say "Python environment"
if [[ ! -x "$REPO/.venv/bin/python" ]]; then
    python3 -m venv "$REPO/.venv"
    ok "created .venv"
fi
"$REPO/.venv/bin/pip" install -q --upgrade pip
"$REPO/.venv/bin/pip" install -q -r "$REPO/requirements.txt"
ok "python dependencies installed"

# ---------------------------------------------------------------------------
say "Environment file"
if [[ ! -f "$REPO/.env" ]]; then
    cp "$REPO/.env.example" "$REPO/.env"
    # Without credentials a live run only fails at the first Bedrock call, well
    # into the run. Replay is the honest default until AWS access exists.
    sed -i 's|^KREATR_AGENT_MODE=.*|KREATR_AGENT_MODE=replay|' "$REPO/.env"
    sed -i "s|^API_PORT=.*|API_PORT=$API_PORT|" "$REPO/.env"
    sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://$DOMAIN|" "$REPO/.env"
    chmod 600 "$REPO/.env"
    warn "wrote .env in replay mode — set KREATR_AGENT_MODE=live once AWS credentials exist"
else
    ok ".env already exists, left untouched"
fi

# ---------------------------------------------------------------------------
say "Frontend build"
cd "$REPO/apps/web"
npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund
# NEXT_PUBLIC_* is inlined at build time, so the browser base must be set here,
# not in the systemd unit. "/" means same-origin: every browser call is relative
# and inherits the page's scheme, which is what keeps https pages from making
# blocked http requests.
NEXT_PUBLIC_API_URL=/ npm run build
ok "next build complete"
cd "$REPO"

# ---------------------------------------------------------------------------
say "systemd services"
install -m 644 "$REPO/deploy/kreatr-api.service" /etc/systemd/system/kreatr-api.service
install -m 644 "$REPO/deploy/kreatr-web.service" /etc/systemd/system/kreatr-web.service
systemctl daemon-reload
systemctl enable --now kreatr-api kreatr-web
systemctl restart kreatr-api kreatr-web
ok "kreatr-api and kreatr-web enabled and started"

# ---------------------------------------------------------------------------
say "Waiting for the services to answer"
for _ in $(seq 1 30); do
    curl -sf -m 2 "http://127.0.0.1:$API_PORT/api/health" >/dev/null 2>&1 && break
    sleep 1
done
curl -sf -m 2 "http://127.0.0.1:$API_PORT/api/health" >/dev/null \
    || die "API not answering on $API_PORT. Check: journalctl -u kreatr-api -n 50"
ok "API healthy: $(curl -s "http://127.0.0.1:$API_PORT/api/health")"

for _ in $(seq 1 30); do
    curl -sf -m 3 -o /dev/null "http://127.0.0.1:$WEB_PORT/" 2>/dev/null && break
    sleep 1
done
curl -sf -m 5 -o /dev/null "http://127.0.0.1:$WEB_PORT/" \
    || die "Web not answering on $WEB_PORT. Check: journalctl -u kreatr-web -n 50"
ok "web healthy on $WEB_PORT"

# ---------------------------------------------------------------------------
say "nginx vhost"
# Certbot rewrites the installed file when it issues a cert, so an existing
# vhost is never clobbered — that would silently drop the TLS directives and
# revert the site to plain http.
if [[ -f /etc/nginx/sites-available/kreatr ]] \
   && grep -q "managed by Certbot" /etc/nginx/sites-available/kreatr; then
    warn "vhost already has certbot's TLS block — leaving it alone"
else
    sed "s/KREATR_DOMAIN/$DOMAIN/g" "$REPO/deploy/nginx/kreatr.conf" \
        > /etc/nginx/sites-available/kreatr
    ln -sf /etc/nginx/sites-available/kreatr /etc/nginx/sites-enabled/kreatr
    ok "vhost installed for $DOMAIN"
fi

# Validate before reloading: a syntax error here would also take down the
# other site already served by this nginx.
nginx -t 2>&1 | sed 's/^/    /' || die "nginx config test failed — NOT reloading."
systemctl reload nginx
ok "nginx reloaded"

# ---------------------------------------------------------------------------
say "Done"
cat <<EOF

  Kreatr is live on http://$DOMAIN

  Next, once DNS for $DOMAIN points at this box:

      certbot --nginx -d $DOMAIN

  That rewrites the vhost with TLS and adds the http->https redirect, the same
  way the existing site on this box is set up. HTTPS is not cosmetic here: the
  page and the API share one origin, so a plain-http demo is fine, but a
  half-secured one would have the browser block the API calls and the workspace
  would quietly fall back to seeded fixture data.

  Logs:     journalctl -u kreatr-api -f
            journalctl -u kreatr-web -f
  Restart:  systemctl restart kreatr-api kreatr-web

EOF
