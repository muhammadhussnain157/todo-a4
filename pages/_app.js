import { SessionProvider } from 'next-auth/react';
import Layout from '../components/layout/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
    // Don't wrap auth pages in Layout
    const isAuthPage = Component.displayName === 'AuthPage';

    return (
        <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
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
