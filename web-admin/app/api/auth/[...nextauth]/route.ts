import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const { handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Staff Portal",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/staff-login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email as string,
              password: credentials?.password as string,
            }),
          });

          if (!res.ok) return null;
          
          const user = await res.json();
          if (user && user.token) {
            return {
              id: user.token,
              name: user.name,
              email: credentials?.email as string,
              role: user.role,
              church: user.church,
              token: user.token
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.church = user.church;
        token.apiToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          role: token.role as string,
          church: token.church as string,
          apiToken: token.apiToken as string,
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/staff/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  }
});

// Explicitly export GET and POST from handlers for NextAuth v5
export const { GET, POST } = handlers;