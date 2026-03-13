#!/bin/bash

echo "🏥 Starting Medical Note-Taking App"
echo "=================================="

# Check if .env has PUBLIC_URL
if ! grep -q "PUBLIC_URL=https://mymedicalapp.loca.lt" .env 2>/dev/null; then
    echo "📝 Updating .env with tunnel URL..."
    sed -i '/PUBLIC_URL/d' .env 2>/dev/null || true
    echo "PUBLIC_URL=https://mymedicalapp.loca.lt" >> .env
fi

echo "✅ Environment configured"
echo ""

echo "🚀 Starting services..."
echo ""

echo "1️⃣  Start LocalTunnel in one terminal:"
echo "   lt --port 8000 --subdomain mymedicalapp"
echo ""

echo "2️⃣  Start API in another terminal:"
echo "   uvicorn app.main:app --reload"
echo ""

echo "3️⃣  Then access Swagger UI at:"
echo "   https://mymedicalapp.loca.lt/docs"
echo ""

echo "💡 Both services must be running simultaneously!"
echo ""

# Check if localtunnel is installed
if ! command -v lt &> /dev/null; then
    echo "⚠️  LocalTunnel not installed. Install with:"
    echo "   npm install -g localtunnel"
fi

# Check if uvicorn is available
if ! command -v uvicorn &> /dev/null; then
    echo "⚠️  Uvicorn not installed. Install with:"
    echo "   pip install uvicorn"
fi