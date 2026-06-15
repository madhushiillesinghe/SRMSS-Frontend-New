// src/utils/sessionManager.ts
class SessionManager {
    private static readonly ACCESS_TOKEN_KEY = 'accessToken';
    private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
    private static readonly USER_KEY = 'user';

    static setAccessToken(token: string): void {
        if (token && token !== 'undefined' && token !== 'null') {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
        }
    }

    static getAccessToken(): string | null {
        const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        // Don't return invalid tokens
        if (token === 'undefined' || token === 'null') {
            this.clearSession();
            return null;
        }
        return token;
    }

    static setRefreshToken(token: string): void {
        if (token && token !== 'undefined' && token !== 'null') {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
        }
    }

    static getRefreshToken(): string | null {
        const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        if (token === 'undefined' || token === 'null') {
            return null;
        }
        return token;
    }

    static setUser(user: any): void {
        if (user && user !== 'undefined' && user !== 'null') {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
    }

    static getUser(): any | null {
        const user = localStorage.getItem(this.USER_KEY);
        if (user && user !== 'undefined' && user !== 'null') {
            try {
                return JSON.parse(user);
            } catch {
                return null;
            }
        }
        return null;
    }

    static isLoggedIn(): boolean {
        const token = this.getAccessToken();
        return !!token && token !== 'undefined' && token !== 'null';
    }

    static clearSession(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.clear();
    }
}

export default SessionManager;