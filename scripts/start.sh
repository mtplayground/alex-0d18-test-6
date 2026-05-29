#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

load_env_file() {
  env_file="$1"

  if [ ! -f "$env_file" ]; then
    return
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*)
        continue
        ;;
    esac

    key=${line%%=*}
    value=${line#*=}

    case "$key" in
      ''|[0-9]*|*[!A-Za-z0-9_]*)
        continue
        ;;
    esac

    eval "current_value=\${$key-}"
    if [ -z "$current_value" ]; then
      export "$key=$value"
    fi
  done < "$env_file"
}

load_env_file ".env.production"

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required. Set it in the environment or .env.production." >&2
  exit 1
fi

if [ ! -f "backend/dist/index.js" ]; then
  echo "backend/dist/index.js is missing. Run npm run build before npm run start." >&2
  exit 1
fi

npm run db:generate --workspace backend

exec npm run start --workspace backend
