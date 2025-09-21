# ReztoBelle Admin Web - Architecture Documentation

## Overview

ReztoBelle Admin Web is a full-stack e-commerce administration dashboard for managing jewelry products, orders, deliveries, expenses, and reports. The application follows a modern monorepo structure with separate frontend and backend applications.

## Project Structure

```
reztobelle-admin-web/
├── package.json                 # Root package with concurrency scripts
├── README.md                   # Project documentation
├── ARCHITECTURE.md             # This file
├── .copilot-instructions.md    # AI assistant instructions
├── backend/                    # Node.js/Fastify API server
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/                 # Database schema and migrations
│   │   ├── schema.prisma       # Prisma schema definition
│   │   └── migrations/         # Database migration files
│   └── src/
│       ├── index.ts            # Server entry point
│       ├── middleware/         # Custom middleware
│       ├── routes/             # API route handlers
│       └── types/              # TypeScript type definitions
└── frontend/                   # Next.js React application
    ├── package.json
    ├── next.config.mjs
    ├── components.json         # shadcn/ui configuration
    ├── app/                    # Next.js App Router pages
    ├── components/             # Reusable React components
    ├── contexts/               # React context providers
    ├── hooks/                  # Custom React hooks
    ├── lib/                    # Utility libraries and configurations
    ├── public/                 # Static assets
    └── styles/                 # Global CSS styles
```

## Technology Stack

### Backend (API Server)
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Fastify 4.x (Fast, efficient Node.js web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcryptjs for password hashing
- **Validation**: Zod schema validation
- **Documentation**: Swagger/OpenAPI with auto-generated UI
- **Security**: Helmet, CORS, Rate limiting
- **Language**: TypeScript

### Frontend (Admin Dashboard)
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI Framework**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui components
- **Component Library**: Radix UI primitives
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod resolvers
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics

### Database Schema (Prisma)
Key entities:
- **User**: Admin authentication and role management
- **Product**: Jewelry inventory with SKU, pricing, and stock
- **Order**: Customer orders with status tracking
- **OrderItem**: Individual items within orders
- **Delivery**: Shipment tracking and delivery management
- **Expense**: Business expense tracking and categorization

## Application Architecture

### Backend Architecture

The backend follows a modular route-based architecture:

```
src/
├── index.ts              # Server setup, plugins, and route registration
├── middleware/
│   └── auth.ts          # JWT authentication middleware
├── routes/              # Domain-specific route handlers
│   ├── auth.ts          # User authentication endpoints
│   ├── products.ts      # Product CRUD operations
│   ├── orders.ts        # Order management
│   ├── deliveries.ts    # Delivery tracking
│   ├── expenses.ts      # Expense management
│   └── reports.ts       # Analytics and reporting
└── types/
    └── fastify.d.ts     # Extended Fastify type definitions
```

**Key Features**:
- RESTful API design
- JWT-based authentication
- Role-based access control (RBAC)
- Input validation with Zod schemas
- Automatic API documentation
- Database migrations with Prisma
- Environment-based configuration

### Frontend Architecture

The frontend uses Next.js App Router with a component-based architecture:

```
app/                     # Next.js App Router pages
├── layout.tsx          # Root layout with providers
├── page.tsx           # Dashboard homepage
├── login/             # Authentication pages
├── products/          # Product management
├── orders/            # Order management
├── delivery/          # Delivery tracking
├── expenses/          # Expense management
├── inventory/         # Stock management
├── reports/           # Analytics dashboard
└── settings/          # Application settings

components/
├── ui/                # shadcn/ui base components
├── admin-layout.tsx   # Main admin dashboard layout
├── *-management.tsx   # Feature-specific management components
└── theme-provider.tsx # Dark/light theme provider

contexts/
└── auth-context.tsx   # Authentication state management

lib/
├── api.ts            # Axios HTTP client configuration
├── auth-service.ts   # Authentication utilities
├── utils.ts          # General utility functions
└── koombiyo-server.ts # Third-party delivery integration
```

**Key Features**:
- Server-side rendering (SSR) with Next.js
- Component composition with shadcn/ui
- Context-based state management
- Type-safe API calls with TypeScript
- Responsive design with Tailwind CSS
- Dark/light theme support
- Third-party delivery service integration

## API Structure

### Authentication Endpoints
- `POST /auth/login` - User login with email/password
- `POST /auth/register` - User registration (admin only)
- `GET /auth/me` - Get current user profile

### Product Management
- `GET /products` - List all products with pagination
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /products/:id` - Get single product

### Order Management
- `GET /orders` - List orders with filtering
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update order status
- `GET /orders/:id` - Get order details

### Delivery Integration
- `GET /deliveries` - List delivery records
- `POST /deliveries` - Create delivery tracking
- `PUT /deliveries/:id` - Update delivery status

### Expense Tracking
- `GET /expenses` - List expenses with categories
- `POST /expenses` - Add new expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

### Reports & Analytics
- `GET /reports/sales` - Sales analytics
- `GET /reports/inventory` - Stock reports
- `GET /reports/expenses` - Expense summaries

## Development Workflow

### Environment Setup
1. **Prerequisites**: Node.js >=18.0.0, npm >=9.0.0, PostgreSQL
2. **Installation**: `npm run install:all` (installs all dependencies)
3. **Database**: Set up PostgreSQL and configure `DATABASE_URL`
4. **Environment Variables**: Create `.env` files for both frontend and backend

### Development Commands
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend (Next.js dev server)
- `npm run dev:backend` - Start only backend (Fastify with tsx watch)
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio for database GUI

### Database Management
- **Migrations**: Use `prisma migrate dev` for schema changes
- **Seeding**: Run `npm run db:seed` to populate initial data
- **Schema Updates**: Modify `prisma/schema.prisma` and generate migrations

## Security Considerations

### Backend Security
- **Authentication**: JWT tokens with configurable expiration
- **Password Security**: bcryptjs hashing with salt rounds
- **API Protection**: Rate limiting, CORS, and Helmet middleware
- **Input Validation**: Zod schema validation for all endpoints
- **Environment Variables**: Sensitive data stored in `.env` files

### Frontend Security
- **Token Management**: Secure JWT storage and automatic refresh
- **Route Protection**: Authentication guards for admin routes
- **XSS Prevention**: React's built-in XSS protection
- **HTTPS Enforcement**: Production deployment with SSL/TLS

## Deployment Architecture

### Production Setup
- **Frontend**: Deployed on Vercel with automatic deployments
- **Backend**: Node.js server (PM2, Docker, or cloud platforms)
- **Database**: PostgreSQL (managed service recommended)
- **File Storage**: Cloud storage for product images
- **CDN**: Static asset delivery optimization

### Environment Configuration
- **Development**: Local PostgreSQL, file-based storage
- **Staging**: Cloud database, shared storage
- **Production**: Managed database, CDN, monitoring

## Key Design Decisions

1. **Monorepo Structure**: Simplifies development and deployment coordination
2. **Fastify over Express**: Better performance and TypeScript support
3. **Prisma ORM**: Type-safe database operations and easy migrations
4. **Next.js App Router**: Modern React patterns with SSR capabilities
5. **shadcn/ui**: Consistent, accessible, and customizable UI components
6. **Context API**: Lightweight state management for authentication
7. **TypeScript**: End-to-end type safety across the entire stack

## Performance Optimizations

### Frontend
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Bundle size monitoring and optimization
- **Caching**: Strategic use of React memo and useMemo

### Backend
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Prisma connection management
- **Response Caching**: Cache frequently accessed data
- **Rate Limiting**: Prevent API abuse and improve stability

## Monitoring and Observability

### Development
- **Type Checking**: Real-time TypeScript validation
- **Linting**: ESLint with consistent code quality rules
- **Formatting**: Prettier for code formatting
- **Hot Reloading**: Instant development feedback

### Production
- **Error Tracking**: Application error monitoring
- **Performance Metrics**: API response times and database queries
- **Analytics**: User interaction tracking with Vercel Analytics
- **Health Checks**: API endpoint health monitoring

## Future Considerations

### Scalability
- **Microservices**: Potential extraction of domains into separate services
- **Database Sharding**: Horizontal scaling for large datasets
- **Caching Layer**: Redis for session and data caching
- **Load Balancing**: Multiple backend instances for high availability

### Feature Extensions
- **Real-time Updates**: WebSocket integration for live order tracking
- **Mobile App**: React Native or Expo for mobile administration
- **Advanced Analytics**: Business intelligence and reporting dashboard
- **Multi-tenant**: Support for multiple jewelry store clients

## Contributing Guidelines

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Type Safety**: Maintain strict TypeScript compliance
3. **Testing**: Add unit tests for new features
4. **Documentation**: Update this architecture document for significant changes
5. **Database Changes**: Always create migrations for schema modifications
6. **API Changes**: Update Swagger documentation for endpoint modifications

---

This architecture documentation should be updated as the system evolves. For specific implementation details, refer to individual component documentation and inline code comments.