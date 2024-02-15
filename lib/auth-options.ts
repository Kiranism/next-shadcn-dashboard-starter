import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialProvider from "next-auth/providers/credentials";

const adminEmails = ["admin@gmail.com", "hassan@gmail.com"];

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    CredentialProvider({
      credentials: {
        email: {
          label: "email",
          type: "email",
          placeholder: "example@gmail.com",
        },
      },
      async authorize(credentials, req) {
        const user = { id: "1", name: "Admin", email: credentials?.email };
        // Check if user exists and has an email
        if (user && user.email && adminEmails.includes(user.email)) {
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If the user or email is not in the adminEmails list, return null
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/", // signin page
  },
};
