# Use any base image based on glibc symbols (basically ubuntu/debian instead of alpine)
FROM python:3.10-slim AS app

# Choose which stash version you want here
COPY --from=stashapp/stash:latest /usr/bin/stash /usr/bin/stash
# COPY --from=stashapp/stash:development /usr/bin/stash /usr/bin/stash

# Git has been added from stash's Dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates ffmpeg libvips-tools tzdata git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    mechanicalsoup \
    cloudscraper \
    stashapp-tools

ENV STASH_CONFIG_FILE=/root/.stash/config.yml

# 7860 is the port used by deepface server
EXPOSE 7860/tcp
EXPOSE 9999/tcp
CMD ["stash"]
