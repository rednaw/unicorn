# Debian-based image — Cursor/VS Code server needs glibc (Alpine/musl fails to install it).
FROM node:24.18.1-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apt-get update \
	&& apt-get install -y --no-install-recommends git git-lfs ca-certificates openssh-client ffmpeg \
	&& git lfs install \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

RUN corepack enable

EXPOSE 5173
