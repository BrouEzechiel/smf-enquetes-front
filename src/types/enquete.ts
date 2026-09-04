import { Departement } from './departement';
import { Section } from './section';

export interface Enquete {
    id: string;
    titre: string;
    description: string;
    dateCreation: string;
    dateCloture: string;
    active: boolean;
    departement: Departement;
    sections: Section[];
}