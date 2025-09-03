import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface AuthToken {
    id: string;
    token: string;
    expiry: number;
}

interface Info {
    app: string;
    url?: string;
}

export const useAuth = () => {
    const [auth, setAuth] = useState<boolean>(false);
    const router = useRouter();
    const authUrl = process.env.AUTH_URL || '';

    const checkAuth = useCallback(async (token: string) => {
        const info: Info = {
            app: "ImageDojo",
            url: process.env.APP_URL,
        };

        try {
            if (token && JSON.parse(atob(token))) {
                const authTokenParse: AuthToken = JSON.parse(atob(token));
                if (Date.now() > authTokenParse.expiry) {
                    // Token expired, check with the API.
                    const response = await fetch(`${authUrl}/check/`, {
                        headers: { 'x-token': authTokenParse.token },
                    });
                    if (!response.ok) {
                        window.location.href = `${authUrl}?v=${btoa(JSON.stringify(info))}`;
                        return;
                    } else {
                        sessionStorage.setItem('authToken', token);
                        setAuth(true);
                    }
                } else {
                    // Token is still valid.
                    sessionStorage.setItem('authToken', token);
                    setAuth(true);
                }
            } else {
                throw new Error('Invalid token');
            }
        } catch (error) {
            sessionStorage.removeItem('authToken');
            window.location.href = `${authUrl}?v=${btoa(JSON.stringify(info))}`;
        }
    }, [authUrl]);

    useEffect(() => {
        if (!router.isReady) return;

        const token = (router.query.t as string) || sessionStorage.getItem('authToken');
        const authEnabled = process.env.AUTH === 'true' ? true : false;

        if (authEnabled) {
            if (token) {
                checkAuth(token);
                if (router.query.t) {
                    router.push('/');
                }
            } else {
                checkAuth('');
            }
        } else {
            setAuth(true);
            router.push('/');
        }

    }, [router.isReady, router.query.t, checkAuth]);

    return auth;
};