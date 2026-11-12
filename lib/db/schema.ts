import {
  pgTable, uuid, text, boolean, numeric,
  integer, jsonb, timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── ENUMS ───────────────────────────────────────────────
export const roleEnum = pgEnum('role', ['admin', 'reception', 'kitchen'])
export const deliveryTypeEnum = pgEnum('delivery_type', ['dine-in', 'outdoor'])
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
])
export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid', 'paid', 'partial', 'refunded'
])
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash', 'upi', 'card', 'razorpay'
])
export const poStatusEnum = pgEnum('po_status', [
  'ordered', 'received', 'partial', 'cancelled'
])
export const movementTypeEnum = pgEnum('movement_type', ['in', 'out', 'adjustment'])

// ─── RESTAURANT INFO ──────────────────────────────────────
export const restaurantInfo = pgTable('restaurant_info', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').default('The Royal Comfort Hotel and Restaurant').notNull(),
  address: text('address').default('Hotel and Restaurant').notNull(),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  logoUrl: text('logo_url'),
  themeColor: text('theme_color').default('#B5451B'),
  accentColor: text('accent_color').default('#F4A261'),
  slug: text('slug').unique().default('royal-comfort'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── USERS ────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── CATEGORIES ───────────────────────────────────────────
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  icon: text('icon'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── DISHES ───────────────────────────────────────────────
export const dishes = pgTable('dishes', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isVeg: boolean('is_veg').default(true),
  isAvailable: boolean('is_available').default(true),
  sizes: jsonb('sizes').default([]),
  images: jsonb('images').default([]),
  cloudinaryIds: jsonb('cloudinary_ids').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── ORDERS ───────────────────────────────────────────────
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').unique(),
  deliveryType: deliveryTypeEnum('delivery_type').notNull(),
  tableNumber: text('table_number'),
  deliveryAddress: text('delivery_address'),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  status: orderStatusEnum('status').default('pending'),
  paymentStatus: paymentStatusEnum('payment_status').default('unpaid'),
  paymentMethod: paymentMethodEnum('payment_method'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  subtotal: numeric('subtotal').default('0'),
  tax: numeric('tax').default('0'),
  discount: numeric('discount').default('0'),
  total: numeric('total').default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── ORDER ITEMS ──────────────────────────────────────────
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  dishId: uuid('dish_id').references(() => dishes.id, { onDelete: 'set null' }),
  dishName: text('dish_name'),
  sizeLabel: text('size_label'),
  unitPrice: numeric('unit_price'),
  quantity: integer('quantity'),
  totalPrice: numeric('total_price'),
  specialInstructions: text('special_instructions'),
})

// ─── INVENTORY ITEMS ──────────────────────────────────────
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  currentStock: numeric('current_stock').default('0'),
  minThreshold: numeric('min_threshold').default('5'),
  costPerUnit: numeric('cost_per_unit'),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── PURCHASE ORDERS ──────────────────────────────────────
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  poNumber: text('po_number').unique(),
  vendorName: text('vendor_name'),
  vendorContact: text('vendor_contact'),
  items: jsonb('items').default([]),
  totalCost: numeric('total_cost'),
  status: poStatusEnum('status').default('ordered'),
  orderedBy: uuid('ordered_by').references(() => users.id),
  orderedAt: timestamp('ordered_at').defaultNow(),
  receivedAt: timestamp('received_at'),
  notes: text('notes'),
})

// ─── STOCK MOVEMENTS ──────────────────────────────────────
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id),
  movementType: movementTypeEnum('movement_type'),
  quantity: numeric('quantity'),
  referenceId: uuid('reference_id'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── RELATIONS ───────────────────────────────────────────
export const categoryRelations = relations(categories, ({ many }) => ({
  dishes: many(dishes),
}))

export const dishRelations = relations(dishes, ({ one }) => ({
  category: one(categories, {
    fields: [dishes.categoryId],
    references: [categories.id],
  }),
}))

export const orderRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}))

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderItems.dishId],
    references: [dishes.id],
  }),
}))
