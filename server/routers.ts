import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import {
  getAllProducts,
  getProductsByCategory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  upsertUser,
} from "./db";
const MANAGER_WHATSAPP = "77774779779";
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    adminLogin: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const correctPassword = process.env.ADMIN_PASSWORD || "";
        const ownerId = process.env.OWNER_OPEN_ID || "admin";
        if (!correctPassword || input.password !== correctPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Неверный пароль" });
        }
        await upsertUser({
          openId: ownerId,
          name: "Администратор",
          role: "admin",
          lastSignedIn: new Date(),
        } as any);
        const token = await sdk.signSession(
          { openId: ownerId, appId: process.env.VITE_APP_ID || "amor", name: "Администратор" },
          { expiresInMs: 365 * 24 * 60 * 60 * 1000 }
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        return { success: true } as const;
      }),
  }),
  products: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        if (input?.category && input.category !== "all") {
          return getProductsByCategory(input.category);
        }
        return getAllProducts();
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        return product;
      }),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          brand: z.string().min(1),
          category: z.string().min(1),
          subcategory: z.string().optional(),
          description: z.string().optional(),
          ingredients: z.string().optional(),
          usage: z.string().optional(),
          price: z.string(),
          imageUrl: z.string().optional(),
          inStock: z.number().default(1),
        })
      )
      .mutation(async ({ input }) => {
        await createProduct(input as any);
        return { success: true };
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          brand: z.string().optional(),
          category: z.string().optional(),
          subcategory: z.string().optional(),
          description: z.string().optional(),
          ingredients: z.string().optional(),
          usage: z.string().optional(),
          price: z.string().optional(),
          imageUrl: z.string().optional(),
          inStock: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProduct(id, data as any);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),
  }),
  orders: router({
    create: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1, "Введите имя"),
          customerPhone: z.string().min(7, "Введите номер телефона"),
          deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
          deliveryAddress: z.string().optional(),
          pickupLocation: z.string().optional(),
          paymentMethod: z.enum(["kaspi_red", "cash"]),
          items: z.array(
            z.object({
              productId: z.number(),
              name: z.string(),
              price: z.number(),
              quantity: z.number().min(1),
            })
          ).min(1, "Корзина пуста"),
          totalAmount: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const order = await createOrder({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryMethod: input.deliveryMethod,
          deliveryAddress: input.deliveryAddress ?? null,
          pickupLocation: input.pickupLocation ?? null,
          paymentMethod: input.paymentMethod,
          items: input.items,
          totalAmount: input.totalAmount.toFixed(2),
          notes: input.notes,
        } as any);
        const orderId = order?.id ?? "—";
        const itemsList = input.items
          .map((i) => `• ${i.name} × ${i.quantity} — ${(i.price * i.quantity).toLocaleString("ru-KZ")} ₸`)
          .join("\n");
        const deliveryInfo = input.deliveryMethod === "pickup"
          ? `📍 Самовывоз: ${input.pickupLocation ?? "не указано"}`
          : `🚚 Доставка: ${input.deliveryAddress ?? "не указано"}`;
        const paymentLabel = input.paymentMethod === "kaspi_red" ? "Kaspi" : "Наличные";
        const orderText =
          `🛍️ *НОВЫЙ ЗАКАЗ #${orderId}*\n\n` +
          `👤 *Клиент:* ${input.customerName}\n` +
          `📞 *Телефон:* ${input.customerPhone}\n` +
          `${deliveryInfo}\n` +
          `💳 *Оплата:* ${paymentLabel}\n\n` +
          `*Состав заказа:*\n${itemsList}\n\n` +
          `💰 *Итого: ${input.totalAmount.toLocaleString("ru-KZ")} ₸*` +
          (input.notes ? `\n\n📝 *Примечание:* ${input.notes}` : "");
        await notifyOwner({
          title: `🛍️ Новый заказ #${orderId} от ${input.customerName}`,
          content: orderText,
        }).catch(() => {});
        const whatsappUrl = `https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent(orderText)}`;
        return {
          success: true,
          orderId,
          whatsappUrl,
          orderText,
        };
      }),
    list: adminProcedure.query(async () => {
      return getAllOrders();
    }),
    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        return order;
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),
  admin: router({
    stats: adminProcedure.query(async () => {
      const allProducts = await getAllProducts();
      const allOrders = await getAllOrders();
      const totalRevenue = allOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + parseFloat(o.totalAmount as string), 0);
      const newOrders = allOrders.filter((o) => o.status === "new").length;
      return {
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
        newOrders,
        totalRevenue,
      };
    }),
    uploadImage: adminProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `products/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),
  chat: router({
    message: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const systemPrompt = `Ты — AI-помощник магазина Amor Skincare, премиального магазина корейской и европейской косметики в Казахстане.
Информация о магазине:
- Название: Amor Skincare
- Слоган: "Твой premium skincare space"
- Локации: Уральск — ТРЦ Атриум; Аксай — Asia Plaza
- WhatsApp: +7 777 477 97 79
- Режим работы: Пн-Вс 10:00–21:00
- Оплата: Kaspi, наличные
- Доставка: курьерская доставка по городу или самовывоз из магазина
Отвечай на русском языке. Будь дружелюбным и профессиональным. Давай конкретные рекомендации по уходу за кожей.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent
          : "Извините, не могу ответить прямо сейчас. Напишите нам в WhatsApp: +7 777 477 97 79";
        return { content };
      }),
  }),
});
export type AppRouter = typeof appRouter;
