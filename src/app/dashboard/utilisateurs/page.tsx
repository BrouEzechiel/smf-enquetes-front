"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Trash2, Edit, ArrowLeft, UserCircle, Shield, Building2 } from 'lucide-react';
import api from '@/services/api';
import { Departement } from '@/types';

interface Utilisateur {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    departement: Departement | null;
}

export default function GestionUtilisateursPage() {
    const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
    const [departements, setDepartements] = useState<Departement[]>([]);
    const [chargement, setChargement] = useState(true);

    // États du formulaire
    const [utilisateurIdEdition, setUtilisateurIdEdition] = useState<string | null>(null);
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [role, setRole] = useState('AGENT_ACCUEIL');
    const [departementId, setDepartementId] = useState('');

    const [enAttente, setEnAttente] = useState(false);
    const [erreur, setErreur] = useState('');

    const chargerDonnees = async () => {
        try {
            setChargement(true);
            const [resUsers, resDeps] = await Promise.all([
                api.get<Utilisateur[]>('/utilisateurs'),
                api.get<Departement[]>('/departements')
            ]);
            setUtilisateurs(resUsers.data);
            setDepartements(resDeps.data);

            if (resDeps.data.length > 0 && !departementId && !utilisateurIdEdition) {
                setDepartementId(resDeps.data[0].id);
            }
        } catch (error) {
            console.error("Erreur chargement des données:", error);
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        chargerDonnees();
    }, []);

    const soumettreUtilisateur = async (e: React.FormEvent) => {
        e.preventDefault();
        setErreur('');
        setEnAttente(true);

        try {
            const payload: any = {
                nom,
                prenom,
                email,
                role,
                departementId: departementId || null
            };

            // On n'envoie le mot de passe que s'il a été rempli (utile pour la modification)
            if (motDePasse) {
                payload.motDePasse = motDePasse;
            }

            if (utilisateurIdEdition) {
                await api.put(`/utilisateurs/${utilisateurIdEdition}`, payload);
            } else {
                // Pour la création, le mot de passe est obligatoire
                if (!motDePasse) {
                    setErreur("Le mot de passe est obligatoire pour la création.");
                    setEnAttente(false);
                    return;
                }
                await api.post('/utilisateurs', payload);
            }

            annulerEdition();
            await chargerDonnees();
        } catch (err: any) {
            setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement de l'utilisateur.");
        } finally {
            setEnAttente(false);
        }
    };

    const editerUtilisateur = (user: Utilisateur) => {
        setUtilisateurIdEdition(user.id);
        setNom(user.nom);
        setPrenom(user.prenom);
        setEmail(user.email);
        setRole(user.role);
        setDepartementId(user.departement ? user.departement.id : '');
        setMotDePasse(''); // On laisse vide par défaut pour ne pas l'écraser involontairement
        setErreur('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const annulerEdition = () => {
        setUtilisateurIdEdition(null);
        setNom('');
        setPrenom('');
        setEmail('');
        setMotDePasse('');
        setRole('AGENT_ACCUEIL');
        setDepartementId(departements.length > 0 ? departements[0].id : '');
        setErreur('');
    };

    const supprimerUtilisateur = async (id: string) => {
        if (!confirm("Voulez-vous vraiment désactiver/supprimer ce compte ?")) return;
        try {
            await api.delete(`/utilisateurs/${id}`);
            setUtilisateurs(utilisateurs.filter(u => u.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || "Impossible de supprimer cet utilisateur.");
        }
    };

    const formatRole = (roleEnum: string) => {
        switch (roleEnum) {
            case 'ADMIN': return 'Administrateur';
            case 'MEDECIN': return 'Médecin';
            case 'TECHNICIEN': return 'Technicien';
            case 'AGENT_ACCUEIL': return "Agent d'Accueil";
            default: return roleEnum;
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
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Créez, modifiez et attribuez des rôles au personnel.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Formulaire de création / édition */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            {utilisateurIdEdition ? (
                                <><Edit className="h-5 w-5 text-blue-600" /> Modifier le compte</>
                            ) : (
                                <><Plus className="h-5 w-5 text-blue-600" /> Nouveau Compte</>
                            )}
                        </h2>

                        {erreur && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">{erreur}</div>
                        )}

                        <form onSubmit={soumettreUtilisateur} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required value={nom} onChange={(e) => setNom(e.target.value)}
                                        placeholder="Ex: Diarrassouba"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Prénom <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required value={prenom} onChange={(e) => setPrenom(e.target.value)}
                                        placeholder="Ex: Yasmine"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email professionnel <span className="text-red-500">*</span></label>
                                <input
                                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@mugef-ci.ci"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Mot de passe {utilisateurIdEdition && <span className="text-xs text-gray-400 font-normal">(Laisser vide pour ne pas modifier)</span>}
                                    {!utilisateurIdEdition && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="text" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                                    placeholder={utilisateurIdEdition ? "Nouveau mot de passe..." : "Mot de passe sécurisé..."}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Rôle <span className="text-red-500">*</span></label>
                                <select
                                    value={role} onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white"
                                >
                                    <option value="AGENT_ACCUEIL">Agent d'Accueil</option>
                                    <option value="TECHNICIEN">Technicien</option>
                                    <option value="MEDECIN">Médecin</option>
                                    <option value="ADMIN">Administrateur système</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Service de rattachement</label>
                                <select
                                    value={departementId} onChange={(e) => setDepartementId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm bg-white disabled:bg-gray-100"
                                    disabled={departements.length === 0}
                                >
                                    <option value="">-- Aucun service spécifique --</option>
                                    {departements.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nom}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    type="submit" disabled={enAttente || (departements.length === 0 && role !== 'ADMIN')}
                                    className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {enAttente ? 'Enregistrement...' : (utilisateurIdEdition ? 'Enregistrer les modifications' : 'Créer le compte')}
                                </button>

                                {utilisateurIdEdition && (
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

                    {/* Liste des utilisateurs */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Personnel enregistré</h2>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {chargement ? (
                                <div className="p-8 text-center text-sm text-gray-500">Chargement des accès...</div>
                            ) : utilisateurs.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">Aucun utilisateur trouvé.</div>
                            ) : (
                                utilisateurs.map((user) => (
                                    <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-100 text-gray-600 rounded-full">
                                                <UserCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                    {user.prenom} {user.nom}
                                                    {user.role === 'ADMIN' && (
                                                        <span title="Privilèges Administrateur">
                                                            <Shield className="h-3.5 w-3.5 text-red-500" />
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs font-medium">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded uppercase tracking-wider">
                                                        {formatRole(user.role)}
                                                    </span>
                                                    {user.departement && (
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                            <Building2 className="h-3 w-3" />
                                                            {user.departement.nom}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => editerUtilisateur(user)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                                                title="Modifier"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => supprimerUtilisateur(user.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                                                title="Révoquer l'accès"
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