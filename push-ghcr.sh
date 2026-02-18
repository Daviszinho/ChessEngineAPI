#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   CR_PAT=ghp_xxx ./push-ghcr.sh [version] [image_name]
#   echo "ghp_xxx" > .ghcr_token && chmod 600 .ghcr_token && ./push-ghcr.sh [version] [image_name]
#
# Example:
#   CR_PAT=ghp_xxx ./push-ghcr.sh 1.0.0 chess-engine-api

GH_USER="${GH_USER:-daviszinho}"
VERSION="${1:-$(date +%Y.%m.%d-%H%M%S)}"
IMAGE_NAME="${2:-chess-engine-api}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH."
  exit 1
fi

if [[ -z "${CR_PAT:-}" ]] && [[ -f ".ghcr_token" ]]; then
  CR_PAT="$(tr -d '\r\n' < .ghcr_token)"
fi

if [[ -z "${CR_PAT:-}" ]]; then
  echo "Error: CR_PAT is required."
  echo "Run: CR_PAT=ghp_xxx ./push-ghcr.sh [version] [image_name]"
  echo "or create .ghcr_token with your PAT."
  exit 1
fi

IMAGE_BASE="ghcr.io/${GH_USER}/${IMAGE_NAME}"
TAG_LATEST="${IMAGE_BASE}:latest"
TAG_VERSION="${IMAGE_BASE}:${VERSION}"

echo "Logging in to ghcr.io as ${GH_USER}..."
echo "${CR_PAT}" | docker login ghcr.io -u "${GH_USER}" --password-stdin

echo "Building image ${TAG_LATEST} and ${TAG_VERSION}..."
docker build -t "${TAG_LATEST}" -t "${TAG_VERSION}" .

echo "Pushing ${TAG_LATEST}..."
docker push "${TAG_LATEST}"

echo "Pushing ${TAG_VERSION}..."
docker push "${TAG_VERSION}"

echo "Done."
echo "Published:"
echo "  ${TAG_LATEST}"
echo "  ${TAG_VERSION}"
echo "If this is the first push, set package visibility to Public in GitHub UI."
