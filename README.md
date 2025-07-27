<p align="center">
  <img src="https://img.shields.io/badge/FortiSafe-Cybersecurity%20Platform-blue" alt="FortiSafe Logo" />
</p>

<p align="center">A comprehensive cybersecurity solution combining browser extension, web application, and secure backend for password management and real-time threat protection.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Auth0-EB5424?style=flat&logo=auth0&logoColor=white" alt="Auth0" />
</p>

## 🛡️ About FortiSafe

FortiSafe is a comprehensive cybersecurity platform that addresses modern digital security challenges through an integrated three-tier architecture:

- **Browser Extension**: Real-time protection and password management
- **Web Application**: Comprehensive password management dashboard
- **Backend API**: Secure authentication, password storage, and security scanning

## 🏗️ System Architecture

### Technology Stack

**Frontend**
- Next.js with React
- Framer Motion for animations
- Tailwind CSS for styling

**Backend**
- NestJS framework
- MongoDB for data storage
- Auth0 for authentication
- JWT token management

**Browser Extension**
- JavaScript with Chrome Extension API
- Real-time website scanning
- Secure credential management

**DevOps & Infrastructure**
- Nginx reverse proxy
- Cloudflare for SSL/TLS and security
- Docker containerization
- GitHub Actions CI/CD pipeline

## ✨ Key Features

### 🔐 Password Management
- Secure password storage with end-to-end encryption
- Password strength analysis
- Automated password generation
- Secure credential sharing

### 🛡️ Real-time Protection
- Website security scanning
- Phishing detection using Google Safe Browsing API
- Real-time threat alerts
- Cross-origin secure communication

### 👤 User Management
- Auth0 integration for secure authentication
- User profile management
- Session handling with JWT tokens
- Account preferences and settings

### 📧 Email Services
- Brevo SMTP integration for notifications
- Security alerts and updates
- Account verification emails

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- MongoDB Atlas account
- Auth0 account

### Project Setup

1. **Clone the repository**
```bash
git clone https://github.com/katz-dev/fortisafe
cd fortisafe
```

2. **Install dependencies**
```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

3. **Environment Configuration**

Backend ([backend/.env](backend/.env)):
```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# Auth0 Configuration
AUTH0_DOMAIN=your_auth0_domain
AUTH0_AUDIENCE=your_auth0_audience
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_CALLBACK_URL=http://localhost:8080/api/auth/callback

# App Configuration
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EXTENSION_URL=chrome-extension://your_extension_id

# Security
PASSWORD_ENCRYPTION_KEY=your_encryption_key
GOOGLE_SAFE_BROWSING_API_KEY=your_google_api_key

# Email Configuration (Brevo)
BREVO_SMTP=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_USER=your_brevo_user
BREVO_PASS=your_brevo_password
EMAIL_FROM_ADDRESS=your_email
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_NAME=fortisafe
BREVO_BASE_URL=https://api.brevo.com/v3
```

Frontend ([frontend/.env](frontend/.env)):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080/api
```

## 🏃‍♂️ Running the Application

### Backend Development
```bash
cd backend

# Development mode
pnpm run start:dev

# Production mode
pnpm run start:prod

# Watch mode
pnpm run start
```

### Frontend Development
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Browser Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the [extension](extension) folder

## 🧪 Testing

```bash
# Backend tests
cd backend

# Unit tests
pnpm run test

# End-to-end tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## 🚀 Deployment

The application supports containerized deployment with Docker and includes CI/CD pipeline configuration with GitHub Actions.

### Docker Deployment
```bash
# Backend
cd backend
docker build -t fortisafe-backend .

# Frontend
cd frontend
docker build -t fortisafe-frontend .
```

### Production Deployment
- **Nginx**: Configured as reverse proxy (see [nginx](nginx) directory)
- **Cloudflare**: SSL/TLS termination and additional security layer
- **MongoDB Atlas**: Cloud database hosting
- **Auth0**: Authentication service

## 🔒 Security Features

- **End-to-end encryption** for password storage
- **HTTPS** with proper CORS configuration
- **JWT token-based** authentication
- **Password hashing** with secure algorithms
- **Cross-origin communication** security
- **Real-time threat detection** with Google Safe Browsing API

## 🔮 Future Enhancements

- Multi-Factor Authentication (MFA)
- Advanced threat detection with machine learning
- Mobile application development
- Enterprise features for team management
- Enhanced password sharing capabilities

## 📁 Project Structure

```
fortisafe/
├── backend/          # NestJS backend API
├── frontend/         # Next.js web application
├── extension/        # Chrome browser extension
├── nginx/           # Nginx configuration
├── .github/         # GitHub Actions workflows
└── docs/            # Project documentation
```

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support & Contact

For support, questions, or feedback:
- Create an issue in this repository
- Contact the development team

---

<p align="center">Built with ❤️ for digital security and privacy</p>
