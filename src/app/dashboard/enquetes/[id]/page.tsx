"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Layers, Edit, Trash2, Calendar, FileText, X, HelpCircle, BarChart3, QrCode, ExternalLink, Copy, Printer } from 'lucide-react';
import api from '@/services/api';
import { Enquete } from '@/types';

export default function DetailsEnquetePage() {
    const params = useParams();
    const id = params.id as string;

    const [enquete, setEnquete] = useState<Enquete | null>(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [urlPublique, setUrlPublique] = useState('');

    // --- ÉTATS : MODALE SECTION ---
    const [modalSectionOuverte, setModalSectionOuverte] = useState(false);
    const [sectionIdEdition, setSectionIdEdition] = useState<string | null>(null);
    const [nomSection, setNomSection] = useState('');
    const [descriptionSection, setDescriptionSection] = useState('');
    const [enAttenteSection, setEnAttenteSection] = useState(false);
    const [erreurSection, setErreurSection] = useState('');

    // --- ÉTATS : MODALE QUESTION ---
    const [modalQuestionOuverte, setModalQuestionOuverte] = useState(false);
    const [questionIdEdition, setQuestionIdEdition] = useState<string | null>(null);
    const [sectionIdActive, setSectionIdActive] = useState('');
    const [texteQuestion, setTexteQuestion] = useState('');
    const [typeQuestion, setTypeQuestion] = useState('ECHELLE_LIKERT_5');
    const [categorieKpi, setCategorieKpi] = useState('AUCUNE');
    const [optionsSaisie, setOptionsSaisie] = useState(''); // NOUVEAU : Pour les choix QCM
    const [enAttenteQuestion, setEnAttenteQuestion] = useState(false);
    const [erreurQuestion, setErreurQuestion] = useState('');

    const chargerDetails = async () => {
        try {
            const reponse = await api.get<Enquete>(`/enquetes/${id}`);
            setEnquete(reponse.data);
        } catch (err: any) {
            console.error("Erreur de chargement:", err);
            setErreur("Impossible de charger les détails de cette enquête.");
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => {
        if (id) {
            chargerDetails();
            const port = window.location.port ? `:${window.location.port}` : '';
            setUrlPublique(`http://${window.location.hostname}${port}/enquete/${id}`);
        }
    }, [id]);

    const copierLien = () => {
        navigator.clipboard.writeText(urlPublique);
        alert("Le lien du questionnaire a été copié !");
    };

    const imprimerQrCode = () => {
        const fenetreImpression = window.open('', '_blank');
        if (!fenetreImpression) return;

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlPublique)}`;
        fenetreImpression.document.write(`
            <html>
                <head>
                    <title>Imprimer QR Code - ${enquete?.departement?.nom}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; margin: 0; }
                        h1 { color: #1e3a8a; margin-bottom: 5px; font-size: 24px; }
                        h2 { color: #4b5563; font-size: 18px; margin-bottom: 30px; }
                        img { max-width: 300px; height: auto; margin-bottom: 20px; }
                        .footer { margin-top: 20px; font-size: 14px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <h1>Scannez pour donner votre avis</h1>
                    <h2>Service : ${enquete?.departement?.nom}</h2>
                    <img src="${qrUrl}" alt="QR Code" />
                    <p class="footer">Merci de nous aider à améliorer nos services.</p>
                    <script>
                        window.onload = function() {
                            setTimeout(function() { window.print(); }, 500);
                        };
                        window.onafterprint = function() { window.close(); };
                    </script>
                </body>
            </html>
        `);
        fenetreImpression.document.close();
    };

    // --- GESTION SECTIONS ---
    const ouvrirModalAjoutSection = () => {
        setSectionIdEdition(null);
        setNomSection('');
        setDescriptionSection('');
        setErreurSection('');
        setModalSectionOuverte(true);
    };

    const ouvrirModalEditionSection = (section: any) => {
        setSectionIdEdition(section.id);
        setNomSection(section.nom);
        setDescriptionSection(section.description || '');
        setErreurSection('');
        setModalSectionOuverte(true);
    };

    const soumettreSection = async (e: React.FormEvent) => {
        e.preventDefault();
        setErreurSection('');
        setEnAttenteSection(true);
        try {
            if (sectionIdEdition) {
                await api.put(`/sections/${sectionIdEdition}`, { nom: nomSection, description: descriptionSection, ordre: 1 });
            } else {
                const ordreCalcule = enquete?.sections ? enquete.sections.length + 1 : 1;
                await api.post(`/sections/enquete/${id}`, { nom: nomSection, description: descriptionSection, ordre: ordreCalcule, questions: [] });
            }
            setModalSectionOuverte(false);
            await chargerDetails();
        } catch (err: any) {
            setErreurSection(err.response?.data?.message || "Erreur lors de l'enregistrement de la section.");
        } finally {
            setEnAttenteSection(false);
        }
    };

    const supprimerSection = async (sectionId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette section ?")) return;
        try {
            await api.delete(`/sections/${sectionId}`);
            await chargerDetails();
        } catch (err: any) {
            alert(err.response?.data?.message || "Impossible de supprimer cette section.");
        }
    };

    // --- GESTION QUESTIONS ---
    const ouvrirModalAjoutQuestion = (sectionId: string) => {
        setQuestionIdEdition(null);
        setSectionIdActive(sectionId);
        setTexteQuestion('');
        setTypeQuestion('ECHELLE_LIKERT_5');
        setCategorieKpi('AUCUNE');
        setOptionsSaisie(''); // Réinitialiser les options
        setErreurQuestion('');
        setModalQuestionOuverte(true);
    };

    const ouvrirModalEditionQuestion = (q: any) => {
        setQuestionIdEdition(q.id);
        setTexteQuestion(q.texte);
        setTypeQuestion(q.type);
        setCategorieKpi(q.categorieKpi || 'AUCUNE');
        // Convertir le tableau d'options en chaîne pour l'édition
        setOptionsSaisie(q.options ? q.options.join(', ') : '');
        setErreurQuestion('');
        setModalQuestionOuverte(true);
    };

    const soumettreQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setErreurQuestion('');
        setEnAttenteQuestion(true);

        // Transformation de la chaîne d'options en tableau de chaînes propres
        const optionsArray = typeQuestion === 'CHOIX_UNIQUE'
            ? optionsSaisie.split(',').map(opt => opt.trim()).filter(opt => opt !== '')
            : [];

        if (typeQuestion === 'CHOIX_UNIQUE' && optionsArray.length < 2) {
            setErreurQuestion("Veuillez saisir au moins 2 options séparées par des virgules.");
            setEnAttenteQuestion(false);
            return;
        }

        try {
            const payload = {
                texte: texteQuestion,
                type: typeQuestion,
                categorieKpi: categorieKpi,
                options: optionsArray // Ajout des options au payload
            };

            if (questionIdEdition) {
                // Pour l'édition on garde l'ordre existant
                const qExistante = enquete?.sections.flatMap(s => s.questions).find(q => q.id === questionIdEdition);
                await api.put(`/questions/${questionIdEdition}`, { ...payload, ordre: qExistante?.ordre || 1 });
            } else {
                const sectionActuelle = enquete?.sections.find(s => s.id === sectionIdActive);
                const ordreCalcule = sectionActuelle?.questions ? sectionActuelle.questions.length + 1 : 1;
                await api.post(`/questions/section/${sectionIdActive}`, { ...payload, ordre: ordreCalcule });
            }
            setModalQuestionOuverte(false);
            await chargerDetails();
        } catch (err: any) {
            setErreurQuestion(err.response?.data?.message || "Erreur lors de l'enregistrement de la question.");
        } finally {
            setEnAttenteQuestion(false);
        }
    };

    const supprimerQuestion = async (questionId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette question ?")) return;
        try {
            await api.delete(`/questions/${questionId}`);
            await chargerDetails();
        } catch (err: any) {
            alert(err.response?.data?.message || "Impossible de supprimer cette question.");
        }
    };

    // Fonction utilitaire pour formater le texte du type de question
    const formatTypeAffichage = (type: string) => {
        switch (type) {
            case 'ECHELLE_LIKERT_5': return 'Échelle de satisfaction (1 à 5)';
            case 'CHOIX_UNIQUE': return 'Choix unique (QCM)';
            case 'ECHELLE_NOTE_10': return 'Note globale (0 à 10)';
            case 'HEURE': return 'Heure / Horaire';
            case 'TEXTE_LIBRE': return 'Texte libre (Commentaire)';
            default: return type;
        }
    };

    if (chargement) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

    if (erreur || !enquete) return (
        <div className="min-h-screen p-8 text-center bg-gray-50">
            <p className="text-red-500 font-medium">{erreur}</p>
            <Link href="/dashboard/enquetes" className="mt-4 inline-block text-blue-600 hover:underline">Retour aux enquêtes</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8 relative">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* EN-TÊTE */}
                <div className="mb-6">
                    <Link href="/dashboard/enquetes" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Retour à la liste
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{enquete.titre}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-semibold">
                                    {enquete.departement.nom}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" /> Clôture le : {new Date(enquete.dateCloture).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/dashboard/enquetes/${id}/resultats`} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 font-semibold rounded-lg shadow-sm hover:bg-green-100 transition-colors">
                                <BarChart3 className="h-4 w-4" /> Voir les Résultats
                            </Link>
                            <button onClick={ouvrirModalAjoutSection} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                                <Plus className="h-4 w-4" /> Ajouter une Section
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* STRUCTURE DU QUESTIONNAIRE */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-blue-600" /> Structure du Questionnaire
                        </h2>

                        {enquete.sections && enquete.sections.length > 0 ? (
                            <div className="space-y-6">
                                {[...enquete.sections].sort((a, b) => a.ordre - b.ordre).map((section) => (
                                    <div key={section.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-gray-800">Section {section.ordre} : {section.nom}</h3>
                                                {section.description && <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>}
                                            </div>
                                            <div className="flex gap-2 text-gray-400">
                                                <button onClick={() => ouvrirModalEditionSection(section)} className="hover:text-blue-600 transition-colors" title="Modifier la section"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => supprimerSection(section.id)} className="hover:text-red-600 transition-colors" title="Supprimer la section"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            {section.questions && section.questions.length > 0 ? (
                                                <div className="space-y-3 mb-4">
                                                    {[...section.questions].sort((a, b) => a.ordre - b.ordre).map((q) => (
                                                        <div key={q.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                                    <HelpCircle className="h-4 w-4 text-blue-500" /> {q.ordre}. {q.texte}
                                                                </p>
                                                                <span className="text-xs text-gray-500 ml-6 mt-1 block">
                                                                    Type : {formatTypeAffichage(q.type)}

                                                                    {q.type === 'CHOIX_UNIQUE' && q.options && (
                                                                        <span className="block mt-1 text-gray-400 italic">
                                                                            Choix : {q.options.join(', ')}
                                                                        </span>
                                                                    )}

                                                                    {q.categorieKpi && q.categorieKpi !== 'AUCUNE' && (
                                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                                                            KPI: {q.categorieKpi}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-2 text-gray-400 shrink-0 ml-4">
                                                                <button onClick={() => ouvrirModalEditionQuestion(q)} className="hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                                                <button onClick={() => supprimerQuestion(q.id)} className="hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic text-center py-4">Aucune question dans cette section.</p>
                                            )}
                                            <button
                                                onClick={() => ouvrirModalAjoutQuestion(section.id)}
                                                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm font-semibold text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
                                            >
                                                + Ajouter une question à cette section
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">Aucune section pour le moment</h3>
                                <p className="text-sm text-gray-500 mt-1 mb-4">Commencez par créer une section pour y ajouter des questions.</p>
                            </div>
                        )}
                    </div>

                    {/* COLONNE LATÉRALE : QR CODE & DESCRIPTION */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-blue-600" /> Accès Patient & Partage
                            </h3>
                            {urlPublique && (
                                <div className="flex justify-center mb-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlPublique)}`} alt="QR Code" className="w-32 h-32 object-contain mix-blend-multiply" />
                                </div>
                            )}
                            <div className="space-y-3">
                                <a href={urlPublique} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors">
                                    <ExternalLink className="h-4 w-4" /> Ouvrir la page patient
                                </a>
                                <button onClick={copierLien} className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                    <Copy className="h-4 w-4" /> Copier le lien
                                </button>
                                <button onClick={imprimerQrCode} className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                    <Printer className="h-4 w-4" /> Imprimer le QR Code
                                </button>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">Description</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{enquete.description || "Aucune description fournie."}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALE AJOUT / ÉDITION SECTION --- */}
            {modalSectionOuverte && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">{sectionIdEdition ? 'Modifier la section' : 'Nouvelle Section'}</h3>
                            <button onClick={() => setModalSectionOuverte(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={soumettreSection} className="p-6">
                            {erreurSection && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">{erreurSection}</div>}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom de la section <span className="text-red-500">*</span></label>
                                    <input type="text" required value={nomSection} onChange={(e) => setNomSection(e.target.value)} placeholder="Ex: Section A - Accueil et orientation" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description <span className="text-gray-400 font-normal text-xs">(Optionnel)</span></label>
                                    <textarea rows={3} value={descriptionSection} onChange={(e) => setDescriptionSection(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalSectionOuverte(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
                                <button type="submit" disabled={enAttenteSection} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70">{enAttenteSection ? 'Enregistrement...' : (sectionIdEdition ? 'Modifier' : 'Créer la section')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE AJOUT / ÉDITION QUESTION --- */}
            {modalQuestionOuverte && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">{questionIdEdition ? 'Modifier la question' : 'Nouvelle Question'}</h3>
                            <button onClick={() => setModalQuestionOuverte(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={soumettreQuestion} className="p-6">
                            {erreurQuestion && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">{erreurQuestion}</div>}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Texte de la question <span className="text-red-500">*</span></label>
                                    <textarea required rows={2} value={texteQuestion} onChange={(e) => setTexteQuestion(e.target.value)} placeholder="Ex: Quel est votre sexe ?" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Type de réponse attendue <span className="text-red-500">*</span></label>
                                    <select required value={typeQuestion} onChange={(e) => setTypeQuestion(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                                        <option value="ECHELLE_LIKERT_5">Échelle de satisfaction (1 à 5)</option>
                                        <option value="CHOIX_UNIQUE">Choix unique (QCM / Options)</option>
                                        <option value="ECHELLE_NOTE_10">Note globale (0 à 10)</option>
                                        <option value="HEURE">Saisie d'horaire (Heure)</option>
                                        <option value="TEXTE_LIBRE">Champ texte libre (Commentaire)</option>
                                    </select>
                                </div>

                                {/* NOUVEAU : Champ dynamique pour les choix multiples */}
                                {typeQuestion === 'CHOIX_UNIQUE' && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <label className="block text-sm font-bold text-blue-900 mb-1">
                                            Options de réponse <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-blue-700 mb-2">Séparez chaque option par une virgule (ex: Masculin, Féminin)</p>
                                        <input
                                            type="text"
                                            required
                                            value={optionsSaisie}
                                            onChange={(e) => setOptionsSaisie(e.target.value)}
                                            placeholder="Radiographie, Échographie, Scanner..."
                                            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Associer à un indicateur MSIS <span className="text-gray-400 font-normal text-xs">(Optionnel)</span></label>
                                    <select value={categorieKpi} onChange={(e) => setCategorieKpi(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                                        <option value="AUCUNE">Standard (Ne pas comptabiliser dans le tableau)</option>
                                        <option value="ACCUEIL">Qualité de l'Accueil</option>
                                        <option value="ATTENTE">Temps et Conditions d'attente</option>
                                        <option value="PRISE_EN_CHARGE">Prise en charge médicale</option>
                                        <option value="RECOMMANDATION">Recommandation du service</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalQuestionOuverte(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
                                <button type="submit" disabled={enAttenteQuestion} className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-70">
                                    {enAttenteQuestion ? 'Enregistrement...' : (questionIdEdition ? 'Modifier' : 'Ajouter la question')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}