# Multi-Tenant Authentication System Design

## 🏢 System Overview


This system implements a hierarchical multi-tenant architecture with four user types:

1. **Admin** – Has all privileges, including company creation/modification and user privilege assignment.
2. **Project Manager** – Has all privileges except company creation/modification and user privilege assignment. Can alter all other information.
3. **Design Credential** – Can only access the Documents, Design, and Inspections sections.
4. **Field Credential** – Can only access the Field section.

### Privilege Matrix

| Role               | Company Mgmt | User Privileges | Project Mgmt | Documents | Design | Inspections | Schedule | Field |
|--------------------|:------------:|:---------------:|:------------:|:---------:|:------:|:-----------:|:--------:|:-----:|
| Admin              |      ✔️      |       ✔️        |      ✔️      |     ✔️    |   ✔️   |     ✔️     |    ✔️    |  ✔️   |
| Project Manager    |      ❌      |       ❌        |      ✔️      |     ✔️    |   ✔️   |     ✔️     |    ✔️    |  ✔️   |
| Design Credential  |      ❌      |       ❌        |      ❌      |     ✔️    |   ✔️   |     ✔️     |    ❌    |  ❌   |
| Field Credential   |      ❌      |       ❌        |      ❌      |     ❌    |   ❌   |     ❌     |    ❌    |  ✔️   |

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'project_manager', 'design_credential', 'field_credential')),
    company_id UUID REFERENCES companies(id),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Companies Table
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Invitations Table
```sql
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id),
    invited_by UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table (Updated)
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Authentication Flow

### 1. Company Registration
```
Super Admin → Create Company → Generate Admin Account → Send Invitation
```

### 2. User Invitation Flow
```
Company Admin → Send Invitation → User Receives Email → User Accepts → Account Created
```

### 3. Login Flow
```
User Login → Validate Credentials → Generate JWT → Access Company Data
```

## 🎯 Implementation Plan

### Phase 1: Backend Authentication
1. Create database models
2. Implement JWT authentication
3. Add password hashing
4. Create invitation system
5. Add role-based access control

### Phase 2: Frontend Authentication
1. Login/Register pages
2. Company setup wizard
3. User invitation interface
4. Role-based navigation
5. Protected routes

### Phase 3: Multi-Tenancy
1. Company data isolation
2. Subscription management
3. User management interface
4. Audit logging

## 🚀 Quick Start Implementation

I'll create the essential files to get started...
