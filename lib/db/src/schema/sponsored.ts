import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Paid brand placements. Brands pay Joshua for placement; every placement
 * must render a visible "Sponsored" badge in the app (FTC disclosure).
 */
export const sponsoredProductsTable = pgTable("sponsored_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  price: text("price"),
  /** tops | bottoms | outerwear | shoes | accessories */
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  /** Product/affiliate URL the app opens on tap. */
  url: text("url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  /** Higher shows first. */
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SponsoredProduct = typeof sponsoredProductsTable.$inferSelect;

/** Click-through log so Joshua can report numbers back to brands. */
export const sponsoredClicksTable = pgTable("sponsored_clicks", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => sponsoredProductsTable.id),
  deviceId: text("device_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SponsoredClick = typeof sponsoredClicksTable.$inferSelect;

/** Per-device daily usage for the Pro deal-search endpoint (cost control). */
export const dealSearchUsageTable = pgTable(
  "deal_search_usage",
  {
    deviceId: text("device_id").notNull(),
    day: date("day").notNull(),
    count: integer("count").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.deviceId, t.day] })]
);

export type DealSearchUsage = typeof dealSearchUsageTable.$inferSelect;
