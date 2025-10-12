// Discount Type Enum
export enum DiscountType {
  BILL_DISCOUNT = 'BILL_DISCOUNT',
  PRODUCT_DISCOUNT = 'PRODUCT_DISCOUNT'
}

// Main Discount Interface
export interface Discount {
  id: number;
  discountCode: string;
  discountName: string;
  description: string;
  type: DiscountType;
  discountValue: number;
  isPercentage: boolean;
  minOrderAmount: number;
  maxDiscountAmount: number;
  validFrom: string; // ISO date string
  validTo: string; // ISO date string
  productIds?: number[]; // For PRODUCT_DISCOUNT type
  categoryIds?: number[]; // For category-specific discounts
  isActive?: boolean;
  usageLimit?: number;
  usedCount?: number;
}

// Discount Validation Request
export interface DiscountValidationRequest {
  discountCode: string;
  userId: number;
  orderAmount: number;
  productIds?: number[];
}

// Discount Validation Response
export interface DiscountValidationResponse {
  applicable: boolean;
  message: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountCode?: string;
  discountName?: string;
  discountId?: number;
}

// Discount Application Request
export interface DiscountApplicationRequest {
  discountCode: string;
  userId: number;
  orderAmount: number;
  productIds?: number[];
  orderId?: number; // Optional for validation-only mode
}

// Discount Application Response
export interface DiscountApplicationResponse {
  applicable: boolean;
  message: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountCode?: string;
  discountName?: string;
  discountId?: number;
}

// User Discount History Item
export interface UserDiscountHistoryItem {
  id: number;
  discountName: string;
  discountCode: string;
  orderId: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  usedAt: string; // ISO date string
  discountType: DiscountType;
  discountValue: number;
  wasPercentage: boolean;
}

// Paginated User Discount History Response
export interface UserDiscountHistoryResponse {
  content: UserDiscountHistoryItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Most Used Discount
export interface MostUsedDiscount {
  discountCode: string;
  usageCount: number;
  totalSavings: number;
}

// Monthly Savings
export interface MonthlySavings {
  month: string;
  totalSavings: number;
  orderCount: number;
}

// User Savings Summary
export interface UserSavingsSummary {
  userId: number;
  totalSavings: number;
  totalOrders: number;
  avgSavingsPerOrder: number;
  mostUsedDiscount?: MostUsedDiscount;
  savingsByMonth: MonthlySavings[];
}

// Cart Item with potential discount info
export interface CartItemWithDiscount {
  id: string;
  productId: number;
  name: string;
  price: number;
  originalPrice?: number; // If product has discount
  quantity: number;
  imageUrl: string;
  stock: number;
  categoryId: number;
  discountId?: number;
  discountName?: string;
  discountAmount?: number;
}

// Enhanced Cart Summary with discounts
export interface CartSummaryWithDiscount {
  subtotal: number;
  shipping: number;
  tax: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  appliedDiscount?: {
    id: number;
    code: string;
    name: string;
    amount: number;
  };
}

// Discount Product Association
export interface DiscountProduct {
  id: number;
  productId: number;
  productBarcode?: string;
  addedAt: string; // ISO date string
  price: number | null;
  imageUrl: string | null;
  description: string | null;
  category: number | null;
  productName: string;
}

// Discount Details Response
export interface DiscountDetailsResponse {
  discountId: number;
  discountName: string;
  discountCode: string;
  discountType: DiscountType;
  totalProducts: number;
  message: string;
  products: DiscountProduct[];
}