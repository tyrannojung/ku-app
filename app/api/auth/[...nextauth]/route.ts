import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"


const handler = NextAuth({
  secret: process.env.NAXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      // 이 부분은 자체 로그인 로직을 구현합니다.
      credentials: {
        id: { label: 'ID', type: 'text' },
        publicKey: { label: 'PublicKey',  type: 'text' }
      },


      async authorize(credentials, req) {
        const options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: credentials?.id,
            publicKey: credentials?.publicKey,
          }),
        }

        console.log(`user is ????======${process.env.MAIN_URL}`)
        const res = await fetch(`${process.env.MAIN_URL }api/member/signin`, options);
        const user = await res.json();

        if (user.result) {
          // Any object returned will be saved in `user` property of the JWT
          return user.value;
        } 
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },

    async session({ session, token }) {
      session.user = token as any;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },

});

export { handler as GET, handler as POST };