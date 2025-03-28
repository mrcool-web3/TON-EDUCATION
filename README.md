# TON Education - Web3 Learning Platform

A Telegram Mini App for Web3 education that transforms blockchain learning into an engaging, interactive experience, focusing on user-friendly blockchain onboarding and progressive learning.

## Features

- Telegram Mini App integration
- TON blockchain rewards and certificates
- Interactive course system with achievements
- Referral system with tiered rewards
- Leaderboard to showcase top learners
- SBT (Soulbound Token) certificates

## Deployment Options

### 1. Local Development

```bash
# Clone the repository
git clone <repository-url>
cd ton-education

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your specific configuration

# Start the development server
npm run dev
```

### 2. Docker Deployment

The simplest way to deploy the application is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd ton-education

# Create a .env file with your configuration
cp .env.example .env
# Edit .env with your specific configuration

# Build and start the containers
docker-compose up -d
```

This will start both the application and a PostgreSQL database. The application will be accessible at http://localhost:5000.

### 3. Production Deployment

For production deployments, use our production-ready Docker Compose setup:

```bash
# Create an .env file with production values
cp .env.example .env
# Edit .env with your production configuration

# Deploy using the production configuration
docker-compose -f docker-compose.prod.yml up -d
```

**Production Security Recommendations:**

1. Use strong, unique passwords for the database
2. Keep TON wallet keys secure and never expose them
3. Set proper firewall rules to restrict access to the server
4. Set up automated database backups
5. Configure a reverse proxy (like Nginx) with SSL/TLS
6. Use Docker Swarm or Kubernetes for high availability
7. Monitor the application logs and performance

**Example Nginx Configuration for SSL:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Automatic Deployment Script:**

Use the included `deploy.sh` script for easy deployment:

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/ton_education |
| SESSION_SECRET | Secret for session encryption | - |
| TON_NETWORK | TON network to use (testnet/mainnet) | testnet |
| TON_WALLET_ADDRESS | TON wallet address for sending rewards | - |
| TON_WALLET_PRIVATE_KEY | Private key for TON wallet | - |
| JWT_SECRET | Secret for JWT tokens (admin) | - |
| NODE_ENV | Environment (development/production) | development |
| PORT | Server port | 5000 |

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared code and database schema
- `/admin` - Admin dashboard (separate application)

## Database Migrations

To update the database schema:

```bash
npm run db:push
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Update database schema