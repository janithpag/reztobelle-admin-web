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
- **Image Management**: Cloudinary for image upload and transformation
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

The database follows a comprehensive e-commerce schema optimized for jewelry business operations:

#### Core Business Entities
- **Category**: Product categories with hierarchical support, SEO optimization
- **Product**: Comprehensive jewelry product management with advanced attributes
- **ProductImage**: Dedicated image management with Cloudinary integration
- **Inventory**: Real-time stock tracking with reservation system
- **StockMovement**: Detailed audit trail for all inventory changes

#### Order Management System
- **Order**: Complete order lifecycle with Koombiyo delivery integration
- **OrderItem**: Line items with cost tracking and product snapshots
- **PaymentTransaction**: Multi-method payment processing with verification
- **DeliveryLog**: Comprehensive delivery tracking and status updates

#### Administration & Analytics
- **User**: Role-based admin system with activity tracking
- **ActivityLog**: System-wide audit trail for all admin actions
- **Expense**: Business expense categorization with recurring expense support

## Recent Major Updates (September 2024)

### Comprehensive Database Redesign
The project underwent a major architectural overhaul with the **September 27, 2024 comprehensive redesign** migration, which introduced:

#### Database Schema Enhancements
- **Enhanced Product Management**: Added jewelry-specific attributes (material, color, size, weight, dimensions, brand)
- **Professional Image System**: Dedicated `ProductImage` model with Cloudinary integration and multiple image variants
- **Advanced Inventory Tracking**: New `Inventory` and `StockMovement` models with reservation system
- **Comprehensive Order Management**: Enhanced order model with Koombiyo delivery integration
- **Payment Transaction System**: Dedicated payment tracking with verification workflows
- **Business Intelligence**: Activity logging, delivery logs, and comprehensive audit trails
- **User Role System**: Granular permission system with multiple admin levels

#### Backend Architecture Improvements
- **Service Layer Implementation**: Added `InventoryService` and `KoombiyoService` for complex business logic
- **Enhanced Route Structure**: Added dedicated routes for categories, payments, and advanced inventory management
- **Koombiyo Integration**: Complete delivery service integration with real-time tracking
- **Advanced Authentication**: Role-based access control with granular permissions
- **Comprehensive API Endpoints**: Over 50 new endpoints for complete business management

#### Key Migration Changes
- **Data Structure Optimization**: Moved from generic fields to specialized business-specific models
- **Relationship Improvements**: Better foreign key relationships and cascade operations
- **Performance Enhancements**: Optimized database indexes and query patterns
- **Type Safety**: Enhanced TypeScript integration across all models and operations
- **SEO Optimization**: Added meta fields, slugs, and search optimization features

### Breaking Changes Notice
This comprehensive redesign introduced breaking changes from previous versions:
- **Product Model**: Removed generic `images` array, replaced with dedicated `ProductImage` model
- **Inventory System**: Complete redesign from simple stock tracking to advanced inventory management
- **Order Processing**: Enhanced order lifecycle with delivery integration and payment verification
- **User Management**: Expanded user model with role-based permissions and activity tracking

### Migration Impact
- **Database Structure**: Complete schema redesign requiring fresh migration
- **API Endpoints**: Significant expansion of available endpoints and functionality  
- **Frontend Integration**: Enhanced data models requiring frontend component updates
- **Business Logic**: Advanced business rules implemented through service layer

## Application Architecture

### Backend Architecture

The backend follows a modular architecture with service layer separation:

```
src/
├── index.ts              # Server setup, plugins, and route registration
├── middleware/
│   └── auth.ts          # JWT authentication with role-based access
├── routes/              # Domain-specific route handlers
│   ├── auth.ts          # User authentication & authorization
│   ├── categories.ts    # Product category management
│   ├── products.ts      # Advanced product operations
│   ├── inventory.ts     # Stock management & tracking
│   ├── orders.ts        # Complete order lifecycle
│   ├── payments.ts      # Payment transaction processing
│   ├── deliveries.ts    # Koombiyo delivery integration
│   ├── koombiyo.ts      # Third-party delivery service API
│   ├── expenses.ts      # Business expense management
│   ├── reports.ts       # Analytics and business intelligence
│   └── uploads.ts       # Cloudinary image management
├── services/            # Business logic layer
│   ├── inventory.service.ts # Stock operations & reservations
│   └── koombiyo.service.ts  # External delivery service integration
└── types/
    └── fastify.d.ts     # Extended Fastify type definitions
```

**Key Features**:
- RESTful API design with comprehensive endpoints
- JWT-based authentication with role-based access control (RBAC)
- Service layer architecture for complex business logic
- Advanced inventory management with stock reservation system
- Integrated Koombiyo delivery service with real-time tracking
- Comprehensive payment transaction processing and verification
- Professional image management with Cloudinary integration
- Advanced business analytics and reporting capabilities
- Audit logging for all administrative actions
- Input validation with Zod schemas across all endpoints
- Automatic API documentation with Swagger/OpenAPI
- Database migrations with Prisma for schema evolution
- Environment-based configuration with security best practices

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
├── image-upload.tsx   # Cloudinary image upload component
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

### Authentication & User Management
- `POST /auth/login` - User authentication with JWT tokens
- `POST /auth/register` - Admin user registration (super admin only)
- `GET /auth/me` - Current user profile with permissions
- `POST /auth/refresh` - JWT token refresh
- `POST /auth/logout` - Secure logout with token invalidation

### Category Management
- `GET /categories` - List active categories with product counts
- `GET /categories/:id` - Get category with products
- `POST /categories` - Create new category (admin required)
- `PUT /categories/:id` - Update category (admin required)
- `DELETE /categories/:id` - Soft delete category (admin required)

### Advanced Product Management
- `GET /products` - List products with advanced filtering & pagination
- `GET /products/search` - Full-text product search
- `GET /products/:id` - Get detailed product with inventory
- `POST /products` - Create product with category assignment
- `PUT /products/:id` - Update product with validation
- `DELETE /products/:id` - Soft delete product
- `POST /products/:id/images` - Add product images
- `DELETE /products/:id/images/:imageId` - Remove product image

### Inventory Management System
- `GET /inventory` - Inventory overview with low stock alerts
- `GET /inventory/:productId` - Detailed stock information
- `PUT /inventory/:id/adjust` - Manual stock adjustments with **Weighted Average Cost** calculation
- `POST /inventory/reserve` - Reserve stock for orders
- `POST /inventory/release` - Release reserved stock
- `GET /inventory/movements` - Stock movement history
- `GET /inventory/:id/cost-history` - Cost price history tracking (WAC)
- `GET /inventory/summary` - Inventory valuation and summary
- `GET /inventory/low-stock` - Low stock items alert

### Comprehensive Order Management
- `GET /orders` - List orders with advanced filtering
- `GET /orders/search` - Search orders by customer/number
- `GET /orders/:id` - Complete order details with items
- `POST /orders` - Create new order with stock reservation
- `PUT /orders/:id` - Update order details
- `PUT /orders/:id/status` - Change order status with validation
- `POST /orders/:id/items` - Add items to existing order
- `DELETE /orders/:id/items/:itemId` - Remove order item
- `GET /orders/:id/timeline` - Order status history

### Payment Transaction System
- `GET /payments` - List payment transactions
- `GET /payments/:transactionId` - Payment transaction details
- `POST /payments` - Record new payment
- `PUT /payments/:id/verify` - Verify payment transaction
- `GET /payments/pending` - List pending verifications
- `POST /payments/:id/refund` - Process refund

### Koombiyo Delivery Integration
- `GET /deliveries` - List delivery records with status
- `POST /deliveries/send` - Send order to Koombiyo
- `GET /deliveries/:orderId/status` - Check delivery status
- `POST /deliveries/:orderId/track` - Update tracking information
- `GET /deliveries/logs` - Delivery operation logs
- `POST /koombiyo/webhook` - Koombiyo status webhook handler
- `GET /koombiyo/cities` - Available delivery cities
- `GET /koombiyo/rates` - Delivery rate calculator

### Business Expense Management
- `GET /expenses` - List expenses with categorization
- `GET /expenses/categories` - Expense category breakdown
- `POST /expenses` - Add new business expense
- `PUT /expenses/:id` - Update expense details
- `DELETE /expenses/:id` - Remove expense record
- `GET /expenses/recurring` - Manage recurring expenses
- `POST /expenses/upload-receipt` - Upload expense receipts

### Advanced Reports & Analytics
- `GET /reports/dashboard` - Executive dashboard metrics
- `GET /reports/sales` - Sales performance analytics
- `GET /reports/inventory` - Stock level and movement reports
- `GET /reports/expenses` - Expense analysis and trends
- `GET /reports/orders` - Order fulfillment metrics
- `GET /reports/delivery` - Delivery performance statistics
- `GET /reports/financial` - Financial performance summary
- `GET /reports/export/:type` - Export reports to CSV/PDF

### Professional Image Management
- `POST /uploads/upload` - Single image upload with optimization
- `POST /uploads/upload-multiple` - Batch image upload
- `DELETE /uploads/delete/:publicId` - Remove image from Cloudinary
- `GET /uploads/transformations/:publicId` - Get optimized image variants
- `POST /uploads/organize` - Organize images in folders
- `GET /uploads/usage` - Cloudinary usage statistics

## UI Design Guidelines

### Overview
The ReztoBelle Admin Web follows a consistent design system based on **shadcn/ui** components, **Tailwind CSS** utility classes, and modern React patterns. These guidelines ensure consistency across all management interfaces based on the implemented **Categories Management** design patterns.

### Color Scheme & Theming

#### Primary Action Colors
- **Create/Success Actions**: `bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white`
- **Edit/Warning Actions**: `bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white`
- **Delete/Danger Actions**: `bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700`

#### Status Badge Colors
- **Active/Success Status**: `bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600`
- **Inactive/Neutral Status**: `bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600`

#### Action Button Colors (Table Actions)
- **View/Info**: `border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20`
- **Edit/Warning**: `border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20`
- **Delete/Danger**: `border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`

### Layout Structure

#### Page Header Pattern
```tsx
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground">
      Page description explaining the functionality
    </p>
  </div>
  <Dialog> {/* Create/Add Button */}
    <DialogTrigger asChild>
      <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </DialogTrigger>
  </Dialog>
</div>
```

#### Search Section Pattern
```tsx
<div className="flex items-center space-x-2">
  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Search items..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10"
    />
  </div>
</div>
```

### Table Design Patterns

#### Table Structure
```tsx
<Card>
  <CardHeader>
    <CardTitle>Items ({filteredItems.length})</CardTitle>
    <CardDescription>
      Description of the table contents
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-[70px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Table rows */}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

#### Action Buttons in Tables
```tsx
<div className="flex items-center justify-center gap-1">
  <Button 
    size="icon"
    variant="outline"
    onClick={() => handleView(item)}
    className="h-8 w-8 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700"
    title="View Item"
  >
    <Eye className="h-4 w-4" />
  </Button>
  <Button 
    size="icon"
    variant="outline"
    onClick={() => handleEdit(item)}
    className="h-8 w-8 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-300 hover:border-yellow-300 dark:hover:border-yellow-700"
    title="Edit Item"
  >
    <Edit2 className="h-4 w-4" />
  </Button>
  <Button 
    size="icon"
    variant="outline"
    onClick={() => handleDelete(item)}
    className="h-8 w-8 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-700"
    title="Delete Item"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

#### Empty State Pattern
```tsx
{filteredItems.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Package className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium text-muted-foreground mb-2">
      {items.length === 0 ? 'No items yet' : 'No items match your search'}
    </h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">
      {items.length === 0
        ? 'Get started by creating your first item.'
        : 'Try adjusting your search terms to find what you\'re looking for.'}
    </p>
    {items.length === 0 && (
      <Button 
        onClick={() => setIsCreateDialogOpen(true)}
        className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create First Item
      </Button>
    )}
  </div>
) : (
  // Table content
)}
```

### Form Design Patterns

#### Dialog Form Structure
```tsx
<Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
  setIsCreateDialogOpen(open);
  if (!open) {
    // Reset form state
  }
}}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Item</DialogTitle>
      <DialogDescription>
        Description of the form action.
      </DialogDescription>
    </DialogHeader>
    <DialogBody>
      <div className="space-y-6">
        {/* Form fields */}
      </div>
    </DialogBody>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
        Cancel
      </Button>
      <Button 
        onClick={handleCreate}
        className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
      >
        Create Item
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Form Field Patterns
```tsx
{/* Required Text Input */}
<div className="space-y-2">
  <Label htmlFor="field-name" className="text-sm font-medium">Name *</Label>
  <Input
    id="field-name"
    value={form.name}
    onChange={(e) => setForm({ ...form, name: e.target.value })}
    placeholder="Enter item name"
    className="w-full"
  />
</div>

{/* Optional Textarea */}
<div className="space-y-2">
  <Label htmlFor="field-description" className="text-sm font-medium">Description</Label>
  <Textarea
    id="field-description"
    value={form.description}
    onChange={(e) => setForm({ ...form, description: e.target.value })}
    placeholder="Enter item description"
    className="w-full min-h-[100px] resize-none"
  />
</div>

{/* Image Upload */}
<div className="space-y-2">
  <Label className="text-sm font-medium">Item Image (Optional)</Label>
  <ImageUpload
    onImagesChange={setImages}
    initialImages={images}
    maxImages={1}
    maxFileSize={5}
    className="mt-2"
  />
</div>
```

### View Dialog Patterns

#### Detailed View Structure
```tsx
<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
  <DialogContent className="sm:max-w-[600px] sm:w-[600px]">
    <DialogHeader>
      <DialogTitle>Item Details</DialogTitle>
      <DialogDescription>
        View complete information about this item.
      </DialogDescription>
    </DialogHeader>
    {selectedItem && (
      <DialogBody>
        <div className="space-y-6">
          {/* Header with image and basic info */}
          <div className="flex items-center gap-4">
            {selectedItem.imageUrl ? (
              <Avatar className="h-16 w-16 rounded-lg">
                <AvatarImage src={selectedItem.imageUrl} alt={selectedItem.name} />
                <AvatarFallback className="rounded-lg text-lg font-semibold bg-primary/10 text-primary">
                  {selectedItem.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-16 w-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                {selectedItem.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{selectedItem.name}</h3>
              <p className="text-sm text-muted-foreground">Additional info</p>
              {/* Status badge */}
            </div>
          </div>

          {/* Details section */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="mt-2 text-sm text-muted-foreground min-h-[60px] p-3 rounded-md border bg-muted/50">
                {selectedItem.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Additional fields in grid */}
            </div>
          </div>
        </div>
      </DialogBody>
    )}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
        Close
      </Button>
      {selectedItem && (
        <Button 
          onClick={() => {
            setIsViewDialogOpen(false);
            setTimeout(() => openEditDialog(selectedItem), 100);
          }}
          className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white"
        >
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Item
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Error Handling & Toast Notifications

#### Toast Usage Patterns
```tsx
import { toast } from 'sonner';

// Success notifications
toast.success('Item created successfully');
toast.success('Item updated successfully');
toast.success('Item deleted successfully');

// Error notifications
toast.error('Item name is required');
toast.error(error.response?.data?.error || 'Failed to create item');
toast.error(error.response?.data?.error || 'Failed to update item');
toast.error(error.response?.data?.error || 'Failed to delete item');

// Loading states (if needed)
toast.loading('Processing...');
```

#### Form Validation Pattern
```tsx
const handleCreate = async () => {
  try {
    // Client-side validation
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    // Prepare data
    const itemData: any = {
      name: form.name,
      description: form.description || undefined
    };

    // Handle optional image
    if (images.length > 0) {
      itemData.imageUrl = images[0].secure_url;
    }

    // Remove undefined values
    Object.keys(itemData).forEach(key => {
      if (itemData[key] === undefined || itemData[key] === '') {
        delete itemData[key];
      }
    });

    // API call
    await itemsAPI.createItem(itemData);
    
    // Success handling
    toast.success('Item created successfully');
    setIsCreateDialogOpen(false);
    resetForm();
    loadItems();
    
  } catch (error: any) {
    console.error('Error creating item:', error);
    toast.error(error.response?.data?.error || 'Failed to create item');
  }
};
```

### Delete Confirmation Pattern

```tsx
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the item
        &ldquo;{selectedItem?.name}&rdquo; and may affect associated data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDelete} 
        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Loading States Pattern

```tsx
{loading ? (
  <div className="flex items-center justify-center py-8">
    <div className="text-muted-foreground">Loading items...</div>
  </div>
) : (
  // Content
)}
```

### Avatar/Image Display Pattern

```tsx
<Avatar className="h-10 w-10">
  <AvatarImage src={item.imageUrl} alt={item.name} />
  <AvatarFallback>
    {item.name.slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

### Status Badge Pattern

```tsx
<Badge 
  variant={item.isActive ? 'default' : 'secondary'}
  className={cn(
    "text-xs",
    item.isActive 
      ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600" 
      : "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
  )}
>
  {item.isActive ? 'Active' : 'Inactive'}
</Badge>
```

### Date Display Pattern

```tsx
{/* Short date format */}
<div className="text-sm text-muted-foreground">
  {new Date(item.createdAt).toLocaleDateString()}
</div>

{/* Long date format for detailed views */}
<p className="mt-2 text-sm text-muted-foreground">
  {new Date(item.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
</p>
```

### Key Implementation Guidelines

1. **Consistent Color Usage**: Always use the defined color schemes for actions and status indicators
2. **Responsive Design**: Use `flex-col sm:flex-row` patterns for mobile-first responsive layouts
3. **Icon Consistency**: Use Lucide React icons with consistent sizing (`h-4 w-4` for buttons, `h-12 w-12` for empty states)
4. **Loading States**: Always provide loading indicators for asynchronous operations
5. **Error Boundaries**: Implement proper try-catch blocks with user-friendly error messages
6. **Accessibility**: Use proper ARIA labels, titles, and semantic HTML elements
7. **Form Validation**: Implement both client-side validation and server error handling
8. **State Management**: Clean up form states when dialogs close
9. **User Feedback**: Provide immediate feedback through toast notifications
10. **Progressive Enhancement**: Ensure core functionality works without JavaScript

### Component Imports Standard
```tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/image-upload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
```

## Image Management System

### Overview
The application uses **Cloudinary** for professional image management, providing automatic optimization, transformation, and CDN delivery. This system is specifically optimized for jewelry e-commerce with multiple image sizes and quality variants.

### Cloudinary Integration Features

#### Backend Implementation
- **Secure Upload API**: JWT-protected endpoints for image operations
- **File Validation**: Type and size validation (max 10MB per image)
- **Automatic Optimization**: Quality and format optimization for web delivery
- **Multiple Transformations**: Auto-generation of thumbnail, medium, large, and zoom versions
- **Cloud Storage**: Images stored in `reztobelle/products` folder on Cloudinary

#### Frontend Components
```
components/
├── image-upload.tsx      # Drag-and-drop upload component with preview
└── products-management.tsx # Integrated with ImageUpload component
```

**ImageUpload Component Features:**
- **Drag & Drop Interface**: Modern upload experience with visual feedback
- **Progress Tracking**: Real-time upload progress indicators
- **Image Preview**: Immediate preview with metadata display
- **Error Handling**: Comprehensive validation and error messaging
- **Batch Operations**: Support for multiple image uploads
- **Image Management**: Delete functionality with Cloudinary cleanup

#### Image Transformations
Automatically generated for each uploaded image:

| Transformation | Size | Use Case |
|----------------|------|----------|
| Thumbnail | 150x150px | Product lists, search results |
| Medium | 400x400px | Product cards, catalog view |
| Large | 1200x1200px | Product detail pages |
| Zoom | 2000x2000px | High-resolution viewing |

#### Database Schema Integration
```prisma
model Product {
  id          String      @id @default(cuid())
  name        String
  // ... other fields
  images      String[]    @default([])  // Array of Cloudinary URLs
  // ... other fields
}
```

### Environment Configuration

#### Backend Environment Variables (.env)
```env
# Cloudinary Configuration (Required)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

#### Frontend Environment Variables (.env.local)
```env
# Cloudinary Configuration (Optional - for frontend features)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
```

### Setup Instructions

1. **Create Cloudinary Account**
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Get credentials from Dashboard → Settings → Account

2. **Configure Environment Variables**
   - Copy credentials to backend `.env` file
   - Optionally add cloud name to frontend `.env.local`

3. **API Usage**
   ```typescript
   // Upload single image
   const result = await uploadAPI.uploadImage(file, (progress) => {
     console.log(`Upload progress: ${progress}%`);
   });

   // Upload multiple images
   const results = await uploadAPI.uploadMultipleImages(files);

   // Delete image
   await uploadAPI.deleteImage(publicId);
   ```

### Security & Performance

#### Security Features
- **Authentication Required**: All upload endpoints require JWT authentication
- **File Type Validation**: Only image files (JPEG, PNG, WebP) allowed
- **Size Limits**: Maximum 10MB per image file
- **Rate Limiting**: Prevents abuse of upload endpoints

#### Performance Optimizations
- **CDN Delivery**: Global content delivery through Cloudinary's CDN
- **Automatic Format Selection**: Cloudinary chooses optimal format for each browser
- **Quality Optimization**: Automatic quality adjustment for best size/quality ratio
- **Lazy Loading**: Next.js Image component with lazy loading
- **Multiple Formats**: WebP for modern browsers, JPEG fallback

### Image Management Workflow

1. **Product Creation**:
   - Admin selects product images via drag-and-drop interface
   - Images uploaded to Cloudinary with automatic transformations
   - Cloudinary URLs stored in database `images` array

2. **Image Display**:
   - Frontend retrieves Cloudinary URLs from database
   - Next.js Image component renders with appropriate transformation
   - CDN delivers optimized images based on device and connection

3. **Image Updates**:
   - Admin can add/remove images from existing products
   - Removed images are deleted from Cloudinary to prevent storage bloat
   - Database updated with new image URL array

### Error Handling & Recovery

- **Upload Failures**: Automatic retry with user feedback
- **Network Issues**: Graceful degradation with offline indicators
- **Invalid Files**: Clear error messages with accepted format guidance
- **Storage Limits**: Cloudinary quota monitoring and alerts

### Dependencies
```json
// Backend
"cloudinary": "^1.x.x",
"@fastify/multipart": "^8.x.x",

// Frontend  
"cloudinary-react": "^1.x.x",
"next-cloudinary": "^5.x.x"
```

## Comprehensive Database Schema

### Core Models & Relationships

#### Category Model
```prisma
model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique @db.VarChar(100)
  description String?
  slug        String    @unique @db.VarChar(100)
  imageUrl    String?   @db.VarChar(500)
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  products    Product[]
}
```

#### Product Model (Enhanced)
```prisma
model Product {
  id               Int             @id @default(autoincrement())
  name             String          @db.VarChar(200)
  description      String?
  shortDescription String?         @db.VarChar(500)
  sku              String          @unique @db.VarChar(50)
  slug             String          @unique @db.VarChar(200)
  
  // Pricing & Cost Management
  price            Decimal         @db.Decimal(10, 2)
  costPrice        Decimal         @db.Decimal(10, 2)
  
  // Product Attributes (Jewelry Specific)
  material         String?         @db.VarChar(100)
  color            String?         @db.VarChar(50)
  size             String?         @db.VarChar(50)
  weight           Decimal?        @db.Decimal(8, 2)
  dimensions       String?         @db.VarChar(100)
  brand            String?         @db.VarChar(100)
  
  // SEO & Marketing
  metaTitle        String?         @db.VarChar(200)
  metaDescription  String?         @db.VarChar(300)
  isFeatured       Boolean         @default(false)
  isActive         Boolean         @default(true)
  
  // Timestamps
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  
  // Foreign Keys
  categoryId       Int
  
  // Relations
  category         Category        @relation(fields: [categoryId], references: [id])
  images           ProductImage[]
  inventory        Inventory?
  orderItems       OrderItem[]
  stockMovements   StockMovement[]
}
```

#### ProductImage Model (Cloudinary Integration)
```prisma
model ProductImage {
  id           Int      @id @default(autoincrement())
  productId    Int
  cloudinaryId String   @db.VarChar(200)
  imageUrl     String   @db.VarChar(500)
  altText      String?  @db.VarChar(200)
  isPrimary    Boolean  @default(false)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  
  // Relations
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

#### Inventory Management System with Weighted Average Costing

The inventory system implements **Weighted Average Cost (WAC)** for accurate inventory valuation and profit calculation.

```prisma
model Inventory {
  id                Int       @id @default(autoincrement())
  productId         Int       @unique
  quantityAvailable Int       @default(0)
  quantityReserved  Int       @default(0)
  reorderLevel      Int       @default(10)
  maxStockLevel     Int       @default(1000)
  lastRestockedAt   DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model StockMovement {
  id            Int                @id @default(autoincrement())
  productId     Int
  movementType  StockMovementType  // IN, OUT, ADJUSTMENT
  quantity      Int
  referenceType StockReferenceType // PURCHASE, SALE, RETURN, DAMAGE, ADJUSTMENT
  referenceId   Int?
  notes         String?
  unitCost      Decimal?           @db.Decimal(10, 2) // Cost at time of movement - drives WAC
  createdBy     Int
  createdAt     DateTime           @default(now())
  
  // Relations
  product       Product            @relation(fields: [productId], references: [id])
  createdByUser User               @relation(fields: [createdBy], references: [id])
}
```

##### Weighted Average Cost Implementation

When new stock arrives (IN movement) with a `unitCost`:
1. **Current Value** = Current Quantity × Current Cost Price
2. **New Value** = New Quantity × New Unit Cost  
3. **Total Value** = Current Value + New Value
4. **New Average Cost** = Total Value ÷ Total Quantity
5. **Product.costPrice** is automatically updated to the new average

**Example:**
- Current: 10 units @ LKR 5,000 = LKR 50,000
- Purchase: 5 units @ LKR 6,000 = LKR 30,000
- New Average: LKR 80,000 ÷ 15 units = **LKR 5,333.33** ✅

**Benefits:**
- ✅ Automatic cost price updates with each purchase
- ✅ Accurate inventory valuation for financial reporting
- ✅ Precise profit margin calculations
- ✅ Historical cost tracking in StockMovement records
- ✅ Simpler than FIFO/LIFO (no batch tracking required)

```

#### Advanced Order Management
```prisma
model Order {
  id                      Int                     @id @default(autoincrement())
  orderNumber             String                  @unique @db.VarChar(50)
  
  // Customer Information
  customerName            String                  @db.VarChar(200)
  customerEmail           String?                 @db.VarChar(255)
  customerPhone           String?                 @db.VarChar(20)
  
  // Order Status & Processing
  status                  OrderStatus             @default(PENDING)
  paymentStatus           PaymentStatus           @default(PENDING)
  paymentMethod           PaymentMethod
  
  // Financial Details
  subtotal                Decimal                 @db.Decimal(12, 2)
  discountAmount          Decimal                 @default(0.00) @db.Decimal(10, 2)
  shippingAmount          Decimal                 @default(0.00) @db.Decimal(10, 2)
  totalAmount             Decimal                 @db.Decimal(12, 2)
  codAmount               Decimal?                @db.Decimal(12, 2)
  
  // Delivery Information
  address                 String                  @db.VarChar(500)
  cityId                  Int
  cityName                String                  @db.VarChar(100)
  districtId              Int
  districtName            String                  @db.VarChar(100)
  packageDescription      String?                 @db.VarChar(500)
  
  // Koombiyo Integration
  koombiyoOrderId         String?                 @db.VarChar(100)
  waybillId               String?                 @unique @db.VarChar(50)
  deliveryStatus          KoombiyoDeliveryStatus? @default(NOT_SENT)
  koombiyoLastStatus      String?                 @db.VarChar(100)
  koombiyoStatusUpdatedAt DateTime?
  
  // Operational Notes
  notes                   String?
  internalNotes           String?
  specialNotes            String?
  
  // Timestamps
  orderedAt               DateTime                @default(now())
  sentToDeliveryAt        DateTime?
  shippedAt               DateTime?
  deliveredAt             DateTime?
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt
  
  // Relations
  orderItems              OrderItem[]
  paymentTransactions     PaymentTransaction[]
  deliveryLogs            DeliveryLog[]
}

model OrderItem {
  id          Int      @id @default(autoincrement())
  orderId     Int
  productId   Int
  productName String   @db.VarChar(200) // Snapshot for order history
  sku         String   @db.VarChar(50)  // Snapshot for order history
  quantity    Int
  unitPrice   Decimal  @db.Decimal(10, 2)
  unitCost    Decimal  @db.Decimal(10, 2) // For profit calculation
  totalPrice  Decimal  @db.Decimal(12, 2)
  createdAt   DateTime @default(now())
  
  // Relations
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])
}
```

#### Payment Transaction System
```prisma
model PaymentTransaction {
  id             Int               @id @default(autoincrement())
  orderId        Int
  transactionId  String            @unique @db.VarChar(100)
  paymentMethod  PaymentMethod
  amount         Decimal           @db.Decimal(12, 2)
  status         TransactionStatus
  bankDetails    String?           @db.VarChar(500)
  depositSlipUrl String?           @db.VarChar(500)
  verifiedBy     Int?
  verifiedAt     DateTime?
  notes          String?
  processedAt    DateTime?
  createdAt      DateTime          @default(now())
  
  // Relations
  order          Order             @relation(fields: [orderId], references: [id])
  verifiedByUser User?             @relation(fields: [verifiedBy], references: [id])
}
```

#### User Management & Activity Tracking
```prisma
model User {
  id                   Int                  @id @default(autoincrement())
  email                String               @unique @db.VarChar(255)
  passwordHash         String               @db.VarChar(255)
  firstName            String               @db.VarChar(100)
  lastName             String               @db.VarChar(100)
  role                 UserRole             // SUPER_ADMIN, ADMIN, MANAGER, STAFF
  isActive             Boolean              @default(true)
  emailVerifiedAt      DateTime?
  lastLoginAt          DateTime?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  
  // Relations
  activityLogs         ActivityLog[]
  deliveryLogs         DeliveryLog[]
  expenses             Expense[]
  verifiedTransactions PaymentTransaction[]
  stockMovements       StockMovement[]
}

model ActivityLog {
  id          Int      @id @default(autoincrement())
  userId      Int
  action      String   @db.VarChar(100)
  entityType  String   @db.VarChar(50)
  entityId    Int
  description String?
  ipAddress   String?  @db.VarChar(45)
  userAgent   String?
  createdAt   DateTime @default(now())
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
}
```

#### Delivery Management & Logging
```prisma
model DeliveryLog {
  id            Int            @id @default(autoincrement())
  orderId       Int
  action        DeliveryAction // SENT_TO_KOOMBIYO, STATUS_UPDATE, etc.
  status        String?        @db.VarChar(100)
  message       String?
  response      Json?          // Store API responses
  createdBy     Int?
  createdAt     DateTime       @default(now())
  
  // Relations
  order         Order          @relation(fields: [orderId], references: [id])
  createdByUser User?          @relation(fields: [createdBy], references: [id])
}
```

#### Business Expense Management
```prisma
model Expense {
  id                 Int                 @id @default(autoincrement())
  description        String              @db.VarChar(500)
  amount             Decimal             @db.Decimal(12, 2)
  category           ExpenseCategory     // INVENTORY, SHIPPING, MARKETING, etc.
  subcategory        String?             @db.VarChar(100)
  expenseDate        DateTime            @db.Date
  supplierName       String?             @db.VarChar(200)
  referenceNumber    String?             @db.VarChar(100)
  receiptUrl         String?             @db.VarChar(500)
  isRecurring        Boolean             @default(false)
  recurringFrequency RecurringFrequency? // WEEKLY, MONTHLY, QUARTERLY, YEARLY
  createdBy          Int
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  
  // Relations
  createdByUser      User                @relation(fields: [createdBy], references: [id])
}
```

### Database Enums

```prisma
// Stock Management
enum StockMovementType { IN, OUT, ADJUSTMENT }
enum StockReferenceType { PURCHASE, SALE, RETURN, DAMAGE, ADJUSTMENT }

// Order Management
enum OrderStatus {
  PENDING, CONFIRMED, PROCESSING, READY_FOR_DELIVERY,
  SENT_TO_DELIVERY, SHIPPED, DELIVERED, CANCELLED, REFUNDED
}

enum PaymentStatus { PENDING, PAID, PARTIALLY_PAID, REFUNDED, FAILED }
enum PaymentMethod { BANK_TRANSFER, CASH_ON_DELIVERY }

// Koombiyo Integration
enum KoombiyoDeliveryStatus {
  NOT_SENT, SENT_TO_KOOMBIYO, PICKED_UP, IN_TRANSIT,
  OUT_FOR_DELIVERY, DELIVERED, FAILED_DELIVERY, RETURNED, CANCELLED
}

enum DeliveryAction {
  SENT_TO_KOOMBIYO, STATUS_UPDATE, PICKUP_REQUEST,
  TRACKING_UPDATE, RETURN_RECEIVED, ERROR_LOG
}

// Financial Management
enum TransactionStatus { PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED }
enum ExpenseCategory {
  INVENTORY, SHIPPING, MARKETING, OPERATIONS,
  OFFICE, UTILITIES, FEES, OTHER
}
enum RecurringFrequency { WEEKLY, MONTHLY, QUARTERLY, YEARLY }

// User Management
enum UserRole { SUPER_ADMIN, ADMIN, MANAGER, STAFF }
```

### Key Database Features

1. **Comprehensive Product Management**: Full jewelry-specific attributes with SEO optimization
2. **Advanced Inventory System**: Real-time stock tracking with reservation capabilities
3. **Integrated Payment Processing**: Multi-method payment with verification workflows
4. **Koombiyo Delivery Integration**: Complete delivery lifecycle management
5. **Business Intelligence**: Comprehensive logging and audit trails
6. **Role-Based Access Control**: Granular permission system
7. **Financial Tracking**: Detailed expense management with recurring expense support
8. **Professional Image Management**: Cloudinary integration with multiple image variants

## Development Workflow

### Environment Setup
1. **Prerequisites**: Node.js >=18.0.0, npm >=9.0.0, PostgreSQL >=13
2. **Installation**: `npm run install:all` (installs all dependencies for both frontend and backend)
3. **Database Setup**: 
   - Set up PostgreSQL instance and configure `DATABASE_URL` in backend `.env`
   - Run `npm run db:migrate` to apply the comprehensive database schema
4. **Environment Variables**: 
   - Create `.env` file in backend directory with database and Cloudinary credentials
   - Create `.env.local` file in frontend directory for client-side configurations
5. **Third-party Services**:
   - Set up Cloudinary account for professional image management
   - Configure Koombiyo delivery service API credentials (if using delivery integration)
6. **Initial Data**: Run database seeding commands to populate categories and initial admin user

### Development Commands
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend (Next.js dev server)
- `npm run dev:backend` - Start only backend (Fastify with tsx watch)
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio for database GUI

### Database Management
- **Schema Migrations**: Use `prisma migrate dev` for development schema changes
- **Production Migrations**: Use `prisma migrate deploy` for production deployments  
- **Database GUI**: Run `npm run db:studio` to open Prisma Studio for visual database management
- **Seeding**: Run custom seed scripts to populate initial categories, admin users, and test data
- **Schema Updates**: 
  1. Modify `backend/prisma/schema.prisma` 
  2. Generate migration with `npx prisma migrate dev --name descriptive_name`
  3. Update TypeScript types if needed
  4. Adjust API endpoints and frontend interfaces accordingly
- **Backup & Recovery**: Regular database backups recommended for production environments
- **Performance Monitoring**: Use Prisma's built-in query analysis and database performance insights

## AI Assistant Guidelines

### Critical Development Restrictions

**⚠️ IMPORTANT: Server Management Restrictions**

When making code changes, modifications, or assisting with development tasks:

1. **DO NOT start development servers**: Never execute `npm run dev`, `npm run dev:frontend`, or `npm run dev:backend` commands
2. **DO NOT run server-starting commands**: Avoid any commands that would start the frontend or backend servers
3. **Focus on code modifications only**: Limit assistance to file editing, code generation, and architectural guidance
4. **Let developers manage servers**: Server startup and management should be handled manually by the developer

**Rationale**: 
- Prevents conflicts with existing running servers
- Avoids port conflicts and resource contention
- Maintains developer control over the development environment
- Reduces system resource usage during code assistance

### Recommended AI Assistant Workflow

1. **Code Analysis**: Read and understand existing code structure
2. **File Modifications**: Edit files using appropriate tools (`replace_string_in_file`, `create_file`, etc.)
3. **Architectural Guidance**: Provide recommendations based on project structure
4. **Database Operations**: Assist with schema modifications and migrations (without running them)
5. **Documentation Updates**: Help maintain and update project documentation

### Exceptions

The following commands are acceptable when specifically requested by the developer:
- Database operations: `npm run db:migrate`, `npm run db:studio`
- Package management: `npm install`, `npm run install:all`
- Build operations: `npm run build` (when explicitly requested)
- Testing commands: Test runners and validation tools

## UI Components & Loading States

### Common Loading Components

The application implements a comprehensive loading system using shadcn/ui patterns for consistent user experience across all data loading scenarios.

#### Spinner Component (`/components/ui/spinner.tsx`)
A reusable spinner component with multiple size variants:
```tsx
<Spinner size="sm" />      // Small spinner (3x3)
<Spinner size="default" /> // Default spinner (4x4)
<Spinner size="lg" />      // Large spinner (6x6)
<Spinner size="xl" />      // Extra large spinner (8x8)
```

#### Loading Component (`/components/ui/loading.tsx`)
A flexible loading component that handles different loading scenarios:

**Variants:**
- `default` - Inline loading with text
- `overlay` - Semi-transparent overlay over content
- `inline` - Simple inline loading indicator
- `fullscreen` - Full screen loading overlay

**Usage Examples:**
```tsx
// Overlay loading during data fetch
<Loading variant="overlay" text="Loading dashboard data..." isLoading={isLoading} />

// Inline loading with custom spinner size
<Loading variant="inline" text="Processing..." spinnerSize="lg" />

// Wrapper pattern - shows children when not loading
<Loading isLoading={isLoading} text="Loading products...">
  <ProductsList products={products} />
</Loading>
```

#### Implementation Patterns

**Initial Data Loading:**
```tsx
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, []);

return (
  <div>
    <Loading variant="overlay" text="Loading..." isLoading={isLoading} />
    {!isLoading && <DataComponent data={data} />}
  </div>
);
```

**Components with Loading States:**
- **Dashboard Overview** - Shows loading overlay while fetching analytics data
- **Products Management** - Displays loading state during product list fetch
- **Delivery Integration** - Loading overlay during form processing
- **Settings Management** - Individual loading states for save operations

### Benefits
- **Consistent UX** - Unified loading experience across all components
- **Flexible** - Multiple variants for different use cases
- **Accessible** - Built with accessibility in mind
- **Type-Safe** - Full TypeScript support with proper prop typing
- **Performance** - Efficient rendering with conditional display logic

## UI Design Guidelines & Standards

### Core Design Principles

When implementing new UI components or modifying existing ones, developers and AI agents must adhere to the following design standards to ensure consistency, accessibility, and optimal user experience across both light and dark themes.

#### 1. Theme Compatibility Requirements

**Mandatory Theme Support:**
- All components MUST work seamlessly in both light and dark themes
- Use CSS custom properties (theme variables) from `globals.css` instead of hardcoded colors
- Test components in both themes before implementation
- Ensure proper contrast ratios for accessibility (WCAG 2.1 AA compliance)

**Theme Variable Usage:**
```css
/* Correct - Use theme variables */
background: hsl(var(--background))
color: hsl(var(--foreground))
border: hsl(var(--border))

/* Incorrect - Avoid hardcoded colors */
background: #ffffff
color: #000000
border: #e5e5e5
```

**Common Theme Variables:**
- `--background` / `--foreground` - Primary background and text
- `--muted` / `--muted-foreground` - Secondary/muted content
- `--card` / `--card-foreground` - Card backgrounds and text
- `--border` - Border colors that adapt to theme
- `--primary` / `--primary-foreground` - Brand colors
- `--sidebar` / `--sidebar-foreground` - Navigation specific colors

#### 2. Responsive Design Requirements

**Mobile-First Approach:**
- All components MUST be responsive and mobile-friendly
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- Test on multiple screen sizes (320px, 768px, 1024px, 1440px+)
- Ensure touch targets are minimum 44px for accessibility

**Responsive Patterns:**
```tsx
// Correct - Progressive enhancement
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">

// Text sizing that scales
<h1 className="text-2xl sm:text-3xl font-bold">

// Spacing that adapts
<div className="space-y-4 sm:space-y-6">

// Buttons that stack on mobile
<Button className="w-full sm:w-auto">
```

#### 3. Component Architecture Standards

**Consistent Component Structure:**
```tsx
// Component template structure
export interface ComponentProps {
  // Props with clear types
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  // Other specific props
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ variant = 'default', size = 'default', className, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
```

**Loading State Implementation:**
- Use the common `Loading` component for all data loading scenarios
- Provide meaningful loading text
- Ensure loading states have proper container heights
- Show loading overlays for async operations

#### 4. Accessibility Requirements

**Mandatory Accessibility Features:**
- Proper semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Screen reader compatibility
- Focus management and visual indicators
- Color contrast compliance

**Accessibility Checklist:**
```tsx
// Semantic HTML
<main>, <section>, <article>, <nav>, <header>, <footer>

// Proper form labels
<Label htmlFor="input-id">Label Text</Label>
<Input id="input-id" />

// ARIA attributes when needed
<button aria-label="Close dialog" aria-expanded="false">

// Focus management
<Dialog onOpenChange={setOpen} />
```

#### 5. Performance Guidelines

**Optimization Requirements:**
- Use React.memo() for expensive components
- Implement proper useMemo() and useCallback() where beneficial
- Lazy load heavy components with React.lazy()
- Optimize images and assets
- Minimize bundle size impact

#### 6. Typography & Spacing Standards

**Typography Scale:**
```tsx
// Heading hierarchy
<h1 className="text-2xl sm:text-3xl font-bold">     // Main page titles
<h2 className="text-xl sm:text-2xl font-semibold">  // Section titles  
<h3 className="text-lg font-medium">                // Subsection titles
<p className="text-sm sm:text-base">                // Body text
<span className="text-xs text-muted-foreground">    // Secondary text
```

**Spacing Consistency:**
```tsx
// Container spacing
<div className="space-y-4 sm:space-y-6">           // Vertical spacing
<div className="grid gap-3 sm:gap-4 lg:gap-6">     // Grid gaps
<div className="p-4 sm:p-6">                       // Padding
<div className="mx-4 sm:mx-6">                     // Horizontal margins
```

#### 7. Component Testing Standards

**Required Testing:**
- Visual testing in both light and dark themes
- Responsive testing across different screen sizes
- Keyboard navigation testing
- Screen reader compatibility testing
- Loading state behavior verification

#### 8. Implementation Checklist

Before submitting any UI component implementation:

- [ ] **Theme Compatibility**: Tested in both light and dark modes
- [ ] **Responsive Design**: Works on mobile, tablet, and desktop
- [ ] **Accessibility**: Meets WCAG 2.1 AA standards
- [ ] **Performance**: No unnecessary re-renders or heavy operations
- [ ] **Type Safety**: Full TypeScript support with proper interfaces
- [ ] **Consistent Styling**: Follows established design patterns
- [ ] **Loading States**: Implements proper loading UX where needed
- [ ] **Error Handling**: Graceful error states and user feedback

### Design Violations to Avoid

**Common Mistakes:**
- Hardcoded colors that break in dark mode
- Non-responsive layouts that fail on mobile
- Missing loading states for async operations
- Inconsistent spacing and typography
- Poor accessibility implementation
- Heavy components without optimization

By following these guidelines, all UI components will maintain the high quality and consistency expected in the ReztoBelle admin application.

## Feature Implementation Requirements

### Mandatory Implementation Standards

When implementing any new feature in the ReztoBelle Admin Web application, the following requirements are **MANDATORY** and must be strictly adhered to ensure consistent user experience, reliability, and maintainability.

#### 1. User Feedback & Status Communication

**Toast Notifications (REQUIRED):**
- **Success States**: Display success toasts for all successful operations
- **Error States**: Show detailed error messages for failed operations
- **Warning States**: Implement warning toasts for cautionary actions
- **Information States**: Use info toasts for important status updates

**Implementation Standards:**
```tsx
// Success toast example
toast.success("Product created successfully!");

// Error toast with detailed message
toast.error("Failed to save product: Invalid price format");

// Warning toast for destructive actions
toast.warning("This action cannot be undone. Are you sure?");

// Info toast for status updates
toast.info("Order status updated to 'Processing'");
```

**Toast Requirements:**
- All API operations MUST trigger appropriate toast notifications
- Toast messages must be descriptive and user-friendly
- Use consistent toast positioning and duration
- Implement toast cleanup for component unmounting

#### 2. Comprehensive Error Handling

**Backend Error Handling (MANDATORY):**
```typescript
// Route handler with comprehensive error handling
app.post('/api/products', async (request, reply) => {
  try {
    // Business logic here
    const result = await productService.create(data);
    return reply.code(201).send({ success: true, data: result });
  } catch (error) {
    // Log error for debugging
    request.log.error(error);
    
    // Return appropriate error response
    if (error instanceof ValidationError) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: error.details
      });
    }
    
    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        success: false,
        error: 'Resource not found'
      });
    }
    
    // Generic server error
    return reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

**Frontend Error Handling (MANDATORY):**
```tsx
// Component with proper error handling
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async (data: FormData) => {
  setLoading(true);
  setError(null);
  
  try {
    await api.createProduct(data);
    toast.success("Product created successfully!");
    // Handle success (redirect, refresh, etc.)
  } catch (err) {
    const errorMessage = err.response?.data?.error || 'An unexpected error occurred';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

// Error display in UI
{error && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

#### 3. Responsive Design & Standard Colors

**Responsive Requirements (MANDATORY):**
- All interfaces MUST be fully responsive across mobile, tablet, and desktop
- Use mobile-first design approach with progressive enhancement
- Test on minimum screen width of 320px
- Implement proper touch targets (minimum 44px) for mobile devices

**Standard Color Usage (MANDATORY):**
```tsx
// Use standard semantic colors for consistency
const statusColors = {
  success: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
  error: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
  warning: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  info: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  pending: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
};

// Status badges with consistent colors
<Badge className={statusColors.success}>Active</Badge>
<Badge className={statusColors.error}>Inactive</Badge>
<Badge className={statusColors.warning}>Low Stock</Badge>
```

#### 4. Form Design Standards

**Form Layout Requirements (MANDATORY):**
- All forms MUST have uniform field alignment and consistent spacing
- Use responsive grid layouts that adapt to screen size
- Implement proper field grouping with consistent spacing
- Maintain visual hierarchy with appropriate field sizing

**Form Implementation Standards:**
```tsx
// Uniform form layout
<form className="space-y-6">
  {/* Form section with consistent spacing */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
    <div className="space-y-2">
      <Label htmlFor="name" className="text-sm font-medium">
        Product Name *
      </Label>
      <Input
        id="name"
        placeholder="Enter product name"
        className="w-full"
        {...register('name')}
      />
      {errors.name && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errors.name.message}
        </p>
      )}
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="price" className="text-sm font-medium">
        Price (LKR) *
      </Label>
      <Input
        id="price"
        type="number"
        placeholder="0.00"
        className="w-full"
        {...register('price')}
      />
    </div>
  </div>
  
  {/* Full-width fields */}
  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea
      id="description"
      placeholder="Enter product description"
      className="w-full min-h-[100px]"
      {...register('description')}
    />
  </div>
  
  {/* Form actions */}
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-4">
    <Button type="button" variant="outline" className="w-full sm:w-auto">
      Cancel
    </Button>
    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Product
    </Button>
  </div>
</form>
```

#### 5. Currency Standards

**Sri Lankan Rupees (MANDATORY):**
- ALL monetary values MUST be displayed in Sri Lankan Rupees (LKR)
- Use consistent currency formatting throughout the application
- Implement proper number formatting with thousand separators

**Currency Implementation:**
```tsx
// Utility function for LKR formatting
export const formatLKR = (amount: number): string => {
  return new Intl.NumberFormat('si-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Alternative simple formatting
export const formatSimpleLKR = (amount: number): string => {
  return `LKR ${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
};

// Usage in components
<span className="font-semibold text-lg">
  {formatLKR(product.price)}
</span>
```

#### 6. Loading States & User Feedback

**Loading Indicators (MANDATORY):**
- Show loading states for ALL data fetching operations
- Implement action loaders for ALL button interactions
- Use skeleton loaders for better perceived performance
- Display progress indicators for long-running operations

**Loading Implementation Standards:**
```tsx
// Data loading with skeleton
{isLoading ? (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    ))}
  </div>
) : (
  <ProductList products={products} />
)}

// Button with loading state
<Button
  onClick={handleAction}
  disabled={isSubmitting}
  className="w-full sm:w-auto"
>
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>

// Page-level loading
{isPageLoading && (
  <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
)}
```

#### 7. Data Grid Standards

**Grid Design Requirements (MANDATORY):**
- Implement uniform grid designs across all data views
- Show action buttons directly in the grid (NO dropdown "..." menus)
- Use consistent spacing and alignment for all grid elements
- Maintain proper responsive behavior for all grid layouts

**Grid Implementation Standards:**
```tsx
// Standard data grid with inline actions
<div className="rounded-lg border bg-card">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Product Name</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Stock</TableHead>
        <TableHead className="w-[200px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {products.map((product) => (
        <TableRow key={product.id}>
          <TableCell className="font-medium">{product.name}</TableCell>
          <TableCell>{product.category?.name}</TableCell>
          <TableCell>{formatLKR(product.price)}</TableCell>
          <TableCell>
            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
              {product.stock}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button size="sm" variant="destructive">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

#### 8. Theme Compatibility

**Light & Dark Theme Support (MANDATORY):**
- ALL components and views MUST support both light and dark themes
- Use CSS custom properties from the theme system
- Test all features in both theme modes before implementation
- Ensure proper contrast ratios for accessibility

**Theme Implementation:**
```tsx
// Use theme-aware styling
<div className="bg-background text-foreground border-border">
  <Card className="bg-card text-card-foreground border-border">
    <CardHeader>
      <CardTitle className="text-foreground">Title</CardTitle>
      <CardDescription className="text-muted-foreground">
        Description
      </CardDescription>
    </CardHeader>
  </Card>
</div>

// Status colors that work in both themes
<Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
  Success
</Badge>
```

#### 9. Image Display Standards

**Image Placeholder Requirements (MANDATORY):**
- When displaying images, ALWAYS provide fallback for missing images
- Use name initials as placeholders when actual images are not available
- Implement consistent styling for both actual images and initial placeholders
- Ensure placeholders work in both light and dark themes

**Image Implementation Standards:**
```tsx
// Utility function for generating initials
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2); // Limit to 2 characters for consistency
};

// Image component with initials fallback
interface ImageWithFallbackProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  name, 
  size = 'md', 
  className 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg'
  };

  const initials = getInitials(name);

  if (!src || imageError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-semibold',
          'bg-primary/10 text-primary border border-primary/20',
          'dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30',
          sizeClasses[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-full', sizeClasses[size], className)}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
};

// Usage examples
// Product image with fallback
<ImageWithFallback
  src={product.images?.[0]?.url}
  name={product.name}
  size="lg"
  className="border-2 border-border"
/>

// User avatar with initials
<ImageWithFallback
  src={user.avatar}
  name={user.name}
  size="md"
  className="ring-2 ring-primary/20"
/>

// Category icon with fallback
<ImageWithFallback
  src={category.icon}
  name={category.name}
  size="sm"
/>
```

**Advanced Implementation for Product Galleries:**
```tsx
// Product gallery with multiple images and initials fallback
const ProductImageGallery: React.FC<{ product: Product }> = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const hasImages = product.images && product.images.length > 0;

  if (!hasImages) {
    return (
      <div className="space-y-4">
        {/* Main placeholder */}
        <div className="aspect-square w-full max-w-md mx-auto">
          <div className="w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(product.name)}
              </div>
              <p className="text-sm text-muted-foreground">No image available</p>
            </div>
          </div>
        </div>
        
        {/* Thumbnail placeholders */}
        <div className="flex gap-2 justify-center">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 flex items-center justify-center rounded border bg-muted/30 text-xs font-medium text-muted-foreground"
            >
              {getInitials(product.name)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render actual images if available
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square w-full max-w-md mx-auto">
        <img
          src={product.images[selectedImage].url}
          alt={`${product.name} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover rounded-lg border"
        />
      </div>
      
      {/* Thumbnails */}
      <div className="flex gap-2 justify-center">
        {product.images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(index)}
            className={cn(
              "w-16 h-16 rounded border overflow-hidden",
              selectedImage === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
            )}
          >
            <img
              src={image.url}
              alt={`${product.name} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Grid/Table Implementation with Image Placeholders:**
```tsx
// Data grid with consistent image display
<TableCell>
  <div className="flex items-center gap-3">
    <ImageWithFallback
      src={product.images?.[0]?.url}
      name={product.name}
      size="md"
    />
    <div>
      <p className="font-medium">{product.name}</p>
      <p className="text-sm text-muted-foreground">{product.category?.name}</p>
    </div>
  </div>
</TableCell>
```

### Implementation Verification Checklist

Before considering any feature complete, verify ALL of the following:

- [ ] **Toast Notifications**: Success, error, warning, and info toasts implemented
- [ ] **Error Handling**: Comprehensive backend and frontend error handling
- [ ] **Responsive Design**: Tested and working on mobile, tablet, desktop
- [ ] **Standard Colors**: Using consistent semantic colors for status indicators
- [ ] **Form Uniformity**: Consistent field alignment, spacing, and responsive layout
- [ ] **LKR Currency**: All monetary values displayed in Sri Lankan Rupees
- [ ] **Loading States**: Loading indicators for all data and action operations
- [ ] **Grid Design**: Uniform grids with inline action buttons (no dropdown menus)
- [ ] **Theme Support**: Fully tested in both light and dark themes
- [ ] **Image Placeholders**: Name initials shown when images are unavailable
- [ ] **User Feedback**: Appropriate feedback for all user interactions

### Non-Compliance Consequences

**Failing to implement these mandatory requirements will result in:**
- Feature rejection and requirement for complete reimplementation
- Inconsistent user experience across the application
- Potential accessibility and usability issues
- Maintenance difficulties and technical debt

**These requirements are NON-NEGOTIABLE** and must be treated as essential components of any feature implementation in the ReztoBelle Admin Web application.

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
4. **Service Layer Architecture**: Separation of business logic from route handlers
5. **Comprehensive Database Design**: Optimized schema for jewelry e-commerce operations
6. **Next.js App Router**: Modern React patterns with SSR capabilities
7. **shadcn/ui**: Consistent, accessible, and customizable UI components
8. **Context API**: Lightweight state management for authentication
9. **TypeScript**: End-to-end type safety across the entire stack
10. **Cloudinary Integration**: Professional image management with CDN delivery
11. **Koombiyo API Integration**: Seamless third-party delivery service integration
12. **Role-Based Access Control**: Granular permissions for different admin levels

## Performance Optimizations

### Frontend
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Bundle size monitoring and optimization
- **Caching**: Strategic use of React memo and useMemo

### Backend
- **Service Layer Pattern**: Business logic separated into reusable services (InventoryService, KoombiyoService)
- **Database Indexing**: Optimized queries with proper indexes for categories, products, orders
- **Connection Pooling**: Prisma connection management with efficient resource utilization
- **Transaction Management**: Atomic operations for complex business processes (stock reservations, order processing)
- **Response Caching**: Cache frequently accessed data like categories and product information
- **Rate Limiting**: Prevent API abuse and improve stability across all endpoints
- **Stock Reservation System**: Ensures inventory consistency during order processing
- **Koombiyo Integration Optimization**: Efficient API calls with proper error handling and retry logic

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