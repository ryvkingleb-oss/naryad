#!/bin/bash
# Installs «Наряд» into /opt/documentmigrant.
# Does not touch /opt/naryad (another site) and does not start nginx.
# Port 80 on this host belongs to the existing Caddy container.
set -euo pipefail

ROOT=/opt/documentmigrant

if [[ "${PWD}" == "/opt/naryad" || "${ROOT}" == "/opt/naryad" ]]; then
  echo "refusing to install into /opt/naryad" >&2
  exit 1
fi

if [[ ! -f "${ROOT}/package.json" || ! -f "${ROOT}/dist/index.html" || ! -f "${ROOT}/server/index.mjs" ]]; then
  echo "copy the built app to ${ROOT} first (package.json, dist, server)" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

cd "${ROOT}"
npm ci --omit=dev

id naryad >/dev/null 2>&1 || useradd --system --home "${ROOT}" --shell /usr/sbin/nologin naryad
mkdir -p "${ROOT}/data"
chown -R naryad:naryad "${ROOT}"

cat > /etc/systemd/system/naryad.service << UNIT
[Unit]
Description=Naryad document service
After=network.target

[Service]
WorkingDirectory=${ROOT}
Environment=HOST=172.18.0.1
Environment=PORT=8787
ExecStart=/usr/bin/node server/index.mjs
User=naryad
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable naryad
systemctl restart naryad
systemctl disable nginx >/dev/null 2>&1 || true
systemctl stop nginx >/dev/null 2>&1 || true
sleep 1
curl -fsS http://172.18.0.1:8787/api/health
echo
echo "naryad installed in ${ROOT}"
echo "public HTTP is the existing Caddy site, see deploy/documentmigrant.caddy"
echo "do not enable nginx: it cannot bind port 80 while Caddy is running"
