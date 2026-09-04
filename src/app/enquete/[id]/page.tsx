"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Shield, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { Enquete } from '@/types';

// Valeurs attendues par le backend (sans accent pour éviter les bugs SQL)
const VALEURS_LIKERT = [
    { label: "Très insatisfait", value: "Tres insatisfait" },
    { label: "Insatisfait", value: "Insatisfait" },
    { label: "Ni satisfait ni insatisfait", value: "Ni satisfait ni insatisfait" },
    { label: "Satisfait", value: "Satisfait" },
    { label: "Très satisfait", value: "Tres satisfait" }
];

export default function EnquetePatientPage() {
    const params = useParams();
    const id = params.id as string;

    const [enquete, setEnquete] = useState<Enquete | null>(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [reponses, setReponses] = useState<Record<string, string>>({});
    const [enAttente, setEnAttente] = useState(false);
    const [succes, setSucces] = useState(false);

    useEffect(() => {
        const chargerEnquete = async () => {
            try {
                const reponse = await api.get<Enquete>(`/enquetes/${id}`);
                const enqueteData = reponse.data;
                const dateCloture = new Date(enqueteData.dateCloture);
                const aujourdhui = new Date();

                if (!enqueteData.active || dateCloture < aujourdhui) {
                    setErreur("Ce questionnaire est actuellement clôturé.");
                } else {
                    setEnquete(enqueteData);
                }
            } catch (err) {
                setErreur("Impossible de charger le questionnaire.");
            } finally {
                setChargement(false);
            }
        };
        if (id) chargerEnquete();
    }, [id]);

    const gererChoix = (questionId: string, valeur: string) => {
        setReponses(prev => ({ ...prev, [questionId]: valeur }));
    };

    const soumettreQuestionnaire = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnAttente(true);
        try {
            const formatReponses = Object.entries(reponses).map(([questionId, valeur]) => ({
                questionId,
                valeur
            }));

            await api.post('/soumissions', {
                enqueteId: id,
                reponses: formatReponses
            });
            setSucces(true);
        } catch (err: any) {
            setErreur(err.response?.data?.message || "Erreur lors de l'envoi de vos réponses.");
            window.scrollTo(0, 0);
        } finally {
            setEnAttente(false);
        }
    };

    if (chargement) return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (succes) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-blue-100">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre retour !</h2>
                <p className="text-gray-600 mb-6">Vos réponses ont bien été enregistrées. Elles nous aideront à améliorer les services de la MUGEF-CI.</p>
                <button onClick={() => window.location.reload()} className="text-blue-600 font-semibold hover:underline">
                    Remplir une nouvelle évaluation
                </button>
            </div>
        </div>
    );

    if (erreur || !enquete) return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{erreur}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-blue-50 py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-t-2xl p-8 text-center border-b-[6px] border-blue-600 shadow-sm">
                    <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h1 className="text-3xl font-extrabold text-gray-900">{enquete.titre}</h1>
                    <p className="mt-3 text-gray-500 font-medium">{enquete.description}</p>
                    <div className="mt-4 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wide">
                        {enquete.departement.nom}
                    </div>
                </div>

                <form onSubmit={soumettreQuestionnaire} className="mt-6 space-y-8">
                    {enquete.sections.sort((a, b) => a.ordre - b.ordre).map((section) => (
                        <div key={section.id} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                            <h2 className="text-xl font-bold text-blue-900 border-b border-gray-100 pb-3 mb-6">
                                {section.nom}
                            </h2>
                            <div className="space-y-8">
                                {section.questions.sort((a, b) => a.ordre - b.ordre).map((q) => (
                                    <div key={q.id}>
                                        <label className="block text-base font-semibold text-gray-800 mb-4">
                                            {q.texte} <span className="text-red-500">*</span>
                                        </label>

                                        {/* 1. ÉCHELLE DE LIKERT */}
                                        {q.type === 'ECHELLE_LIKERT_5' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                                {VALEURS_LIKERT.map((item) => (
                                                    <label
                                                        key={item.value}
                                                        className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${reponses[q.id] === item.value
                                                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={q.id}
                                                            value={item.value}
                                                            required
                                                            className="sr-only"
                                                            onChange={() => gererChoix(q.id, item.value)}
                                                        />
                                                        <span className={`text-xs font-semibold text-center ${reponses[q.id] === item.value ? 'text-blue-700' : 'text-gray-600'
                                                            }`}>
                                                            {item.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* 2. CHOIX UNIQUE (QCM Démographique) */}
                                        {q.type === 'CHOIX_UNIQUE' && q.options && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {q.options.map((opt) => (
                                                    <label key={opt} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${reponses[q.id] === opt ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                                        <input
                                                            type="radio"
                                                            name={q.id}
                                                            value={opt}
                                                            required
                                                            className="mr-3 accent-blue-600"
                                                            onChange={() => gererChoix(q.id, opt)}
                                                        />
                                                        <span className={`text-sm font-semibold ${reponses[q.id] === opt ? 'text-blue-700' : 'text-gray-700'}`}>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* 3. NOTE SUR 10 */}
                                        {q.type === 'ECHELLE_NOTE_10' && (
                                            <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                                <span className="font-bold text-blue-600 text-3xl">
                                                    {reponses[q.id] ? reponses[q.id] : "5"} <span className="text-gray-400 text-xl">/ 10</span>
                                                </span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    required
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    onChange={(e) => gererChoix(q.id, e.target.value)}
                                                    defaultValue="5"
                                                />
                                                <div className="w-full flex justify-between text-xs text-gray-500 font-medium mt-1">
                                                    <span>0 (Très mauvaise)</span>
                                                    <span>10 (Excellente)</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 4. HEURE */}
                                        {q.type === 'HEURE' && (
                                            <input
                                                type="time"
                                                required
                                                className="w-full sm:w-1/3 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-medium text-gray-700"
                                                onChange={(e) => gererChoix(q.id, e.target.value)}
                                            />
                                        )}

                                        {/* 5. TEXTE LIBRE */}
                                        {q.type === 'TEXTE_LIBRE' && (
                                            <textarea
                                                required
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Votre réponse..."
                                                onChange={(e) => gererChoix(q.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={enAttente || Object.keys(reponses).length === 0}
                        className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {enAttente ? 'Envoi en cours...' : 'Envoyer mes réponses'}
                    </button>
                </form>
            </div>
        </div>
    );
}