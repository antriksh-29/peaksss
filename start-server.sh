#!/bin/bash

echo "🚀 Starting Peaksss application..."
echo "📍 Make sure you're running Node.js 20+ (nvm use 20)"
echo ""

# Check Node version
NODE_VERSION=$(node -v)
echo "Current Node.js version: $NODE_VERSION"

# Start the development server
echo "Starting Next.js development server..."
npm run dev