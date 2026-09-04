import { Question } from './question';

export interface Section {
    id: string;
    nom: string;
    description: string;
    ordre: number;
    questions: Question[];
}