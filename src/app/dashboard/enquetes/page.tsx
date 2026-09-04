"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, ArrowLeft, Activity } from 'lucide-react';
import { Enquete } from '@/types';
import api from '@/services/api';

export default function GestionEnquetesPage() {
    const [enquetes, setEnquetes] = useState<Enquete[]>([]);
    const [chargement, setChargement] = useState(true);
    const [recherche, setRecherche] = useState('');

    const chargerEnquetes = async () => {
        try {
            setChargement(true);
            const reponse = await api.get<Enquete[]>('/enquetes');
            setEnquetes(reponse.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des enquêtes :", error);
            setEnquetes([]);
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        chargerEnquetes();
    }, []);

    // Fonction pour supprimer une enquête
    const supprimerEnquete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette enquête ?")) return;
        try {
            await api.delete(`/enquetes/${id}`);
            // Actualise la liste locale sans recharger la page
            setEnquetes(enquetes.filter(e => e.id !== id));
        } catch (error: any) {
            alert(error.response?.data?.message || "Impossible de supprimer cette enquête (des soumissions de patients y sont rattachées).");
        }
    };

    // Filtrage des enquêtes selon la barre de recherche
    const enquetesFiltrees = enquetes.filter(enquete =>
        enquete.titre.toLowerCase().includes(recherche.toLowerCase()) ||
        enquete.departement.nom.toLowerCase().includes(recherche.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* En-tête avec bouton retour et actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-2"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Retour au tableau de bord
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Gestion des Enquêtes</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Créez, modifiez et analysez les questionnaires du SMF.
                        </p>
                    </div>

                    <Link
                        href="/dashboard/enquetes/nouvelle"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Nouvelle Enquête
                    </Link>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher par titre ou département..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tableau des données */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Titre & Département
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Date de création
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {chargement ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                                            <p className="mt-2 text-sm text-gray-500">Chargement des enquêtes...</p>
                                        </td>
                                    </tr>
                                ) : enquetesFiltrees.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                                            Aucune enquête trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    enquetesFiltrees.map((enquete) => (
                                        <tr key={enquete.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <Link href={`/dashboard/enquetes/${enquete.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                                                        {enquete.titre}
                                                    </Link>
                                                    <span className="text-xs text-gray-500">{enquete.departement.nom}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(enquete.dateCreation).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${enquete.active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {enquete.active && <Activity className="h-3 w-3" />}
                                                    {enquete.active ? 'Active' : 'Clôturée'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    {/* Bouton Modifier redirige vers la page de détails/structure */}
                                                    <Link href={`/dashboard/enquetes/${enquete.id}`} className="text-blue-600 hover:text-blue-900 transition-colors" title="Modifier / Gérer">
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    {/* Bouton Supprimer connecté à l'API */}
                                                    <button onClick={() => supprimerEnquete(enquete.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Supprimer">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}