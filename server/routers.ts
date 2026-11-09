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
  getProductsByIds,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteOrder,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  upsertUser,
  getFeaturedProducts,
  addFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  getVisitStats,
  setVisitCount,
  recordVisit,
  getPromoSettings,
  updatePromoSettings,
  hasPreviousOrder,
} from "./db";
import { effectivePrice } from "./pricing";
import { hasNoPrice } from "../shared/catalog";
import {
  computeDiscount,
  evaluatePromo,
  normalizeCode,
  renderBannerText,
  PROMO_REJECTION_MESSAGES,
} from "./promo";

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
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return { success: true } as const;
      }),
  }),

  products: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        // Товары без цены (0 ₸) на сайте не показываем; в админке они видны через listAll.
        const items =
          input?.category && input.category !== "all"
            ? await getProductsByCategory(input.category)
            : await getAllProducts();
        return items.filter((p) => !hasNoPrice(p));
      }),

    // Полный список, включая скрытые товары без цены — только для админки
    listAll: adminProcedure.query(async () => getAllProducts()),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product || hasNoPrice(product)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
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
          discountPrice: z.string().optional(),
          discountUntil: z.string().optional(),
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
          discountPrice: z.string().optional().nullable(),
          discountUntil: z.string().optional().nullable(),
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

    // Кнопка "убрать/вернуть в наличие"
    toggleStock: adminProcedure
      .input(z.object({ id: z.number(), inStock: z.number() }))
      .mutation(async ({ input }) => {
        await updateProduct(input.id, { inStock: input.inStock });
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
          items: z
            .array(
              z.object({
                productId: z.number(),
                name: z.string(), // для сообщений об ошибке; в заказ попадает название из базы
                price: z.number(), // игнорируется: цену берём из базы товаров
                quantity: z.number().int().min(1).max(100),
              })
            )
            .min(1, "Корзина пуста"),
          totalAmount: z.number(), // игнорируется: сумму считает сервер
          notes: z.string().optional(),
          promoCode: z.string().max(50).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Цены, названия и сумму берём из базы товаров, а не из браузера:
        // иначе в запросе можно подставить любую цену.
        const quantities = new Map<number, { name: string; quantity: number }>();
        for (const item of input.items) {
          const prev = quantities.get(item.productId);
          quantities.set(item.productId, {
            name: item.name,
            quantity: (prev?.quantity ?? 0) + item.quantity,
          });
        }
        const dbProducts = new Map(
          (await getProductsByIds(Array.from(quantities.keys()))).map((p) => [p.id, p])
        );
        const now = new Date();
        const lines: { productId: number; name: string; price: number; quantity: number }[] = [];
        for (const [productId, { name, quantity }] of Array.from(quantities.entries())) {
          const product = dbProducts.get(productId);
          if (!product) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Товар «${name}» больше недоступен. Удалите его из корзины.`,
            });
          }
          if (!product.inStock) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Товара «${product.name}» нет в наличии. Удалите его из корзины.`,
            });
          }
          const price = effectivePrice(product, now);
          if (!Number.isFinite(price) || price <= 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Цена товара «${product.name}» уточняется. Напишите нам в WhatsApp: +7 777 477 97 79`,
            });
          }
          lines.push({ productId, name: product.name, price, quantity });
        }
        const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
        let promoCode: string | null = null;
        let discount = 0;
        if (input.promoCode?.trim()) {
          const promo = await getPromoSettings();
          const rejection = evaluatePromo({
            settings: promo,
            enteredCode: input.promoCode,
            phone: input.customerPhone,
            hasPreviousOrder: await hasPreviousOrder(input.customerPhone),
          });
          if (rejection) {
            throw new TRPCError({ code: "BAD_REQUEST", message: PROMO_REJECTION_MESSAGES[rejection] });
          }
          promoCode = normalizeCode(promo.code);
          discount = computeDiscount(subtotal, promo.discountPercent);
        }
        const total = subtotal - discount;

        const order = await createOrder({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryMethod: input.deliveryMethod,
          deliveryAddress: input.deliveryAddress ?? null,
          pickupLocation: input.pickupLocation ?? null,
          paymentMethod: input.paymentMethod,
          items: lines,
          totalAmount: total.toFixed(2),
          notes: input.notes,
          // Поля промокода передаём только если он применён
          ...(promoCode ? { promoCode, discountAmount: discount.toFixed(2) } : {}),
        } as any);

        const orderId = order?.id ?? "—";
        const itemsList = lines
          .map(
            (i) =>
              `• ${i.name} × ${i.quantity} — ${(i.price * i.quantity).toLocaleString("ru-KZ")} ₸`
          )
          .join("\n");
        const deliveryInfo =
          input.deliveryMethod === "pickup"
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
          (promoCode
            ? `🏷️ *Промокод ${promoCode}:* −${discount.toLocaleString("ru-KZ")} ₸
`
            : "") +
          `💰 *Итого: ${total.toLocaleString("ru-KZ")} ₸*` +
          (input.notes ? `\n\n📝 *Примечание:* ${input.notes}` : "");

        await notifyOwner({
          title: `🛍️ Новый заказ #${orderId} от ${input.customerName}`,
          content: orderText,
        }).catch(() => {});

        const whatsappUrl = `https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent(orderText)}`;
        return { success: true, orderId, whatsappUrl, orderText };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOrder(input.id);
        return { success: true };
      }),

    list: adminProcedure.query(async () => getAllOrders()),

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
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `products/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),

    // Статистика посещений
    getVisits: adminProcedure.query(async () => {
      return getVisitStats();
    }),

    // Скрытая страница — ручное изменение статистики
    setVisits: adminProcedure
      .input(z.object({ date: z.string(), count: z.number() }))
      .mutation(async ({ input }) => {
        await setVisitCount(input.date, input.count);
        return { success: true };
      }),
  }),

  // Акции на главной странице
  featured: router({
    list: publicProcedure.query(async () => {
      return getFeaturedProducts();
    }),

    add: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          label: z.string().default("Акция месяца"),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        await addFeaturedProduct(input);
        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateFeaturedProduct(id, data);
        return { success: true };
      }),

    remove: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFeaturedProduct(input.id);
        return { success: true };
      }),
  }),

  // Промокод первой покупки и баннер
  promo: router({
    // Публичные настройки для баннера на сайте
    get: publicProcedure.query(async () => {
      const promo = await getPromoSettings();
      return {
        enabled: promo.enabled,
        code: promo.code,
        discountPercent: promo.discountPercent,
        bannerText: renderBannerText(promo.bannerText, promo),
      };
    }),

    // Проверка промокода на странице оформления (до отправки заказа).
    // Историю заказов по номеру здесь НЕ проверяем: иначе любой мог бы узнать,
    // делал ли конкретный номер заказы. «Первая покупка» проверяется только в orders.create.
    check: publicProcedure
      .input(z.object({ code: z.string().max(50), phone: z.string().max(50) }))
      .query(async ({ input }) => {
        const promo = await getPromoSettings();
        const rejection = evaluatePromo({
          settings: promo,
          enteredCode: input.code,
          phone: input.phone,
          hasPreviousOrder: false,
        });
        if (rejection) {
          return { valid: false as const, message: PROMO_REJECTION_MESSAGES[rejection] };
        }
        return { valid: true as const, discountPercent: promo.discountPercent };
      }),

    // Сырые настройки (с шаблоном текста) для формы в админке
    adminGet: adminProcedure.query(async () => getPromoSettings()),

    update: adminProcedure
      .input(
        z.object({
          enabled: z.boolean(),
          code: z
            .string()
            .transform(normalizeCode)
            .pipe(z.string().min(3, "Код — минимум 3 символа").max(50)),
          discountPercent: z.number().int().min(1, "Скидка от 1%").max(90, "Скидка не больше 90%"),
          bannerText: z.string().trim().min(1, "Введите текст баннера").max(255),
        })
      )
      .mutation(async ({ input }) => {
        await updatePromoSettings(input);
        return { success: true };
      }),
  }),

  // Запись визита (вызывается с фронтенда при загрузке главной)
  visit: router({
    record: publicProcedure.mutation(async () => {
      await recordVisit();
      return { success: true };
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
        const systemPrompt = `Ты — Амира, AI-консультант магазина Amor Skincare (Казахстан, Уральск и Аксай).

СТРОГОЕ ПРАВИЛО: упоминай ТОЛЬКО бренды из этого списка, никаких других:

Rejuran, SKIN1004, Anua, Medicube, Round Lab, Biodance, Celimax, Torriden, Genosys, AXIS-Y, rom&nd, Unleashia, VT, Manyo, Zeroid, By Wishtrend, Tocobo, Klairs, Dr.Althea, Beauty of Joseon, Laneige, Medi-Peel, TIRTIR, JMSolution, Davines, Babor, TIGI, Insight, Rausch, Marvis, La Sultane de Saba, Sen Sulu, Ederra, Just, Solomeya, Angiopharm, Embrace, Kamali, Vivienne Sabo, Maybelline, Dior, Holifrog, Paula's Choice, Hourglass, Rare Beauty, Charlotte Tilbury, Anastasia Beverly Hills.

Если не знаешь точного товара — направь в WhatsApp: +7 777 477 97 79

О магазине:
- Уральск: ТРЦ Атриум, Аксай: Asia Plaza
- WhatsApp: +7 777 477 97 79
- Пн-Вс 10:00–21:00, оплата Kaspi/наличные, доставка по городу

Правила ответа:
- Отвечай кратко (3-5 предложений максимум)
- Рекомендуй конкретные бренды ИЗ СПИСКА выше под тип кожи/проблему
- Никогда не придумывай бренды и товары которых нет в списке
- Для уточнения цен и наличия направляй в WhatsApp
- Отвечай только на русском языке`;

        const response = await invokeLLM({
          messages: [{ role: "system", content: systemPrompt }, ...input.messages],
        });

        const rawContent = response.choices[0]?.message?.content;
        const content =
          typeof rawContent === "string"
            ? rawContent
            : "Извините, не могу ответить прямо сейчас. Напишите нам в WhatsApp: +7 777 477 97 79";

        return { content };
      }),
  }),
});

export type AppRouter = typeof appRouter;
