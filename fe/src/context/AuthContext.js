import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false); // Thêm flag này
    const [loading, setLoading] = useState(true); // Thêm loading để chống nhấp nháy F5


    const getProfile = async (currentToken) => {
        if (!currentToken) return null;

        try {
            const response = await fetch("http://localhost:9999/api/users/my-profile", {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + currentToken,
                },
                credentials: "include",
                cache: "no-store",
            });

            if (!response.ok) {
                logout();
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();
            const userData = data.user || data;
            setUser(userData);

            const complete = !!(userData.phone && userData.gender && userData.dateOfBirth);
            setIsProfileComplete(complete);

            return data;
        } catch (error) {
            console.error("Lỗi lấy profile:", error);
            return null;
        }
    };

    useEffect(() => {
        const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (savedToken) {
            setToken(savedToken);
            getProfile(savedToken).finally(() => setLoading(false)); // Xong thì tắt loading
        } else {
            setLoading(false);
        }
    }, []);


    const login = async (newToken, remember) => {
        if(remember)
        {
            localStorage.setItem("token", newToken);
        }
        else{
            sessionStorage.setItem("token", newToken)
        }
        setToken(newToken);
        await getProfile(newToken);
    };

    // 4. Hàm Logout
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setIsProfileComplete(false);
    };

    return (
        <AuthContext.Provider value={{ token, user, isProfileComplete, setIsProfileComplete, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}