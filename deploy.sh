#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Building..."
npx vite build
echo "Deploying to /var/www/planting.martinospizza.dev/..."
sudo rm -rf /var/www/planting.martinospizza.dev/*
sudo cp -r dist/* /var/www/planting.martinospizza.dev/
echo "Done! Live at https://planting.martinospizza.dev"
