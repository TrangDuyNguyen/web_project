import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import type { Provider } from 'next-auth/providers';

const providers: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account) {
        token.sub = account.providerAccountId;
        token.provider = account.provider;
      }
      if (profile && 'name' in profile && profile.name) token.name = profile.name;
      if (profile && 'email' in profile && profile.email) token.email = profile.email as string;
      if (profile && 'picture' in profile && profile.picture) token.picture = profile.picture as string;
      if (profile && 'avatar_url' in profile && profile.avatar_url) {
        token.picture = profile.avatar_url as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub && token.provider) {
        session.user.id = `${token.provider}:${token.sub}`;
      }
      return session;
    },
  },
  trustHost: true,
});
