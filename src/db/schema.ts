import { pgTable, serial, text, decimal, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'bank', 'investment', 'property', 'crypto', 'other'
  category: varchar('category', { length: 100 }), // 'checking', 'savings', 'stocks', 'real-estate', etc.
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  description: text('description'),
  symbol: varchar('symbol', { length: 20 }), // Stock ticker symbol (e.g., 'AAPL', 'TSLA')
  quantity: decimal('quantity', { precision: 15, scale: 4 }), // Number of shares/units
  lastPriceUpdate: timestamp('last_price_update'), // When price was last fetched from API
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tickers = pgTable('tickers', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'buy' or 'sell'
  date: timestamp('date').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  pricePerShare: decimal('price_per_share', { precision: 15, scale: 4 }).notNull(),
  totalValue: decimal('total_value', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dividends = pgTable('dividends', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  exDate: timestamp('ex_date').notNull(), // Ex-dividend date
  paymentDate: timestamp('payment_date'), // Actual payment date (may be null if not yet paid)
  amount: decimal('amount', { precision: 15, scale: 4 }).notNull(), // Dividend amount per share
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  type: varchar('type', { length: 10 }).default('cash').notNull(), // 'cash' or 'stock'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type Ticker = typeof tickers.$inferSelect;
export type NewTicker = typeof tickers.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Dividend = typeof dividends.$inferSelect;
export type NewDividend = typeof dividends.$inferInsert;

