# 🏗️ PMai - Construction Management Platform

> A modern, full-stack construction management platform built for efficiency and scale

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pmai-construction-platform.git
   cd pmai-construction-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   python simple_main.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## ✨ Features

## ✨ Features

### 🏢 Project Management
- Track multiple construction projects with budgets, timelines, and progress
- Real-time dashboard with project status and key metrics
- Budget tracking and cost analysis

### 📅 Schedule Management  
- Gantt-style scheduling with task dependencies
- Resource allocation and crew management
- Timeline tracking and milestone management

### 💰 Financial Tracking
- Budget management and cost control
- Schedule of Values (SOV) tracking
- Financial reporting and analytics

### 📋 Document Management
- Organize plans, specifications, and RFIs
- Version control for construction documents
- Change order management

### 🔧 Field Operations
- Daily reports and crew tracking
- Safety metrics and incident reporting
- Quality control and inspections

### 📊 Analytics & Reporting
- Comprehensive project dashboards
- Custom report generation
- Performance metrics and KPIs

## 🛠️ Technology Stack

### Frontend
- **⚛️ React 18** with TypeScript for type safety
- **⚡ Vite** for lightning-fast development
- **🎨 Tailwind CSS** with custom construction-themed gradients
- **🧭 React Router** for seamless navigation
- **🔄 React Query** for efficient data fetching and caching
- **✨ Lucide React** for beautiful, consistent icons

### Backend
- **🚀 FastAPI** with Python for high-performance APIs
- **🗄️ SQLAlchemy** ORM for database operations
- **🐘 PostgreSQL** for robust data persistence
- **✅ Pydantic** for data validation and serialization
- **🌐 Uvicorn** ASGI server for production deployment

### DevOps & Infrastructure
- **🐳 Docker** & Docker Compose for containerization
- **📝 TypeScript** for full-stack type safety
- **🔐 JWT** authentication (ready for implementation)

## 📁 Project Structure

```
PMai/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuration and database
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routes/        # API endpoints
│   │   ├── schemas/       # Pydantic schemas
│   │   └── main.py        # FastAPI application
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── hooks/         # Custom React hooks
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (optional)

### Quick Start with Docker

1. Clone the repository
2. Run the entire stack:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Quick Start Manual Setup

1. **Backend Setup:**
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   copy .env.example .env
   uvicorn app.main:app --reload
   ```

2. **Frontend Setup (in new terminal):**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3001 (Vite automatically chose 3001)
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🌟 Demo

### Live Demo Credentials
- **Email**: `demo@pmai.com`
- **Password**: `demo123`

### Screenshots
*Coming soon - Dashboard, Project Management, and Scheduling views*

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Roadmap

- [ ] **Authentication & Authorization**
  - [ ] JWT token implementation
  - [ ] Role-based access control
  - [ ] User management

- [ ] **Database Integration**
  - [ ] PostgreSQL connection
  - [ ] Data models and migrations
  - [ ] Seed data for demo

- [ ] **Advanced Features**
  - [ ] Real-time notifications
  - [ ] File upload and document management
  - [ ] Mobile responsive design
  - [ ] Advanced reporting and analytics

- [ ] **Deployment**
  - [ ] Docker production setup
  - [ ] CI/CD pipeline
  - [ ] Cloud deployment guides

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by industry-leading construction management platforms
- Designed for scalability and maintainability

## 📞 Support

If you have any questions or need help with setup, please:
- Open an issue on GitHub
- Check the [API documentation](http://localhost:8000/docs) when running locally

---

**Made with ❤️ for the construction industry**
