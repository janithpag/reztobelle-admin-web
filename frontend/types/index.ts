// Database model interfaces matching the Prisma schema

export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  slug: string;
  sortOrder: number;
  products?: Product[];
  _count?: {
    products: number;
  };
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  createdAt: string;
  updatedAt: string;
  brand?: string;
  color?: string;
  costPrice: number;
  dimensions?: string;
  isActive: boolean;
  isFeatured: boolean;
  material?: string;
  metaDescription?: string;
  metaTitle?: string;
  price: number;
  shortDescription?: string;
  size?: string;
  slug: string;
  weight?: number;
  categoryId: number;
  category?: Category;
  images?: ProductImage[];
  inventory?: Inventory;
  orderItems?: OrderItem[];
  stockMovements?: StockMovement[];
}

export interface ProductImage {
  id: number;
  productId: number;
  cloudinaryId: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Inventory {
  id: number;
  productId: number;
  quantityAvailable: number;
  quantityReserved: number;
  reorderLevel: number;
  maxStockLevel: number;
  lastRestockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  movementType: StockMovementType;
  quantity: number;
  referenceType: StockReferenceType;
  referenceId?: number;
  notes?: string;
  unitCost?: number;
  createdBy: number;
  createdAt: string;
  createdByUser?: User;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  address: string;
  cityId: number;
  cityName: string;
  codAmount?: number;
  deliveredAt?: string;
  discountAmount: number;
  districtId: number;
  districtName: string;
  internalNotes?: string;
  orderedAt: string;
  packageDescription?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  sentToDeliveryAt?: string;
  shippedAt?: string;
  shippingAmount: number;
  specialNotes?: string;
  subtotal: number;
  waybillId?: string;
  orderItems?: OrderItem[];
  deliveryLogs?: DeliveryLog[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  productName: string;
  sku: string;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  createdAt: string;
}

export interface DeliveryLog {
  id: number;
  orderId: number;
  status: string;
  location?: string;
  remarks?: string;
  timestamp: string;
  createdAt: string;
}

export interface Customer {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address: string;
  cityName: string;
  districtName: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  firstOrderDate: string;
}

export interface CustomerDetails extends Customer {
  cityId: number;
  districtId: number;
  orders?: {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    createdAt: string;
    itemCount: number;
  }[];
}

export interface CustomerStats {
  totalCustomers: number;
  totalOrders: number;
  avgOrdersPerCustomer: number;
  avgSpentPerCustomer: number;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  passwordHash: string;
}

// Frontend-safe user interface matching backend API responses
export interface FrontendUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
  createdAt?: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
}



export interface Expense {
  id: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  supplierName?: string;
  referenceNumber?: string;
  subcategory?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  createdByUser?: User;
}

// Enums matching the Prisma schema
export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum StockReferenceType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
  SENT_TO_DELIVERY = 'SENT_TO_DELIVERY',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
  DELETED = 'DELETED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export enum ExpenseCategory {
  INVENTORY = 'INVENTORY',
  SHIPPING = 'SHIPPING',
  MARKETING = 'MARKETING',
  OPERATIONS = 'OPERATIONS',
  OFFICE = 'OFFICE',
  UTILITIES = 'UTILITIES',
  FEES = 'FEES',
  OTHER = 'OTHER'
}

export enum RecurringFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// Form interfaces for creating/updating records
export interface CreateProductForm {
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  sku: string;
  categoryId: number;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: string;
  brand?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  images?: UploadedImage[];
  initialStock?: number;
}

export interface UpdateProductForm {
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  sku?: string;
  categoryId?: number;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: string;
  brand?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  images?: UploadedImage[];
}

export interface CreateCategoryForm {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryForm extends Partial<CreateCategoryForm> {
  id: number;
}

export interface CreateOrderForm {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  address: string;
  cityId: number;
  cityName: string;
  districtId: number;
  districtName: string;
  paymentMethod: PaymentMethod;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    productName: string;
    sku: string;
  }[];
  notes?: string;
  specialNotes?: string;
  shippingAmount?: number;
  discountAmount?: number;
  markAsReadyForDelivery?: boolean;
}

// Image upload interface
export interface UploadedImage {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// API Response interfaces
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}