# iField Sync - Quick Start Guide

Get up and running in 5 minutes!

## Step 1: Install Prerequisites

Make sure you have:
- Python 3.9+ installed
- Node.js 18+ installed

Check versions:
```bash
python --version
node --version
```

## Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start server
python main.py
```

Backend should now be running at `http://localhost:8000`

## Step 3: Setup Frontend

Open a NEW terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should now be running at `http://localhost:3000`

## Step 4: Test the System

1. **Open browser**: Go to `http://localhost:3000`

2. **Create a job**:
   - Click "Admin Dashboard"
   - Click "Create New Job"
   - Fill in: Customer name = "Test Customer"
   - Click "Create Job"

3. **Copy the share link**:
   - Click "Copy Link" button
   - Open link in a new tab (or on your phone)

4. **Fill out the form**:
   - Add work details
   - Add a material item
   - Draw signatures in both signature boxes
   - Click "Submit Service Order"

5. **View submission**:
   - Go back to Admin Dashboard
   - Click "Submissions" tab
   - You should see your test submission
   - Click "Download PDF" to see generated PDF

## Step 5: Configure Email (Optional)

To enable email delivery:

1. Edit `backend/.env`
2. Add your email settings:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   DEFAULT_EMAIL_TO=office@company.com
   ```
3. Restart backend server

## Step 6: Test on Mobile

1. Find your computer's IP address:
   ```bash
   # Windows:
   ipconfig
   # Mac/Linux:
   ifconfig
   ```

2. On your phone, open:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

3. Test filling out a form on mobile

## Next Steps

- Read [README.md](README.md) for full documentation
- Configure ProjectSight integration
- Plan production deployment
- Customize PDF template if needed

## Common Issues

**"Port already in use"**
- Backend: Change port in `main.py` at the bottom
- Frontend: Port will auto-increment (try 3001, 3002, etc.)

**"Module not found" errors**
- Backend: Make sure virtual environment is activated
- Frontend: Try deleting `node_modules` and running `npm install` again

**Signatures not working on mobile**
- Ensure using HTTPS in production
- Test in different mobile browser

## Getting Help

Check the main [README.md](README.md) file for:
- Detailed troubleshooting
- API documentation
- Production deployment guide
- Feature explanations

---

**You're all set!** 🎉

The system is now ready for testing. Create jobs, fill forms, and generate PDFs!
