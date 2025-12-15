import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import classes from '../../styles/Auth.module.css';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/auth/signup', {
                name,
                email,
                password,
            });

            if (response.status === 201) {
                // Redirect to login page instead of auto login (align with test expectations)
                router.push('/auth/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign Up - Todo App</title>
            </Head>
            <div className={classes.container}>
                <div className={classes.card}>
                    <div className={classes.header}>
                        <h1>Create Account</h1>
                        <p>Start managing your todos today</p>
                    </div>
                    <form onSubmit={handleSubmit} className={classes.form}>
                        {error && <div className={classes.error}>{error}</div>}
                        <div className={classes.formGroup}>
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="Enter your name"
                            />
                        </div>
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
                                placeholder="Enter your password (min 6 characters)"
                                minLength={6}
                            />
                        </div>
                        <button type="submit" className={classes.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>
                    <div className={classes.footer}>
                        <p>
                            Already have an account?{' '}
                            <Link href="/auth/login" passHref>
                                <span className={classes.link}>Sign in</span>
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

Signup.displayName = 'AuthPage';
export default Signup;
