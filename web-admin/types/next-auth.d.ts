import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      church?: string;
      apiToken?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    church?: string;
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    church?: string;
    apiToken?: string;
  }
}
