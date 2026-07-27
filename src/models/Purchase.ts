import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchase extends Document {
  userId: string; // reference to Better Auth user id
  userName: string;
  userEmail: string;
  productId: number; // from DummyJSON
  productTitle: string;
  productImage: string;
  price: number;
  purchasedAt: Date;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

const purchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    productId: { type: Number, required: true },
    productTitle: { type: String, required: true },
    productImage: { type: String, required: true },
    price: { type: Number, required: true },
    purchasedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Purchase: Model<IPurchase> = mongoose.model<IPurchase>("Purchase", purchaseSchema);
export default Purchase;