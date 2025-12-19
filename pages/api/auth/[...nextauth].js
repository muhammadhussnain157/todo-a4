import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDb from '../../../lib/connectDb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
    debug: false,
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                await connectDb();
                const user = await User.findOne({ email: credentials.email });
                if (!user) {
                    throw new Error('No user found with this email');
                }
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error('Invalid password');
                }
                return { id: user._id.toString(), email: user.email, name: user.name };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
    useSecureCookies: false,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: { signIn: '/auth/login' },
    secret: process.env.NEXTAUTH_SECRET || 'e0232e2e423724a78deeea88d021aee0d9ec43c3f39bb994e421582381c338fe',
};

export default NextAuth(authOptions);
