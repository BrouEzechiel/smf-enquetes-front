"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { AuthResponse } from '@/types';
import { Lock, Mail, Shield } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [erreur, setErreur] = useState('');
    const [enAttente, setEnAttente] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const gererConnexion = async (e: React.FormEvent) => {
        e.preventDefault();
        setErreur('');
        setEnAttente(true);

        try {
            const reponse = await api.post<AuthResponse>('/auth/login', {
                email,
                motDePasse
            });
            login(reponse.data.token, reponse.data.email, reponse.data.role);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                setErreur("Identifiants incorrects. Veuillez réessayer.");
            } else {
                setErreur("Connexion au serveur impossible pour le moment.");
            }
        } finally {
            setEnAttente(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-blue-100">

                <div className="text-center mb-10">
                    <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-md">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">MUGEF-CI</h2>
                    <p className="mt-2 text-sm text-blue-600 font-semibold tracking-wide uppercase">
                        Plateforme des Enquêtes SMF
                    </p>
                </div>

                {erreur && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm rounded-r-md font-medium">
                        {erreur}
                    </div>
                )}

                <form onSubmit={gererConnexion} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Adresse Email Professionnelle
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-blue-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all sm:text-sm bg-gray-50 focus:bg-white"
                                placeholder=""
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-blue-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all sm:text-sm bg-gray-50 focus:bg-white"
                                placeholder="••••••••"
                                value={motDePasse}
                                onChange={(e) => setMotDePasse(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={enAttente}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {enAttente ? 'Authentification...' : 'Se connecter à l\'espace'}
                    </button>
                </form>
            </div>
        </div>
    );
}