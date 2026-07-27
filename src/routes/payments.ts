import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const router = Router();

interface CartItem {
  productId: string;
  quantity: number;
}

// Buyer: create a Stripe Checkout Session for a cart
router.post("/checkout", requireAuth, requireRole("buyer", "admin"), async (req: Request, res: Response) => {
  try {
    const items: CartItem[] = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems: {
      productId: string;
      sellerId: string;
      title: string;
      price: number;
      quantity: number;
    }[] = [];
    let amountTotal = 0;

    for (const cartItem of items) {
      const product = products.find((p) => p._id.toString() === cartItem.productId);
      if (!product) continue;
      const quantity = Math.max(1, cartItem.quantity || 1);

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: product.title },
          unit_amount: Math.round(product.price * 100),
        },
        quantity,
      });

      orderItems.push({
        productId: product._id.toString(),
        sellerId: product.sellerId,
        title: product.title,
        price: product.price,
        quantity,
      });

      amountTotal += product.price * quantity;
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ error: "No valid products in cart" });
    }

    const order = await Order.create({
      buyerId: req.user!.id,
      buyerEmail: req.user!.email,
      items: orderItems,
      amountTotal,
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: req.user!.email,
      success_url: `${process.env.CLIENT_URL}/checkout/success?order=${order._id}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
      metadata: { orderId: order._id.toString() },
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Stripe webhook — must receive the RAW body, so it's mounted with
// express.raw() here and wired up in server.ts BEFORE express.json().
router.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        status: "paid",
        stripePaymentIntentId: session.payment_intent as string,
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { status: "failed" });
    }
  }

  res.json({ received: true });
});

export default router;
