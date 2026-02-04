# Deployment Guide

## Push from Local (Windows)

```bash
# 1. Stage all changes
git add .

# 2. Commit with a message
git commit -m "Your commit message here"

# 3. Push to remote
git push origin main
```

---

## Pull on Live Server (Linux)

### 1. Connect to your server

```bash
mosh futilediploma@host
# or
ssh futilediploma@host
```

### 2. Pull latest changes

```bash
cd ~
git pull origin main
```

### 3. Update backend dependencies (if requirements changed)

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Run database migrations (if needed)

```bash
alembic upgrade head
```

### 5. Update frontend (if changed)

```bash
cd ~/frontend
npm install
npm run build
```

### 6. Restart backend

```bash
cd ~
pkill -f uvicorn
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

### 7. Verify backend is running

```bash
tail -20 backend.log
# Should show: "Uvicorn running on http://0.0.0.0:8000"
```

---

## Quick Deploy (All-in-One)

```bash
cd ~
git pull origin main
pkill -f uvicorn
pkill -f "python main.py"
source venv/bin/activate
cd ~/SprinkSync/manpower-forecast/backend
nohup python main.py > backend.log 2>&1 &
tail -10 backend.log
```

---

## Backup Database First

```bash
cp /home/futilediploma/SprinkSync/manpower-forecast/backend/manpower_forecast.db ~/database_backup_$(date +%Y%m%d).db



---

## Troubleshooting

### Check if backend is running

```bash
ps aux | grep uvicorn
```

### View backend logs

```bash
tail -50 backend.log
```

### Test API endpoint

```bash
curl http://localhost:8000/api/projects/
```

### Migration errors

```bash
# Check current migration status
alembic current

# View migration history
alembic history
```

### Git conflicts

```bash
# If you have local changes on server that conflict
git stash
git pull origin main
git stash pop  # reapply local changes if needed
```
