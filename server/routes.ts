import express from "express";
import { z } from "zod";
import { eq, and, desc, count, ilike, or } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  vrooms,
  products,
  cartItems,
  orders,
  messages,
  follows,
  productComments,
  productLikes,
  productShares,
  bookmarks,
  imageBucket,
  conversations,
} from "./schema";

const app = express();
app.use(express.json());

/* ------------------------- AUTH ------------------------- */
app.get("/api/auth/user", async (req, res) => {
  try {
    const user = await getCurrentUser(req); // your auth helper
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json({ message: "User fetched", data: user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

/* ------------------------- USERS ------------------------- */
app.get("/api/users/:id", async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User fetched", data: user });
  } catch {
    res.status(500).json({ message: "Error fetching user" });
  }
});

app.get("/api/users/search", async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ message: "Missing search query" });

  try {
    const results = await db
      .select()
      .from(users)
      .where(or(ilike(users.username, `%${q}%`), ilike(users.firstName, `%${q}%`)));
    res.json({ message: "Search complete", data: results });
  } catch {
    res.status(500).json({ message: "Error searching users" });
  }
});

/* ------------------------- VROOMS ------------------------- */
app.post("/api/vrooms", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      coverImageUrl: z.string().url().optional(),
      isPublic: z.boolean().default(true),
    });
    const payload = schema.parse(req.body);
    const user = await getCurrentUser(req);

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const [vroom] = await db.insert(vrooms).values({ ...payload, userId: user.id }).returning();
    res.json({ message: "Vroom created", data: vroom });
  } catch (err) {
    res.status(400).json({ message: "Invalid vroom data" });
  }
});

app.get("/api/vrooms/:id", async (req, res) => {
  try {
    const [vroom] = await db.select().from(vrooms).where(eq(vrooms.id, req.params.id));
    if (!vroom) return res.status(404).json({ message: "Vroom not found" });
    res.json({ message: "Vroom fetched", data: vroom });
  } catch {
    res.status(500).json({ message: "Error fetching vroom" });
  }
});

/* ------------------------- PRODUCTS ------------------------- */
app.post("/api/products", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string(),
      description: z.string(),
      price: z.string().or(z.number()),
      imageUrls: z.array(z.string().url()).optional(),
      hashtags: z.array(z.string()).optional(),
      vroomId: z.string().optional(),
    });

    const payload = schema.parse(req.body);
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const [product] = await db.insert(products).values({
      ...payload,
      userId: user.id,
      price: String(payload.price),
    }).returning();

    res.json({ message: "Product created", data: product });
  } catch (err) {
    res.status(400).json({ message: "Invalid product data" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const [product] = await db.select().from(products).where(eq(products.id, req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product fetched", data: product });
  } catch {
    res.status(500).json({ message: "Error fetching product" });
  }
});

/* ------------------------- CART + MULTI-ITEM CHECKOUT ------------------------- */
app.post("/api/cart", async (req, res) => {
  try {
    const schema = z.object({
      productId: z.string(),
      quantity: z.number().min(1).default(1),
    });
    const payload = schema.parse(req.body);
    const user = await getCurrentUser(req);

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    await db.insert(cartItems).values({ ...payload, userId: user.id }).onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId],
      set: { quantity: payload.quantity },
    });

    res.json({ message: "Cart updated" });
  } catch {
    res.status(400).json({ message: "Invalid cart data" });
  }
});

app.post("/api/orders/checkout", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get all cart items for this user
    const items = await db.select().from(cartItems).where(eq(cartItems.userId, user.id));
    if (!items.length) return res.status(400).json({ message: "Cart is empty" });

    // Convert each item into an order
    const createdOrders = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (!product) continue;

      const total = Number(product.price) * item.quantity;
      const [order] = await db.insert(orders).values({
        buyerId: user.id,
        sellerId: product.userId,
        productId: product.id,
        quantity: item.quantity,
        totalAmount: String(total),
        shippingAddress: req.body.shippingAddress || {}, // flexible for now
        status: "pending",
      }).returning();

      createdOrders.push(order);
    }

    // Clear the cart
    await db.delete(cartItems).where(eq(cartItems.userId, user.id));

    res.json({ message: "Checkout successful", data: createdOrders });
  } catch (err) {
    res.status(500).json({ message: "Checkout failed" });
  }
});

/* ------------------------- MESSAGES ------------------------- */
app.post("/api/messages", async (req, res) => {
  try {
    const schema = z.object({
      receiverId: z.string(),
      content: z.string().min(1).max(1000),
      conversationId: z.string().optional(),
    });

    const payload = schema.parse(req.body);
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const [msg] = await db.insert(messages).values({
      senderId: user.id,
      receiverId: payload.receiverId,
      conversationId: payload.conversationId || null,
      content: payload.content,
    }).returning();

    res.json({ message: "Message sent", data: msg });
  } catch {
    res.status(400).json({ message: "Invalid message data" });
  }
});

/* ------------------------- HASHTAGS (TRENDING) ------------------------- */
app.get("/api/hashtags/trending", async (req, res) => {
  try {
    const results = await db.select({
      hashtag: products.hashtags,
      count: count(products.id),
    })
      .from(products)
      .groupBy(products.hashtags)
      .orderBy(desc(count(products.id)))
      .limit(10);

    res.json({ message: "Trending hashtags", data: results });
  } catch {
    res.status(500).json({ message: "Failed to fetch hashtags" });
  }
});

/* ------------------------- BOOKMARKS ------------------------- */
app.post("/api/bookmarks", async (req, res) => {
  try {
    const schema = z.object({ productId: z.string() });
    const { productId } = schema.parse(req.body);
    const user = await getCurrentUser(req);

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const [bookmark] = await db.insert(bookmarks).values({ productId, userId: user.id }).returning();
    res.json({ message: "Bookmarked", data: bookmark });
  } catch {
    res.status(400).json({ message: "Invalid bookmark request" });
  }
});

export default app;
