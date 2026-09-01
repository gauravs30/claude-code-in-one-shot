# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Multi-stage build:
#   1. fetch  — run the GitHub data fetch script (offline-safe: falls back to
#               the committed site/data/projects.json on failure)
#   2. final  — nginx serving the static site
# Build context is the repo root. Build from repo root with:
#   docker build -f docker/Dockerfile -t portfolio-web .
# (docker-compose does this for you.)
# ---------------------------------------------------------------------------

FROM node:20-alpine AS fetch
WORKDIR /app
# Optional: raises GitHub API rate limits. Passed through by docker-compose.
ARG GITHUB_TOKEN=""
ENV GITHUB_TOKEN=$GITHUB_TOKEN
COPY package.json ./
COPY scripts ./scripts
COPY content ./content
COPY site/data/projects.json ./site/data/projects.json
RUN node scripts/fetch-github.mjs || true

# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS final
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
# overwrite the committed data file with the freshly fetched one
COPY --from=fetch /app/site/data/projects.json /usr/share/nginx/html/data/projects.json

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/healthz || exit 1

EXPOSE 80
