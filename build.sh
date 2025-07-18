#!/usr/bin/env bash

source ~/.nvm/nvm.sh
nvm use v20.18.0
git fetch --all
git reset --hard origin/main
git pull
(cd web && npm install && npm run build)
(cd server && npm install && npm run build && npx pm2 restart langhuan_server)
