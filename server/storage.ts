import { db } from "./db";
import {
  users,
  vrooms,
  products,
  productLikes,
  productComments,
  productShares,
  cartItems,
  orders,
  follows,
  vroomFollows,
  messages,
  bookmarks,
  type User,
  type UpsertUser,
  type UpdateProfile,
  type Vroom,
  type InsertVroom,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Message,
  type InsertMessage,
  type CartItem,
  type InsertProductComment,
  type ProductComment,
  type Bookmark,
  type InsertBookmark,
} from "@shared/schema";
import { eq, and, desc, or } from "drizzle-orm";

// ---------- USERS ----------
export const getUser = async (id: string): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

export const upsertUser = async (userData: UpsertUser): Promise<User> => {
  const [user] = await db
    .insert(users)
    .values({
      id: userData.id, // Supabase auth.users.id
      email: userData.email,
      username: userData.username,
      bio: userData.bio ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      bannerImageUrl: userData.bannerImageUrl ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      location: userData.location ?? null,
      website: userData.website ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: userData.email,
        username: userData.username,
        bio: userData.bio ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        bannerImageUrl: userData.bannerImageUrl ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        location: userData.location ?? null,
        website: userData.website ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
};

export const updateProfile = async (
  userId: string,
  profile: UpdateProfile
): Promise<User> => {
  const [user] = await db
    .update(users)
    .set({ ...profile, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
};

// ---------- PRODUCTS ----------
export const getProducts = async (): Promise<Product[]> => {
  return db.select().from(products).orderBy(desc(products.createdAt));
};

export const getProduct = async (id: string): Promise<Product | undefined> => {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  return product;
};

export const addProduct = async (
  data: InsertProduct
): Promise<Product> => {
  const [product] = await db.insert(products).values(data).returning();
  return product;
};

// ---------- PRODUCT INTERACTIONS ----------
export const addProductLike = async (userId: string, productId: string) => {
  await db.insert(productLikes).values({ userId, productId }).onConflictDoNothing();
};

export const addProductComment = async (
  data: InsertProductComment
): Promise<ProductComment> => {
  const [comment] = await db.insert(productComments).values(data).returning();
  return comment;
};

export const getProductComments = async (productId: string): Promise<ProductComment[]> => {
  return db.select().from(productComments).where(eq(productComments.productId, productId));
};

export const addProductShare = async (userId: string, productId: string) => {
  await db.insert(productShares).values({ userId, productId }).onConflictDoNothing();
};

// ---------- CART ----------
export const getCart = async (userId: string): Promise<CartItem[]> => {
  return db.select().from(cartItems).where(eq(cartItems.userId, userId));
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<CartItem> => {
  const [cartItem] = await db
    .insert(cartItems)
    .values({ userId, productId, quantity })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId],
      set: { quantity },
    })
    .returning();
  return cartItem;
};

export const clearCart = async (userId: string) => {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
};

// ---------- ORDERS ----------
export const placeOrder = async (
  userId: string,
  items: { productId: string; quantity: number }[]
): Promise<Order> => {
  const [order] = await db.insert(orders).values({ userId }).returning();

  for (const item of items) {
    await db.insert(order.items).values({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
    });
  }

  await clearCart(userId); // clear cart after checkout
  return order;
};

export const getOrders = async (userId: string): Promise<Order[]> => {
  return db.select().from(orders).where(eq(orders.userId, userId));
};

// ---------- FOLLOWS ----------
export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) return null;
  await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
};

// ---------- VROOMS ----------
export const createVroom = async (
  data: InsertVroom
): Promise<Vroom> => {
  const [vroom] = await db.insert(vrooms).values(data).returning();
  return vroom;
};

export const getVrooms = async (): Promise<Vroom[]> => {
  return db.select().from(vrooms).orderBy(desc(vrooms.createdAt));
};

export const followVroom = async (userId: string, vroomId: string) => {
  await db.insert(vroomFollows).values({ userId, vroomId }).onConflictDoNothing();
};

// ---------- BOOKMARKS ----------
export const addBookmark = async (data: InsertBookmark): Promise<Bookmark> => {
  const [bookmark] = await db.insert(bookmarks).values(data).returning();
  return bookmark;
};

export const removeBookmark = async (userId: string, productId: string) => {
  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.productId, productId)));
};

export const getBookmarks = async (userId: string): Promise<Bookmark[]> => {
  return db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
};

// ---------- MESSAGES ----------
export const sendMessage = async (
  data: InsertMessage
): Promise<Message> => {
  const [message] = await db.insert(messages).values(data).returning();
  return message;
};

export const getMessages = async (userId: string, otherUserId: string): Promise<Message[]> => {
  return db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
        and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
      )
    )
    .orderBy(messages.createdAt);
};
