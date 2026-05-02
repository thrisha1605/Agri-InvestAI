#!/bin/sh
set -eu

if [ -z "${AI_MODULE_URL:-}" ] && [ -n "${AI_MODULE_HOST:-}" ] && [ -n "${AI_MODULE_PORT:-}" ]; then
  export AI_MODULE_URL="http://${AI_MODULE_HOST}:${AI_MODULE_PORT}/recommend-crop"
fi

exec java -jar app.jar
