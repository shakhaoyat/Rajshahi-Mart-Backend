import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db("rajshahimart");

// Better Auth owns the `user` / `session` / `account` collections.
// We extend the user schema with a `role` field so every account
// carries buyer | seller | admin from signup onward.
export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.BETTER_AUTH_URL as string,
  trustedOrigins: [process.env.CLIENT_URL as string],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "buyer", // buyer | seller | admin
        input: true, // allow client to set it at signup (e.g. "I'm a seller")
      },
      profilePicture: {
        type: "string",
        required: false,
        defaultValue: "", // URL of profile picture; empty means use default avatar
        input: true, // allow client to set it at signup and update
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
  advanced: {
    crossSubDomainCookies: { enabled: false },
  },
});

export { client, db };
