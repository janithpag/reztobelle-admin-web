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
  deliveryStatus?: KoombiyoDeliveryStatus;
  discountAmount: number;
  districtId: number;
  districtName: string;
  internalNotes?: string;
  koombiyoLastStatus?: string;
  koombiyoOrderId?: string;
  koombiyoStatusUpdatedAt?: string;
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
  paymentTransactions?: PaymentTransaction[];
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

export interface PaymentTransaction {
  id: number;
  orderId: number;
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: TransactionStatus;
  bankDetails?: string;
  depositSlipUrl?: string;
  verifiedBy?: number;
  verifiedAt?: string;
  notes?: string;
  processedAt?: string;
  createdAt: string;
  verifiedByUser?: User;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  passwordHash: string;
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

export interface DeliveryLog {
  id: number;
  orderId: number;
  action: DeliveryAction;
  status?: string;
  message?: string;
  response?: any;
  createdBy?: number;
  createdAt: string;
  createdByUser?: User;
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
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
  SENT_TO_DELIVERY = 'SENT_TO_DELIVERY',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export enum KoombiyoDeliveryStatus {
  NOT_SENT = 'NOT_SENT',
  SENT_TO_KOOMBIYO = 'SENT_TO_KOOMBIYO',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

export enum DeliveryAction {
  SENT_TO_KOOMBIYO = 'SENT_TO_KOOMBIYO',
  STATUS_UPDATE = 'STATUS_UPDATE',
  PICKUP_REQUEST = 'PICKUP_REQUEST',
  TRACKING_UPDATE = 'TRACKING_UPDATE',
  RETURN_RECEIVED = 'RETURN_RECEIVED',
  ERROR_LOG = 'ERROR_LOG'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
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
  customerPhone?: string;
  address: string;
  cityId: number;
  cityName: string;
  districtId: number;
  districtName: string;
  paymentMethod: PaymentMethod;
  items: {
    productId: number;
    quantity: number;
  }[];
  notes?: string;
  specialNotes?: string;
  shippingAmount?: number;
  discountAmount?: number;
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