# Debian-based image — Cursor/VS Code server needs glibc (Alpine/musl fails to install it).
FROM node:24.18.0-bookworm-slim

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
RUN apt-get update \
	&& apt-get install -y --no-install-recommends git git-lfs ca-certificates openssh-client ffmpeg \
	&& git lfs install \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
EXPOSE 5173
