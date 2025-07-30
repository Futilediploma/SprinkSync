@echo off
echo 🚀 Starting SprinkSync Frontend Development Server

:: Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing npm dependencies...
    npm install
)

:: Start the development server
echo 🌟 Starting React development server...
npm run dev
