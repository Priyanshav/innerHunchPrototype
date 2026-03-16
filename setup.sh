#!/bin/bash
# ═══════════════════════════════════════════════════════
#  Inner Hunch — Automated Setup Script
#  Run this once after extracting the zip:
#  chmod +x setup.sh && ./setup.sh
# ═══════════════════════════════════════════════════════

set -e  # Exit on any error

echo ""
echo "  ✦ Inner Hunch Setup"
echo "  ─────────────────────────────────"
echo ""

# ── 1. Check Node.js ──────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "  ❌ Node.js not found."
  echo "     Download it from: https://nodejs.org"
  exit 1
fi
NODE_VER=$(node -v)
echo "  ✅ Node.js $NODE_VER found"

# ── 2. Check npm ──────────────────────────────────────
if ! command -v npm &> /dev/null; then
  echo "  ❌ npm not found. Install Node.js from nodejs.org"
  exit 1
fi

# ── 3. Check PostgreSQL ───────────────────────────────
if ! command -v psql &> /dev/null; then
  echo ""
  echo "  ⚠️  PostgreSQL not found."
  echo "     Download from: https://www.postgresql.org/download/"
  echo "     Install it, then re-run this script."
  exit 1
fi
PG_VER=$(psql --version)
echo "  ✅ $PG_VER found"

# ── 4. Install npm packages ───────────────────────────
echo ""
echo "  📦 Installing packages..."
npm install
echo "  ✅ Packages installed"

# ── 5. Create .env if not exists ─────────────────────
if [ ! -f .env ]; then
  echo ""
  echo "  ⚙️  Creating .env file..."

  # Ask for Postgres password
  echo ""
  read -s -p "  Enter your PostgreSQL password (the one you set during install): " PG_PASS
  echo ""

  # Generate a random JWT secret
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

  cat > .env << EOF
PORT=3000
DATABASE_URL=postgresql://postgres:${PG_PASS}@localhost:5432/inner_hunch
JWT_SECRET=${JWT_SECRET}
NODE_ENV=development
EOF

  echo "  ✅ .env file created"
else
  echo "  ✅ .env already exists — skipping"
fi

# ── 6. Create database ────────────────────────────────
echo ""
echo "  🗄️  Setting up database..."

# Load password from .env
export PGPASSWORD=$(grep DATABASE_URL .env | sed 's/.*postgres:\(.*\)@.*/\1/')

# Create the database (ignore error if already exists)
psql -U postgres -c "CREATE DATABASE inner_hunch;" 2>/dev/null || echo "  ℹ️  Database already exists"

# Run the schema
psql -U postgres -d inner_hunch -f server/db-setup.sql

echo "  ✅ Database ready"

# ── 7. Done! ──────────────────────────────────────────
echo ""
echo "  ────────────────────────────────────"
echo "  🎉 Setup complete!"
echo ""
echo "  To start the app:"
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo "  ────────────────────────────────────"
echo ""
