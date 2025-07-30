# Fix Docker Permission Issue and Deploy Updates

## 🔧 Commands to run on your server:

```bash
# SSH into your server
ssh futilediploma@192.168.1.31

# Navigate to project directory
cd ~/SprinkSync

# Stop all containers with sudo (to fix permission issue)
sudo docker compose down

# Remove any stuck containers
sudo docker container prune -f

# Pull latest changes from GitHub
git pull origin main

# Rebuild and start containers
sudo docker compose up -d --build

# Check status
docker ps

# Test the API
curl https://sprinksync.com/api/health
```

## ✅ What the login form now does:

1. **Real Authentication**: Connects to `/api/auth/login` endpoint
2. **Error Handling**: Shows error messages for failed login attempts  
3. **Loading State**: Shows "Signing in..." during authentication
4. **Token Storage**: Stores JWT token and user data in localStorage
5. **Proper Navigation**: Uses React Router navigate instead of window.location

## 🎯 Changes made to Simplelanding.tsx:

- ✅ Added real API authentication call
- ✅ Added error state and display
- ✅ Added loading state with disabled button
- ✅ Added proper token storage
- ✅ Used React Router navigation
- ✅ Removed hardcoded dashboard redirect

Run the commands above to fix the Docker issue and deploy your updated login form!
