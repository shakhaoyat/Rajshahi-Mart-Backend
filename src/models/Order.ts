import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderItem {
  productId: Types.ObjectId;
  sellerId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  buyerId: string;
  buyerEmail: string;
  items: IOrderItem[];
  amountTotal: number;
  currency: string;
  status: OrderStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    buyerId: { type: String, required: true, index: true },
    buyerEmail: { type: String, required: true },
    items: [orderItemSchema],
    amountTotal: { type: Number, required: true }, // in dollars
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    stripeSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
