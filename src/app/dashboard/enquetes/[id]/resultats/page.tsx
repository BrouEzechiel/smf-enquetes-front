"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Users, MessageSquare, FileText, Download, Clock } from 'lucide-react';
import api from '@/services/api';
import { Enquete, Indicateur } from '@/types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export default function ResultatsEnquetePage() {
    const params = useParams();
    const id = params.id as string;

    const [enquete, setEnquete] = useState<Enquete | null>(null);
    const [indicateurs, setIndicateurs] = useState<Record<string, Indicateur>>({});
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [exportEnCours, setExportEnCours] = useState(false);

    useEffect(() => {
        const chargerDonnees = async () => {
            try {
                const reponseEnquete = await api.get<Enquete>(`/enquetes/${id}`);
                const dataEnquete = reponseEnquete.data;
                setEnquete(dataEnquete);

                const stats: Record<string, Indicateur> = {};

                for (const section of dataEnquete.sections) {
                    for (const question of section.questions) {
                        try {
                            const resStats = await api.get<Indicateur>(`/reponses/question/${question.id}/indicateurs`);
                            stats[question.id] = resStats.data;
                        } catch (e) {
                            console.warn(`Pas encore de réponses pour la question ${question.id}`);
                        }
                    }
                }
                setIndicateurs(stats);
            } catch (err) {
                setErreur("Impossible de charger les statistiques.");
            } finally {
                setChargement(false);
            }
        };

        if (id) chargerDonnees();
    }, [id]);

    // --- FONCTION EXPORT EXCEL MISE À JOUR ---
    const exporterExcel = () => {
        if (!enquete) return;

        const donneesExcel: any[] = [];

        enquete.sections.forEach(section => {
            section.questions.forEach(q => {
                const stat = indicateurs[q.id];
                if (!stat || stat.totalReponses === 0) return;

                // Gestion des graphiques (Likert, QCM, Note)
                if (q.type === 'ECHELLE_LIKERT_5' || q.type === 'CHOIX_UNIQUE' || q.type === 'ECHELLE_NOTE_10') {
                    Object.entries(stat.repartitionParValeur).forEach(([valeur, count]) => {
                        donneesExcel.push({
                            "Section": section.nom,
                            "Question": q.texte,
                            "Type": q.type === 'ECHELLE_NOTE_10' ? "Note sur 10" : (q.type === 'CHOIX_UNIQUE' ? "QCM" : "Échelle"),
                            "Réponse / Note": valeur,
                            "Nombre de votes": count,
                            "Pourcentage": `${stat.pourcentageParValeur[valeur]}%`,
                            "Total Participants": stat.totalReponses
                        });
                    });
                }
                // Gestion des textes libres
                else if (q.type === 'TEXTE_LIBRE' && stat.reponsesTextes) {
                    stat.reponsesTextes.forEach(texte => {
                        donneesExcel.push({
                            "Section": section.nom,
                            "Question": q.texte,
                            "Type": "Texte Libre",
                            "Réponse / Note": texte,
                            "Nombre de votes": 1,
                            "Pourcentage": "-",
                            "Total Participants": stat.totalReponses
                        });
                    });
                }
                // Gestion des Heures
                else if (q.type === 'HEURE') {
                    Object.entries(stat.repartitionParValeur).forEach(([valeur, count]) => {
                        donneesExcel.push({
                            "Section": section.nom,
                            "Question": q.texte,
                            "Type": "Horaire",
                            "Réponse / Note": valeur,
                            "Nombre de votes": count,
                            "Pourcentage": "-",
                            "Total Participants": stat.totalReponses
                        });
                    });
                }
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(donneesExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Analyses");
        XLSX.writeFile(workbook, `Rapport_Excel_${enquete.titre.replace(/\s+/g, '_')}.xlsx`);
    };

    const exporterPDF = async () => {
        const element = document.getElementById('zone-impression-pdf');
        if (!element || !enquete) return;

        setExportEnCours(true);
        try {
            const dataUrl = await toPng(element, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });

            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (img.height * pdfWidth) / img.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const base64PDF = pdf.output('datauristring');
            const lien = document.createElement('a');
            lien.href = base64PDF;
            lien.download = `Rapport_PDF_${enquete.titre.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(lien);
            lien.click();
            document.body.removeChild(lien);

        } catch (error) {
            console.error("Erreur lors de la génération du PDF", error);
            alert("Erreur lors de la génération du PDF.");
        } finally {
            setExportEnCours(false);
        }
    };

    if (chargement) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    if (erreur || !enquete) return (
        <div className="min-h-screen p-8 text-center bg-gray-50">
            <p className="text-red-500 font-medium">{erreur}</p>
            <Link href={`/dashboard/enquetes/${id}`} className="mt-4 text-blue-600 hover:underline">Retour à l'enquête</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <Link href={`/dashboard/enquetes/${id}`} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Retour à la configuration
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-blue-700" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Rapport d'Analyse</h1>
                                <p className="text-sm text-gray-500">{enquete.titre}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exporterExcel}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 font-semibold rounded-lg shadow-sm hover:bg-green-100 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Excel
                        </button>
                        <button
                            onClick={exporterPDF}
                            disabled={exportEnCours}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-lg shadow-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            <FileText className="h-4 w-4" />
                            {exportEnCours ? 'Génération...' : 'PDF'}
                        </button>
                    </div>
                </div>

                <div id="zone-impression-pdf" className="space-y-8 bg-gray-50 p-2 rounded-xl">
                    {enquete.sections.sort((a, b) => a.ordre - b.ordre).map((section) => (
                        <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6">{section.nom}</h2>
                            <div className="space-y-10">
                                {section.questions.sort((a, b) => a.ordre - b.ordre).map((q) => {
                                    const stat = indicateurs[q.id];

                                    if (!stat || stat.totalReponses === 0) {
                                        return (
                                            <div key={q.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="font-semibold text-gray-900">{q.ordre}. {q.texte}</p>
                                                <p className="text-sm text-gray-500 mt-2">Aucune donnée disponible pour cette question.</p>
                                            </div>
                                        );
                                    }

                                    // Préparation des données pour l'affichage des barres
                                    let entreesGraphique = Object.entries(stat.pourcentageParValeur);

                                    // Si c'est une note sur 10, on trie de la meilleure note (10) à la pire (0)
                                    if (q.type === 'ECHELLE_NOTE_10') {
                                        entreesGraphique = entreesGraphique.sort((a, b) => Number(b[0]) - Number(a[0]));
                                    }

                                    return (
                                        <div key={q.id} className="break-inside-avoid">
                                            <div className="flex justify-between items-end mb-4">
                                                <p className="font-semibold text-gray-900 w-3/4">{q.ordre}. {q.texte}</p>
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                                    <Users className="h-4 w-4" /> {stat.totalReponses} avis
                                                </span>
                                            </div>

                                            {/* GRAPHIQUE EN BARRES (Likert, QCM, Notes) */}
                                            {(q.type === 'ECHELLE_LIKERT_5' || q.type === 'CHOIX_UNIQUE' || q.type === 'ECHELLE_NOTE_10') && (
                                                <div className="space-y-3">
                                                    {entreesGraphique.map(([valeur, pourcentage]) => (
                                                        <div key={valeur} className="relative">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="font-medium text-gray-700">
                                                                    {q.type === 'ECHELLE_NOTE_10' ? `Note : ${valeur}/10` : valeur}
                                                                </span>
                                                                <span className="text-gray-500">{pourcentage}% ({stat.repartitionParValeur[valeur]} votes)</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                                                <div
                                                                    className="bg-blue-500 h-2.5 rounded-full"
                                                                    style={{ width: `${pourcentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* HEURES (Affichage sous forme d'étiquettes) */}
                                            {q.type === 'HEURE' && (
                                                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-blue-500" /> Horaires renseignés :
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(stat.repartitionParValeur)
                                                            .sort((a, b) => a[0].localeCompare(b[0])) // Tri chronologique
                                                            .map(([heure, count]) => (
                                                                <span key={heure} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm flex items-center gap-2">
                                                                    {heure}
                                                                    {count > 1 && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 rounded">x{count}</span>}
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TEXTE LIBRE */}
                                            {q.type === 'TEXTE_LIBRE' && (
                                                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4 text-blue-500" />
                                                        Commentaires laissés par les patients :
                                                    </h4>

                                                    {stat.reponsesTextes && stat.reponsesTextes.length > 0 ? (
                                                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                            {stat.reponsesTextes.map((texte, index) => (
                                                                <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-sm text-gray-700 relative">
                                                                    <span className="absolute top-2 left-2 text-gray-200 text-2xl font-serif">"</span>
                                                                    <p className="pl-5 italic relative z-10">{texte}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic text-center py-4">
                                                            Aucun commentaire n'a été laissé pour cette question.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}