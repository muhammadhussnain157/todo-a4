import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDb from '../../../lib/connectDb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

// Simple in-memory rate limiting for session endpoint
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per 10 seconds per IP

function checkRateLimit(ip) {
    const now = Date.now();
    const windowData = rateLimitMap.get(ip);
    
    if (!windowData || now - windowData.startTime > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { startTime: now, count: 1 });
        return true;
    }
    
    if (windowData.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    
    windowData.count++;
    return true;
}

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
        if (now - data.startTime > RATE_LIMIT_WINDOW * 2) {
            rateLimitMap.delete(ip);
        }
    }
}, 30000);

const authOptions = {
    debug: process.env.NODE_ENV === 'development',
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

async function handler(req, res) {
    // Get client IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.socket?.remoteAddress || 
               'unknown';
    
    // Check if this is a session request (the problematic endpoint)
    const isSessionRequest = req.url?.includes('/session') || 
                            req.query?.nextauth?.includes('session');
    
    // Apply rate limiting only to session requests
    if (isSessionRequest && !checkRateLimit(ip)) {
        console.log(`Rate limited IP: ${ip}`);
        return res.status(429).json({ 
            error: 'Too many requests', 
            message: 'Please wait before making another request' 
        });
    }
    
    return NextAuth(req, res, authOptions);
}

export default handler;
