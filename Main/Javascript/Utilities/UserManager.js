const L_TOKEN_KEY = "l_token_key";
const JWT_TOKEN_KEY = "jwt_token_key";
const USERNAME_KEY = "username_key";

class UserManager {

    static isLoggedIn() {
        return this.lToken() !== null
            && this.jwtToken() !== null
            && this.username() !== null;
    }

    static username() {
        return localStorage.getItem(USERNAME_KEY) || null;
    }

    static jwtToken() {
        return localStorage.getItem(JWT_TOKEN_KEY) || null;
    }

    static lToken() {
        return localStorage.getItem(L_TOKEN_KEY) || null;
    }

    static setUsername(username) {
        localStorage.setItem(USERNAME_KEY, username);
    }

    static setJwtToken(token) {
        localStorage.setItem(JWT_TOKEN_KEY, token);
    }

    static setLToken(token) {
        localStorage.setItem(L_TOKEN_KEY, token);
    }

    static logout() {
        localStorage.removeItem(L_TOKEN_KEY);
        localStorage.removeItem(JWT_TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);
    }
}