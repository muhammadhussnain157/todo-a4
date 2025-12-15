import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import classes from '../../styles/Auth.module.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            callbackUrl: '/',
        });

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else if (result.ok) {
            // Wait a bit to ensure session is set before navigation
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push('/');
        }
    };

    return (
        <>
            <Head>
                <title>Login - Todo App</title>
            </Head>
            <div className={classes.container}>
                <div className={classes.card}>
                    <div className={classes.header}>
                        <h1>Welcome Back</h1>
                        <p>Sign in to manage your todos</p>
                    </div>
                    <form onSubmit={handleSubmit} className={classes.form}>
                        {error && <div className={classes.error}>{error}</div>}
                        <div className={classes.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className={classes.formGroup}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                minLength={6}
                            />
                        </div>
                        <button type="submit" className={classes.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                    <div className={classes.footer}>
                        <p>
                            Don&apos;t have an account?{' '}
                            <Link href="/auth/signup" passHref>
                                <span className={classes.link}>Sign up</span>
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

Login.displayName = 'AuthPage';
export default Login;
