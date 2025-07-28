import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
// import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Temporary admin user bypass (for development/demo purposes)
        if (credentials.email === "YAdmin" && credentials.password === "AZEqsd1234#") {
          return {
            id: "admin-temp-id",
            email: "YAdmin",
            name: "Administrator",
            role: "ADMIN",
          }
        }

        try {
          // Database lookup is disabled when Prisma is unavailable
          // const user = await prisma.user.findUnique({
          //   where: {
          //     email: credentials.email
          //   }
          // })

          // if (!user) {
          //   return null
          // }

          // const isPasswordValid = await bcrypt.compare(
          //   credentials.password,
          //   user.password || ""
          // )

          // if (!isPasswordValid) {
          //   return null
          // }

          // return {
          //   id: user.id,
          //   email: user.email,
          //   name: user.name,
          //   role: user.role,
          // }
          
          // For now, when Prisma is not available, only allow admin login
          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})

export { handler as GET, handler as POST }