# Debian-based image — Cursor/VS Code server needs glibc (Alpine/musl fails to install it).
FROM node:24.18.0-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apt-get update \
	&& apt-get install -y --no-install-recommends git git-lfs ca-certificates openssh-client ffmpeg \
	&& git lfs install \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Match packageManager in package.json — avoids interactive Corepack download prompts.
COPY package.json ./
RUN corepack enable \
	&& corepack prepare "$(node -p "require('./package.json').packageManager")" --activate

EXPOSE 5173
