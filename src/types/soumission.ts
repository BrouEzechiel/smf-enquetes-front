import { ReponseRequest, ReponseResponse } from './reponse';

export interface SoumissionRequest {
    enqueteId: string;
    reponses: ReponseRequest[];
}

export interface SoumissionResponse {
    id: string;
    enqueteId: string;
    dateSoumission: string;
    reponses: ReponseResponse[];
}