#!/bin/bash

echo "🚀 Setting up ReztoBelle Admin Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not found. Make sure PostgreSQL is installed and running."
fi

echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Return to root
cd ..

echo "✅ Dependencies installed successfully!"

echo "🔧 Next steps:"
echo "1. Set up your PostgreSQL database"
echo "2. Update the DATABASE_URL in backend/.env"
echo "3. Run 'cd backend && npm run db:migrate' to set up the database"
echo "4. Run 'npm run dev' to start both servers"

echo ""
echo "📚 For detailed instructions, see README.md"