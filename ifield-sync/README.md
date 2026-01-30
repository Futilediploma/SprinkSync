# iField Sync - Field Service Form System

A complete mobile-friendly web application for field technicians on fire sprinkler installation teams. Generate professional PDF service orders with digital signatures and automatic delivery via ProjectSight API or email.

## Features

- ✅ **No Login Required** - Share secure links for each job
- 📱 **Mobile Optimized** - Touch-friendly interface for smartphones and tablets
- ✍️ **Digital Signatures** - Capture GC and technician signatures
- 📄 **PDF Generation** - Creates professional service orders matching your paper forms
- 📧 **Email Delivery** - Automatically email completed PDFs
- 🔗 **ProjectSight Integration** - Upload directly to ProjectSight (optional)
- 📷 **Photo Attachments** - Add photos as additional PDF pages
- 📊 **Admin Dashboard** - Manage jobs and view submissions

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Python 3.9+ + FastAPI + SQLAlchemy
- **Database**: SQLite
- **PDF Generation**: ReportLab
- **Signature Capture**: signature_pad library

## Project Structure

```
ifield-sync/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── config.py            # Configuration settings
│   ├── pdf_generator.py     # PDF creation
│   ├── services.py          # Email & ProjectSight services
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (create from .env.example)
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── types.ts         # TypeScript types
│   │   ├── api.ts           # API client
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Installation & Setup

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   # Copy example file
   cp .env.example .env

   # Edit .env with your settings
   ```

5. **Configure .env file** (optional features):
   ```env
   # Email Configuration (for email delivery)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=your-email@gmail.com
   DEFAULT_EMAIL_TO=office@company.com

   # ProjectSight API (for automatic upload)
   PROJECTSIGHT_API_KEY=your-api-key
   PROJECTSIGHT_API_URL=https://api.projectsight.com/v1
   PROJECTSIGHT_PROJECT_ID=your-project-id
   ```

6. **Start the backend server**:
   ```bash
   python main.py
   ```

   The API will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory** (new terminal):
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at: `http://localhost:3000`

## Usage Guide

### For Office Admin

1. **Access Admin Dashboard**:
   - Go to `http://localhost:3000/admin`

2. **Create a New Job**:
   - Click "Create New Job"
   - Fill in customer information
   - System generates a unique share link

3. **Share the Link**:
   - Copy the share link
   - Send to field technician via text, email, or messaging app
   - Link format: `http://localhost:3000/form/abc123xyz`

4. **View Submissions**:
   - Switch to "Submissions" tab
   - View all completed forms
   - Download PDFs
   - Check delivery status (ProjectSight/Email)

### For Field Technicians

1. **Open Share Link**:
   - Open the link sent by office on your mobile device

2. **Complete Form**:
   - Customer information is pre-filled
   - Fill in work details and time in/out
   - Add materials/services used
   - Take photos (optional)
   - Sign with GC and technician

3. **Submit**:
   - Choose delivery options (ProjectSight/Email)
   - Submit form
   - PDF is automatically generated and delivered

## Email Setup (Gmail)

To enable email delivery with Gmail:

1. **Enable 2-Factor Authentication**:
   - Go to Google Account settings
   - Enable 2FA

2. **Generate App Password**:
   - Go to Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Update .env**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

## ProjectSight Integration

To enable ProjectSight automatic upload:

1. **Get API Credentials**:
   - Contact ProjectSight support for API access
   - Obtain API key and project ID

2. **Update .env**:
   ```env
   PROJECTSIGHT_API_KEY=your-api-key
   PROJECTSIGHT_PROJECT_ID=your-project-id
   ```

3. **Test Integration**:
   - Submit a test form with "Upload to ProjectSight" checked
   - Verify upload in ProjectSight dashboard

## Production Deployment

### Backend Deployment

1. **Choose a hosting provider**:
   - AWS EC2, DigitalOcean, Heroku, or similar
   - Or use a Python-specific service like Railway, Render, or Fly.io

2. **Set environment variables**:
   - Configure all production settings in .env
   - Use a strong SECRET_KEY
   - Configure production CORS origins

3. **Use a production server**:
   ```bash
   # Install gunicorn
   pip install gunicorn

   # Run with gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

4. **Set up HTTPS**:
   - Use Let's Encrypt or CloudFlare
   - Configure reverse proxy (nginx/Apache)

### Frontend Deployment

1. **Build for production**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy static files**:
   - Upload `dist/` folder to:
     - Netlify (recommended)
     - Vercel
     - AWS S3 + CloudFront
     - Or any static hosting service

3. **Update API endpoint**:
   - Configure Vite proxy or update API base URL to point to production backend

### Database Considerations

For production, consider upgrading from SQLite to:
- PostgreSQL (recommended)
- MySQL
- MariaDB

Update `DATABASE_URL` in .env accordingly.

## Adding User Authentication (Future Enhancement)

The system currently uses share links (no login required). To add authentication:

### Option 1: Simple Admin Password

1. **Add password check in frontend**:
   ```typescript
   // Add to AdminDashboard.tsx
   const [authenticated, setAuthenticated] = useState(false);

   if (!authenticated) {
     return <LoginForm onLogin={() => setAuthenticated(true)} />;
   }
   ```

2. **Store password in .env**:
   ```env
   ADMIN_PASSWORD=your-secure-password
   ```

### Option 2: Full User Authentication

1. **Add authentication library**:
   ```bash
   pip install python-jose[cryptography] passlib[bcrypt]
   ```

2. **Create user management**:
   - Add User model to database
   - Implement JWT token generation
   - Add login/logout endpoints
   - Protect admin routes with authentication middleware

3. **Update frontend**:
   - Add login page
   - Store JWT token
   - Send token with API requests
   - Handle token refresh

## API Documentation

Once running, view interactive API docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Troubleshooting

### Backend won't start

- Verify Python version: `python --version` (should be 3.9+)
- Check if port 8000 is available
- Verify all dependencies installed: `pip list`

### Frontend won't start

- Verify Node version: `node --version` (should be 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check if port 3000 is available

### Signatures not saving

- Check browser console for JavaScript errors
- Ensure signature pad has been drawn on (not empty)
- Test on different device/browser

### PDFs not generating

- Check backend logs for errors
- Verify ReportLab installed correctly
- Check file permissions in `pdfs/` directory

### Emails not sending

- Verify SMTP credentials in .env
- For Gmail, ensure using App Password (not regular password)
- Check firewall allows outbound SMTP (port 587)

## Support & Contributing

For issues, questions, or contributions:
- Create an issue on the project repository
- Contact your system administrator
- Review API documentation at `/docs`

## License

Proprietary - Internal use only

## Credits

Built for fire sprinkler installation field teams to streamline service order documentation.
