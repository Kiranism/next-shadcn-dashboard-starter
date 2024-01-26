import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import mongodb from "@/lib/mongodb";
import { Adapter } from "next-auth/adapters";
import { z } from "zod";
const credentialsSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(100),
});

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(mongodb) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username:",
          type: "text",
          placeholder: "Enter your username",
        },
        password: {
          label: "Password:",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(
        credentials) {
        const parsed = credentialsSchema.parse(credentials);

        const client = await mongodb;

        const user = await client
          .db()
          .collection("users")
          .findOne({ username: parsed.username });

        if (!user) {
          throw new Error("Username or password is incorrect");
        }

        const match = await bcrypt.compare(
          parsed.password!,
          user.password,
        );

        if (match) {
          return user;
        } else {
          throw new Error("Username or password is incorrect");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 3 * 24 * 60 * 60, // 3 days
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
