export interface Question {
    id: string;
    texte: string;
    type: string;
    ordre: number;
    categorieKpi?: string;
    options?: string[]; // NOUVEAU : Pour stocker les choix (Masculin, Féminin, etc.)
}