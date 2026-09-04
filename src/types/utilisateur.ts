import { Departement } from './departement';

export enum Role {
    ADMIN = 'ADMIN',
    MEDECIN = 'MEDECIN',
    TECHNICIEN = 'TECHNICIEN',
    AGENT_ACCUEIL = 'AGENT_ACCUEIL'
}

export interface Utilisateur {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: Role;
    departement: Departement;
}

export interface AuthRequest {
    email: string;
    motDePasse: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    email: string;
    role: Role;
}