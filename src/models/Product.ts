import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  sellerId: string;
  sellerName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    category: { type: String, default: "other", index: true },
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);
export default Product;
