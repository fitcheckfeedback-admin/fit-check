import { Router } from "express";
import { db, sponsoredProductsTable, sponsoredClicksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../lib/logger";

const router = Router();

/** Same admin token pattern as premium.ts. */
function getToken(): string {
  const secret = process.env.SESSION_SECRET ?? "fallback-secret";
  const password = process.env.ANALYTICS_PASSWORD ?? "";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

function isAuthorized(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const auth = req.headers["authorization"];
  if (!auth || typeof auth !== "string") return false;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token === getToken();
}

function publicShape(p: typeof sponsoredProductsTable.$inferSelect) {
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    price: p.price,
    category: p.category,
    imageUrl: p.imageUrl,
    url: p.url,
  };
}

// GET /api/sponsored?category=tops — public feed of active placements.
router.get("/sponsored", async (req, res) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category.trim().toLowerCase() : "";
    const rows = await db
      .select()
      .from(sponsoredProductsTable)
      .where(eq(sponsoredProductsTable.isActive, true))
      .orderBy(desc(sponsoredProductsTable.priority));
    const filtered = category ? rows.filter((r) => r.category.toLowerCase() === category) : rows;
    res.json({ products: filtered.map(publicShape) });
  } catch (err) {
    logger.error({ err }, "sponsored feed failed");
    res.status(500).json({ error: "sponsored_failed" });
  }
});

// POST /api/sponsored/click — public click log for brand reporting.
router.post("/sponsored/click", async (req, res) => {
  try {
    const { productId, deviceId } = req.body ?? {};
    if (typeof productId !== "string" || !productId.trim()) {
      res.status(400).json({ error: "productId is required" }); return;
    }
    await db.insert(sponsoredClicksTable).values({
      productId: productId.trim(),
      deviceId: typeof deviceId === "string" && deviceId.trim() ? deviceId.trim().slice(0, 200) : null,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "sponsored click log failed");
    res.status(500).json({ error: "click_failed" });
  }
});

// POST /api/sponsored — admin: create a placement.
router.post("/sponsored", async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  try {
    const { brand, name, price, category, imageUrl, url, priority } = req.body ?? {};
    if (typeof brand !== "string" || !brand.trim() || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "brand and name are required" }); return;
    }
    if (typeof url !== "string" || !/^https:\/\//i.test(url.trim())) {
      res.status(400).json({ error: "a valid https url is required" }); return;
    }
    if (typeof category !== "string" || !category.trim()) {
      res.status(400).json({ error: "category is required" }); return;
    }
    const [row] = await db
      .insert(sponsoredProductsTable)
      .values({
        brand: brand.trim().slice(0, 200),
        name: name.trim().slice(0, 200),
        price: typeof price === "string" ? price.trim().slice(0, 50) : null,
        category: category.trim().toLowerCase().slice(0, 50),
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim().slice(0, 500) : null,
        url: url.trim().slice(0, 500),
        priority: Number.isFinite(Number(priority)) ? Number(priority) : 0,
      })
      .returning();
    res.status(201).json(publicShape(row));
  } catch (err) {
    logger.error({ err }, "sponsored create failed");
    res.status(500).json({ error: "create_failed" });
  }
});

// PATCH /api/sponsored/:id — admin: update (incl. isActive toggle).
router.patch("/sponsored/:id", async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  try {
    const patch: Partial<typeof sponsoredProductsTable.$inferInsert> = {};
    const b = req.body ?? {};
    if (typeof b.brand === "string" && b.brand.trim()) patch.brand = b.brand.trim().slice(0, 200);
    if (typeof b.name === "string" && b.name.trim()) patch.name = b.name.trim().slice(0, 200);
    if (typeof b.price === "string") patch.price = b.price.trim().slice(0, 50);
    if (typeof b.category === "string" && b.category.trim()) patch.category = b.category.trim().toLowerCase().slice(0, 50);
    if (typeof b.imageUrl === "string") patch.imageUrl = b.imageUrl.trim() ? b.imageUrl.trim().slice(0, 500) : null;
    if (typeof b.url === "string" && /^https:\/\//i.test(b.url.trim())) patch.url = b.url.trim().slice(0, 500);
    if (typeof b.isActive === "boolean") patch.isActive = b.isActive;
    if (Number.isFinite(Number(b.priority))) patch.priority = Number(b.priority);
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "nothing to update" }); return;
    }
    const [row] = await db
      .update(sponsoredProductsTable)
      .set(patch)
      .where(eq(sponsoredProductsTable.id, req.params.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(publicShape(row));
  } catch (err) {
    logger.error({ err }, "sponsored update failed");
    res.status(500).json({ error: "update_failed" });
  }
});

// DELETE /api/sponsored/:id — admin: soft-delete (deactivate) a placement.
// Clicks reference products, so rows are never hard-deleted; deactivated
// products stop appearing in the feed and in deal results.
router.delete("/sponsored/:id", async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  try {
    const [row] = await db
      .update(sponsoredProductsTable)
      .set({ isActive: false })
      .where(eq(sponsoredProductsTable.id, req.params.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "sponsored delete failed");
    res.status(500).json({ error: "delete_failed" });
  }
});

export default router;
