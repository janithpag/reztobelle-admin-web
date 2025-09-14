# ReztoBelle Admin Dashboard

A full-stack admin dashboard for ReztoBelle jewelry business with Next.js frontend and Fastify backend.

## Tech Stack

### Backend
- **Fastify** - Fast and efficient web framework
- **Prisma** - Next-generation ORM for database management
- **PostgreSQL** - Robust relational database
- **JWT** - Authentication
- **TypeScript** - Type safety

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Project Structure

```
├── backend/                 # Fastify API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── .env                # Environment variables
├── frontend/               # Next.js application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   ├── package.json
│   └── .env.local        # Environment variables
└── package.json          # Root package.json with scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### 1. Clone and Setup

```bash
git clone <repository-url>
cd reztobelle-admin-web
```

### 2. Install Dependencies

Install dependencies for all applications:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 3. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE reztobelle_db;
```

2. Update the database URL in `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/reztobelle_db"
```

3. Generate Prisma client and run migrations:
```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 4. Environment Variables

#### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/reztobelle_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
NODE_ENV=development
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NODE_ENV=development
```

### 5. Start Development Servers

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend (http://localhost:3001)
npm run dev:backend

# Frontend (http://localhost:3000)
npm run dev:frontend
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start both applications in production mode
- `npm run install:all` - Install dependencies for all applications

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Documentation

Once the backend is running, visit `http://localhost:3001/docs` for interactive API documentation powered by Swagger.

## Database Schema

The application includes the following main entities:

- **Users** - Admin users with authentication
- **Products** - Jewelry products with inventory management
- **Orders** - Customer orders with items
- **Deliveries** - Shipping and delivery tracking
- **Expenses** - Business expense tracking

## Features

### Admin Dashboard
- Overview with key metrics
- Sales analytics and reports
- Low stock alerts

### Product Management
- Add, edit, delete products
- Inventory tracking
- Category organization
- Image management

### Order Management
- View and manage orders
- Order status tracking
- Customer information
- Order items breakdown

### Delivery Integration
- Track deliveries
- Integration ready for Koombiyo and other providers
- Delivery status updates

### Expense Tracking
- Record business expenses
- Category-based organization
- Receipt management
- Expense reporting

### Reports
- Sales reports with date filtering
- Inventory reports
- Expense analysis
- Dashboard overview

## Development Notes

### Adding New Routes
1. Create route file in `backend/src/routes/`
2. Register route in `backend/src/index.ts`
3. Add corresponding frontend API calls

### Database Changes
1. Update `backend/prisma/schema.prisma`
2. Generate migration: `npm run db:migrate`
3. Update TypeScript types

### Frontend Components
- UI components are in `frontend/components/ui/`
- Page-specific components in `frontend/components/`
- Use TypeScript for all components

## Production Deployment

### Backend
1. Set production environment variables
2. Run `npm run build`
3. Deploy with `npm run start`

### Frontend
1. Set production API URL in environment
2. Run `npm run build`
3. Deploy the `.next` folder

### Database
1. Set production database URL
2. Run migrations: `npm run db:migrate:deploy`

## Support

For issues and questions, please refer to the development team or create an issue in the repository.