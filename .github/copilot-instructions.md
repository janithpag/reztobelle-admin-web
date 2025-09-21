# Copilot Instructions for ReztoBelle Admin Web

## Project Context

You are working on **ReztoBelle Admin Web**, a full-stack e-commerce administration dashboard for managing jewelry products, orders, deliveries, expenses, and reports. This is a monorepo project with separate frontend and backend applications.

## Essential Reading

**IMPORTANT**: Before providing any assistance, always refer to the `ARCHITECTURE.md` file in the root directory for comprehensive project details including:
- Complete project structure and organization
- Technology stack and dependencies
- API endpoints and database schema
- Development workflow and commands
- Security considerations and deployment architecture

## Project Structure Overview

```
reztobelle-admin-web/
├── backend/          # Fastify + Prisma + PostgreSQL API
├── frontend/         # Next.js + TypeScript + shadcn/ui
├── ARCHITECTURE.md   # Comprehensive project documentation
└── package.json      # Root package with scripts
```

## Technology Stack Summary

### Backend
- **Fastify** (Node.js framework)
- **Prisma** (PostgreSQL ORM)
- **TypeScript** (Type safety)
- **JWT** (Authentication)
- **Zod** (Validation)

### Frontend
- **Next.js 14+** (React framework with App Router)
- **TypeScript** (Type safety)
- **Tailwind CSS** + **shadcn/ui** (Styling and components)
- **React Hook Form** + **Zod** (Form handling)
- **Axios** (HTTP client)

## Development Commands (From Root)

```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend (port 3000)
npm run dev:backend      # Start only backend (port 3001)
npm run install:all      # Install all dependencies
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
```

## Key Guidelines for AI Assistance

### 1. Architecture Awareness
- Always consider the monorepo structure when making changes
- Understand that frontend (Next.js) and backend (Fastify) are separate applications
- Reference the database schema in `backend/prisma/schema.prisma`

### 2. Code Standards
- Maintain **strict TypeScript** compliance throughout
- Follow **ESLint** and **Prettier** configurations
- Use **Zod schemas** for validation on both frontend and backend
- Follow **shadcn/ui** patterns for frontend components

### 3. API Development
- Follow RESTful conventions established in existing routes
- Always include proper error handling and status codes
- Use Prisma for all database operations
- Implement JWT authentication for protected routes
- Update Swagger documentation for new endpoints

### 4. Frontend Development
- Use **Next.js App Router** (not Pages Router)
- Leverage **shadcn/ui components** instead of building from scratch
- Implement proper TypeScript interfaces for API responses
- Use **React Hook Form** with **Zod resolvers** for forms
- Follow the established context pattern for state management

### 5. Database Operations
- Always create **Prisma migrations** for schema changes
- Use appropriate database indexes for performance
- Follow the established naming conventions
- Consider data relationships and constraints

### 6. File Organization
- Place frontend components in appropriate directories under `frontend/components/`
- Create backend routes in `backend/src/routes/` with domain separation
- Use the established TypeScript type definitions
- Follow the naming conventions for files and directories

## Common Tasks and Patterns

### Adding a New API Endpoint
1. Create route handler in `backend/src/routes/`
2. Define Zod validation schemas
3. Implement Prisma database operations
4. Add JWT authentication if needed
5. Register route in `backend/src/index.ts`
6. Update frontend API client in `frontend/lib/api.ts`

### Creating a New Frontend Page
1. Create page component in `frontend/app/`
2. Build reusable components in `frontend/components/`
3. Define TypeScript interfaces for data
4. Implement API calls using established patterns
5. Use shadcn/ui components for consistency

### Database Schema Updates
1. Modify `backend/prisma/schema.prisma`
2. Run `npm run db:migrate` to create migration
3. Update TypeScript types if needed
4. Adjust API endpoints for new fields
5. Update frontend interfaces and components

## Security Considerations

- **Never expose sensitive data** in frontend code
- **Always validate inputs** on both frontend and backend
- **Use JWT tokens** for authentication
- **Implement proper CORS** configuration
- **Hash passwords** using bcryptjs
- **Sanitize database inputs** through Prisma

## Testing and Quality Assurance

- Run **TypeScript compilation** to catch type errors
- Use **ESLint** to maintain code quality
- Test API endpoints with **Swagger UI** (available in development)
- Verify database changes with **Prisma Studio**
- Test responsive design across different screen sizes

## Integration Points

### Third-party Services
- **Koombiyo**: Delivery service integration (see `frontend/lib/koombiyo-server.ts`)
- **Vercel Analytics**: Frontend analytics tracking
- **PostgreSQL**: Primary database (connection via Prisma)

### Authentication Flow
- JWT tokens managed through auth context
- Protected routes require valid authentication
- Role-based access control for admin features

## Common Issues and Solutions

### Development Issues
- **Port conflicts**: Frontend (3000), Backend (3001)
- **Database connection**: Ensure PostgreSQL is running and `DATABASE_URL` is set
- **Type errors**: Check Prisma client generation and TypeScript compilation
- **CORS issues**: Verify CORS configuration in backend

### Deployment Considerations
- **Environment variables**: Ensure all required env vars are set
- **Database migrations**: Run migrations in production environment
- **Build optimization**: Next.js build for frontend, TypeScript compilation for backend
- **Asset handling**: Proper configuration for static files and images

## Getting Help

1. **Check ARCHITECTURE.md** for detailed documentation
2. **Review existing code patterns** in similar components/routes
3. **Use TypeScript IntelliSense** for API and type information
4. **Test changes incrementally** using development servers
5. **Verify database changes** with Prisma Studio

## Project Goals and Vision

ReztoBelle Admin Web aims to provide a comprehensive, user-friendly administration interface for jewelry e-commerce operations. Focus on:
- **Performance**: Fast, responsive user experience
- **Reliability**: Robust error handling and data integrity
- **Scalability**: Architecture that can grow with business needs
- **Security**: Protected admin access and secure data handling
- **Maintainability**: Clean, documented, and testable code

---

**Remember**: Always refer to `ARCHITECTURE.md` for complete project context and maintain consistency with established patterns and conventions.