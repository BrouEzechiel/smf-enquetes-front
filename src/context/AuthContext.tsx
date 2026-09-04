"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';

// Définition des données de l'utilisateur stockées en session
interface User {
    email: string;
    role: Role;
}
// Définition des méthodes et variables disponibles dans le contexte
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, email: string, role: Role) => void;
    logout: () => void;
}

// Initialisation du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    // 1. Restauration de la session au chargement de l'application
    useEffect(() => {
        const token = Cookies.get('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false); // Fin du chargement initial
    }, []);

    // 2. Méthode de connexion
    const login = (token: string, email: string, role: Role) => {
        // Stockage du token dans les cookies (plus sécurisé pour les requêtes)
        Cookies.set('token', token, {
            expires: 1, // Expire dans 1 jour
            secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
            sameSite: 'strict', // Protection CSRF basique
        });

        // Stockage des infos non sensibles dans le localStorage pour l'affichage
        const userData = { email, role };
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);

        // Redirection vers le tableau de bord MSIS après connexion
        router.push('/dashboard');
    };

    // 3. Méthode de déconnexion
    const logout = () => {
        Cookies.remove('token');
        localStorage.removeItem('user');
        setUser(null);

        // Redirection vers la page de connexion
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. Hook personnalisé pour utiliser le contexte facilement
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
};