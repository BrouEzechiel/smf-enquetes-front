export interface ReponseRequest {
    questionId: string;
    valeur: string;
}

export interface ReponseResponse {
    id: string;
    questionId: string;
    valeur: string;
}

export interface Indicateur {
    questionId: string;
    texteQuestion: string;
    repartitionParValeur: Record<string, number>;
    pourcentageParValeur: Record<string, number>;
    totalReponses: number;
    reponsesTextes?: string[];
}