import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Here you would call your Django REST API to verify credentials
        // e.g. const res = await fetch("https://api.ncfms.org/auth/login/", { ... })
        // const user = await res.json()
        
        // Mock success for now
        if (credentials?.email === "admin@ncfms.org" && credentials?.password === "password") {
          return { id: "1", name: "System Admin", email: "admin@ncfms.org", role: "CONFERENCE_ADMIN" }
        }
        
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
})
