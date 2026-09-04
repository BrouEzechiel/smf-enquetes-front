"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    LogOut, LayoutDashboard, Users, FileText, ArrowRight, Activity,
    TrendingUp, HeartHandshake, Clock, Stethoscope, BarChart, Calendar, Building2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import { Enquete } from '@/types';

export default function DashboardPage() {
    const { user, logout, isLoading } = useAuth();

    // États pour le volume (Enquêtes)
    const [stats, setStats] = useState({ total: 0, actives: 0 });
    const [derniereEnquete, setDerniereEnquete] = useState<Enquete | null>(null);

    // États pour la qualité (Indicateurs MSIS)
    const [kpis, setKpis] = useState({
        tauxAccueil: 0,
        tauxAttente: 0,
        tauxPriseEnCharge: 0,
        tauxRecommandation: 0
    });
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        const chargerDonnees = async () => {
            if (!user) return;
            try {
                // 1. Récupération des enquêtes
                const resEnquetes = await api.get<Enquete[]>('/enquetes');
                const enquetes = resEnquetes.data;

                setStats({
                    total: enquetes.length,
                    actives: enquetes.filter(e => e.active).length
                });

                if (enquetes.length > 0) {
                    const enquetesTriees = [...enquetes].sort((a, b) =>
                        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
                    );
                    setDerniereEnquete(enquetesTriees[0]);
                }

                // 2. Récupération des vrais indicateurs MSIS depuis votre DashboardController
                const resKpi = await api.get('/statistiques/kpi');
                setKpis(resKpi.data);

            } catch (error) {
                console.error("Erreur lors de la récupération des données :", error);
            } finally {
                setChargement(false);
            }
        };

        chargerDonnees();
    }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <LayoutDashboard className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-xl text-gray-900 tracking-tight">MUGEF-CI SMF</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-bold text-gray-900">{user.email}</span>
                                <span className="text-[10px] text-blue-700 font-bold px-2.5 py-0.5 bg-blue-100 rounded-full uppercase tracking-wider">
                                    {user.role}
                                </span>
                            </div>
                            <div className="h-8 w-px bg-gray-200 mx-2"></div>
                            <button
                                onClick={logout}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Pilotage MSIS</h1>
                        <p className="mt-2 text-base text-gray-500 max-w-2xl">
                            Indicateurs de suivi de la qualité de service en Imagerie Médicale.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/enquetes/nouvelle"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-all"
                    >
                        Nouvelle Évaluation
                    </Link>
                </div>

                {/* --- BLOC 1 : INDICATEURS QUALITÉ (MSIS) --- */}
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    Taux de satisfaction globale
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                            <HeartHandshake className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Accueil</p>
                            <p className="text-2xl font-bold text-gray-900">{chargement ? '-' : kpis.tauxAccueil}%</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                            <Clock className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Attente</p>
                            <p className="text-2xl font-bold text-gray-900">{chargement ? '-' : kpis.tauxAttente}%</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                            <Stethoscope className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Prise en charge</p>
                            <p className="text-2xl font-bold text-gray-900">{chargement ? '-' : kpis.tauxPriseEnCharge}%</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Recommandation</p>
                            <p className="text-2xl font-bold text-gray-900">{chargement ? '-' : kpis.tauxRecommandation}%</p>
                        </div>
                    </div>
                </div>

                {/* --- BLOC 2 : OPÉRATIONNEL --- */}
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activité du service
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Link href="/dashboard/enquetes" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><FileText className="h-6 w-6" /></div>
                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-600 transition-all" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Base de données</p>
                                <p className="text-xl font-bold text-gray-900">Gestion des {chargement ? '...' : stats.total} Enquêtes</p>
                            </div>
                        </Link>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                            <div className="flex items-start mb-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Activity className="h-6 w-6" /></div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Campagnes en cours</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-3xl font-extrabold text-gray-900">{chargement ? '-' : stats.actives}</p>
                                    <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">En ligne</span>
                                </div>
                            </div>
                        </div>

                        {/* Raccourci vers la gestion des départements */}
                        <Link
                            href="/dashboard/departements"
                            className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all hover:shadow-md hover:border-blue-200 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-600 transition-colors">
                                    <Building2 className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Structure</p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">Gérer les Départements</p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                        </Link>

                        {/* Raccourci vers la gestion des utilisateurs — réservé aux administrateurs */}
                        {user.role === 'ADMIN' && (
                            <Link
                                href="/dashboard/utilisateurs"
                                className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all hover:shadow-md hover:border-blue-200 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-teal-50 rounded-lg group-hover:bg-teal-600 transition-colors">
                                        <Users className="h-6 w-6 text-teal-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Accès & Sécurité</p>
                                        <p className="text-lg font-bold text-gray-900 mt-0.5">Gérer les Utilisateurs</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                            </Link>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Dernière création
                        </h2>
                        {chargement ? (
                            <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                        ) : derniereEnquete ? (
                            <div className="flex-1 flex flex-col">
                                <div className="mb-auto">
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{derniereEnquete.titre}</h3>
                                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md mb-4">{derniereEnquete.departement.nom}</span>
                                    <p className="text-sm text-gray-600 line-clamp-3">{derniereEnquete.description || "Aucune description."}</p>
                                </div>
                                <div className="pt-6 mt-6 border-t border-gray-100">
                                    <Link href={`/dashboard/enquetes/${derniereEnquete.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                        Gérer cette enquête <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <FileText className="h-10 w-10 text-gray-200 mb-3" />
                                <p className="text-sm text-gray-500">Aucune enquête n'a encore été créée.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}