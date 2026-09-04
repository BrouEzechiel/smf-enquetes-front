"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Building2, Trash2, Edit, ArrowLeft } from 'lucide-react';
import api from '@/services/api';
import { Departement } from '@/types';

export default function GestionDepartementsPage() {
    const [departements, setDepartements] = useState<Departement[]>([]);
    const [chargement, setChargement] = useState(true);

    // États du formulaire
    const [departementIdEdition, setDepartementIdEdition] = useState<string | null>(null);
    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');

    // États d'interface
    const [enAttente, setEnAttente] = useState(false);
    const [erreur, setErreur] = useState('');

    const chargerDepartements = async () => {
        try {
            setChargement(true);
            const reponse = await api.get<Departement[]>('/departements');
            setDepartements(reponse.data);
        } catch (error) {
            console.error("Erreur chargement départements:", error);
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        chargerDepartements();
    }, []);

    // Fonction unifiée pour Créer ou Modifier
    const soumettreDepartement = async (e: React.FormEvent) => {
        e.preventDefault();
        setErreur('');
        setEnAttente(true);

        try {
            if (departementIdEdition) {
                // Modification
                await api.put(`/departements/${departementIdEdition}`, { nom, description });
            } else {
                // Création
                await api.post('/departements', { nom, description });
            }

            // Réinitialisation du formulaire après succès
            annulerEdition();
            await chargerDepartements();
        } catch (err: any) {
            setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement du département.");
        } finally {
            setEnAttente(false);
        }
    };

    const editerDepartement = (dep: Departement) => {
        setDepartementIdEdition(dep.id);
        setNom(dep.nom);
        setDescription(dep.description || '');
        setErreur('');
        // Fait défiler la page vers le haut pour voir le formulaire
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const annulerEdition = () => {
        setDepartementIdEdition(null);
        setNom('');
        setDescription('');
        setErreur('');
    };

    const supprimerDepartement = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce département ?")) return;
        try {
            await api.delete(`/departements/${id}`);
            setDepartements(departements.filter(d => d.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || "Impossible de supprimer ce département (des enquêtes y sont rattachées).");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-2">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Retour au tableau de bord
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Départements / Services</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Ajoutez, modifiez ou supprimez les services médicaux de la structure.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Formulaire de création / édition */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            {departementIdEdition ? (
                                <><Edit className="h-5 w-5 text-blue-600" /> Modifier le service</>
                            ) : (
                                <><Plus className="h-5 w-5 text-blue-600" /> Nouveau service</>
                            )}
                        </h2>

                        {erreur && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">{erreur}</div>
                        )}

                        <form onSubmit={soumettreDepartement} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du service <span className="text-red-500">*</span></label>
                                <input
                                    type="text" required value={nom} onChange={(e) => setNom(e.target.value)}
                                    placeholder="Ex: Cardiologie, Pédiatrie..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description <span className="text-gray-400 font-normal text-xs">(Optionnel)</span></label>
                                <textarea
                                    rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Description du service..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm resize-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    type="submit" disabled={enAttente}
                                    className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {enAttente ? 'Enregistrement...' : (departementIdEdition ? 'Enregistrer les modifications' : 'Ajouter le département')}
                                </button>

                                {departementIdEdition && (
                                    <button
                                        type="button" onClick={annulerEdition}
                                        className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        Annuler
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Liste des départements */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Liste des services existants</h2>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {chargement ? (
                                <div className="p-8 text-center text-sm text-gray-500">Chargement...</div>
                            ) : departements.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">Aucun département enregistré.</div>
                            ) : (
                                departements.map((dep) => (
                                    <div key={dep.id} className="p-6 flex items-start justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg mt-0.5">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-base">{dep.nom}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{dep.description || "Aucune description fournie."}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => editerDepartement(dep)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                                                title="Modifier"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => supprimerDepartement(dep.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}