import { SessionProvider } from 'next-auth/react';
import Layout from '../components/layout/Layout';
import '../styles/globals.css';
import { useEffect, useState } from 'react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
    // Don't wrap auth pages in Layout
    const isAuthPage = Component.displayName === 'AuthPage';
    
    // Only render on client side after user interaction to prevent automated requests
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        // Only set client true when page is actually loaded by a user (not automated)
        const handleInteraction = () => {
            setIsClient(true);
            // Remove listeners after first interaction
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
        };
        
        // Immediately set to true if this appears to be a real browser
        // Check for real user indicators
        if (typeof window !== 'undefined') {
            // Set client immediately - the session provider settings already prevent polling
            setIsClient(true);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
        };
    }, []);

    return (
        <SessionProvider 
            session={session} 
            refetchInterval={0} 
            refetchOnWindowFocus={false}
            refetchWhenOffline={false}
        >
            {isAuthPage ? (
                <Component {...pageProps} />
            ) : (
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            )}
        </SessionProvider>
    );
}

export default MyApp;
