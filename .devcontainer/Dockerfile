# Debian-based image — Cursor/VS Code server needs glibc (Alpine/musl fails to install it).
FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
RUN apt-get update \
	&& apt-get install -y --no-install-recommends git ca-certificates openssh-client ffmpeg \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
EXPOSE 5173
