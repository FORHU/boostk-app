#!/usr/bin/env bash
# Runs ON the EC2 host, as root, via SSM Run Command (AWS-RunShellScript).
#
# .github/workflows/deploy.yml ships this file and docker-compose.prod.yaml into
# APP_DIR, then runs it with IMAGE, REGISTRY, AWS_REGION and ENV_PARAM set.
# Everything it needs from AWS (ECR pull, the app.env parameter) comes from the
# instance's own IAM role — no credentials travel in the SSM command.
set -euo pipefail

: "${IMAGE:?}" "${REGISTRY:?}" "${AWS_REGION:?}" "${ENV_PARAM:?}"
cd "$(dirname "$0")"

# Pinned project name: keeps replacing the same containers (and leaves the old
# boostk-app_boostk_data volume alone) no matter which directory we run from.
dc() { docker compose -p boostk-app -f docker-compose.prod.yaml "$@"; }

# ── Bootstrap: Docker Compose v2 plugin ──────────────────────────────
# Installed system-wide, because SSM runs as root, not ec2-user.
if ! docker compose version &> /dev/null; then
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# app.env is written to Parameter Store by the workflow on every deploy, so
# GitHub secrets stay the single source of truth and nothing is edited by hand.
umask 077
aws ssm get-parameter --region "$AWS_REGION" --name "$ENV_PARAM" \
  --with-decryption --query Parameter.Value --output text > app.env

aws ecr get-login-password --region "$AWS_REGION" |
  docker login --username AWS --password-stdin "$REGISTRY"
docker pull -q "$IMAGE"

# docker-compose.prod.yaml interpolates ${IMAGE}, so every service
# (app, socket relay, migration job) runs the identical commit.
export IMAGE

# Migrations run BEFORE the new code starts, as a one-shot container from the
# same image. Retried because a managed database can be briefly unreachable
# (failover, a maintenance window); if it never succeeds, the deploy aborts and
# the old containers keep serving traffic.
#
# If all five attempts fail immediately rather than timing out, the cause is
# almost always the RDS security group not admitting this instance on 5432 —
# not the credentials.
for i in 1 2 3 4 5; do
  if dc run --rm app bun prisma migrate deploy; then
    echo "✅ migrations applied"
    break
  fi
  if [ "$i" = "5" ]; then
    echo "❌ migrations failed after 5 attempts — aborting deploy"
    exit 1
  fi
  echo "migrations failed (attempt $i), retrying in 5s..."
  sleep 5
done

# Seed the global-intake org/project. NOT `prisma db seed` — that runs
# prisma/seed.ts, which also creates demo tenants and must never touch
# production. seed-intake.ts is upsert-only infrastructure: the public /chat
# route throws without it.
#
# Non-fatal: a failure here leaves /chat broken but the rest of the app
# serving, which beats rolling back a good deploy. Check the log.
if dc run --rm app bun run prisma/seed-intake.ts; then
  echo "✅ intake project ready"
else
  echo "⚠️  intake seeding FAILED — /chat will not work until this is fixed"
fi

# A stray single-container deploy (`docker run --name boostk`) would otherwise
# linger next to the compose stack.
docker rm -f boostk &> /dev/null || true

dc up -d

# Fail the deploy loudly instead of reporting green on a dead app.
for i in $(seq 1 30); do
  if curl -fs http://127.0.0.1:5000/ > /dev/null; then
    echo "✅ app healthy after ${i}s"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "❌ health check failed — last 50 lines:"
    dc logs --tail=50 app
    exit 1
  fi
  sleep 1
done

docker image prune -f # clean up old image layers
