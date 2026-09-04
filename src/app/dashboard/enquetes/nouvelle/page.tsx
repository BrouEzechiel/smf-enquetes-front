"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { Departement } from '@/types';

export default function NouvelleEnquetePage() {
    const router = useRouter();

    // États du formulaire
    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [dateCloture, setDateCloture] = useState('');
    const [departementId, setDepartementId] = useState('');

    // États pour les données externes et l'UI
    const [departements, setDepartements] = useState<Departement[]>([]);
    const [enAttente, setEnAttente] = useState(false);
    const [erreur, setErreur] = useState('');

    // 1. Récupération des départements au chargement de la page
    useEffect(() => {
        const chargerDepartements = async () => {
            try {
                const reponse = await api.get<Departement[]>('/departements');
                setDepartements(reponse.data);
            } catch (error) {
                console.error("Erreur chargement départements:", error);
                setErreur("Impossible de charger la liste des départements.");
            }
        };
        chargerDepartements();
    }, []);

    // 2. Soumission du formulaire vers Spring Boot
    const soumettreFormulaire = async (e: React.FormEvent) => {
        e.preventDefault();
        setErreur('');

        if (!departementId) {
            setErreur("Veuillez sélectionner un département.");
            return;
        }

        setEnAttente(true);

        try {
            // Nous construisons l'objet attendu par votre DTO Spring Boot
            const nouvelleEnquete = {
                titre,
                description,
                dateCloture,
                // On envoie directement departementId, et on retire "active: true" car le backend s'en occupe
                departementId,
                sections: []
            };

            await api.post('/enquetes', nouvelleEnquete);

            // Si succès, retour au tableau des enquêtes
            router.push('/dashboard/enquetes');

        } catch (err: any) {
            setErreur(err.response?.data?.message || "Une erreur est survenue lors de la création.");
            setEnAttente(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8">
                    <Link
                        href="/dashboard/enquetes"
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Retour à la liste
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Créer une nouvelle enquête</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Définissez les informations générales du questionnaire.
                    </p>
                </div>

                {erreur && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">{erreur}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <form onSubmit={soumettreFormulaire} className="p-6 sm:p-8 space-y-6">

                        {/* Titre */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Titre de l'enquête <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={titre}
                                onChange={(e) => setTitre(e.target.value)}
                                placeholder="Ex: Satisfaction Patient - Consultation Générale"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Objectif de cette enquête..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Département (Liste déroulante) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Département ciblé <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={departementId}
                                    onChange={(e) => setDepartementId(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
                                >
                                    <option value="" disabled>Sélectionner un département</option>
                                    {departements.map((dep) => (
                                        <option key={dep.id} value={dep.id}>
                                            {dep.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date de clôture */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Date de clôture <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={dateCloture}
                                    onChange={(e) => setDateCloture(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                            <Link
                                href="/dashboard/enquetes"
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </Link>
                            <button
                                type="submit"
                                disabled={enAttente}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="h-5 w-5" />
                                {enAttente ? 'Enregistrement...' : 'Créer l\'enquête'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}