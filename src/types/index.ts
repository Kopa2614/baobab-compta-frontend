export interface Entreprise {
  id: string;
  nom: string;
  secteur_activite?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  ninea?: string;
  registre_commerce?: string;
  logo_url?: string;
  tva_taux_defaut: number;
  devise: string;
}

export interface Utilisateur {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  role: 'gerant' | 'employe' | 'comptable' | 'super_admin';
  actif: boolean;
  entreprise_id: string | null;
  entreprise?: Entreprise;
  derniere_connexion?: string | null;
}

export interface EntrepriseAdmin extends Entreprise {
  actif: boolean;
  created_at: string;
  utilisateurs_count: number;
  clients_count: number;
  fournisseurs_count: number;
  factures_count: number;
  utilisateurs?: Utilisateur[];
}

export interface Client {
  id: string;
  code: string;
  nom: string;
  prenom?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  solde_du: number;
  date_derniere_op?: string;
  actif: boolean;
  notes?: string;
  factures?: Facture[];
  devis?: Devis[];
}

export interface Fournisseur {
  id: string;
  code: string;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  solde_dette: number;
  date_dernier_paiement?: string;
  actif: boolean;
  compte?: { id: string; numero: string; intitule: string };
}

export interface FactureLigne {
  id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  tva_taux: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  ordre?: number;
}

export interface Facture {
  id: string;
  numero: string;
  client?: Client;
  client_id?: string;
  date_emission: string;
  date_echeance?: string;
  statut: 'impayee' | 'partielle' | 'payee' | 'annulee';
  montant_ht: number;
  tva_taux: number;
  montant_tva: number;
  montant_ttc: number;
  montant_paye: number;
  montant_restant: number;
  notes?: string;
  lignes?: FactureLigne[];
}

export interface CompteBancaire {
  id: string;
  nom: string;
  numero_compte?: string;
  banque?: string;
  solde_initial: number;
  solde_actuel: number;
  actif: boolean;
}

export interface Caisse {
  id: string;
  nom: string;
  solde_initial: number;
  solde_actuel: number;
  actif: boolean;
}

export interface OperationTresorerie {
  id: string;
  type_operation: 'entree' | 'sortie' | 'virement_interne';
  source: 'banque' | 'caisse';
  date_operation: string;
  description: string;
  montant: number;
  mode_paiement: string;
  solde_apres?: number;
  facture?: Facture;
  facture_id?: string;
  compte_bancaire?: CompteBancaire;
  compte_bancaire_id?: string;
  caisse?: Caisse;
  caisse_id?: string;
}

export interface Produit {
  id: string;
  code?: string;
  nom: string;
  description?: string;
  prix_unitaire: number;
  tva_taux: number;
  unite?: string;
  actif: boolean;
}

export interface CategorieFrais {
  id: string;
  nom: string;
  description?: string;
}

export interface FraisGeneraux {
  id: string;
  date_frais: string;
  description: string;
  montant: number;
  tva_montant: number;
  tva_recuperable: boolean;
  mode_paiement: string;
  categorie?: CategorieFrais;
  compte_bancaire?: CompteBancaire;
  caisse?: Caisse;
}

export interface JournalEcriture {
  id: string;
  date_ecriture: string;
  libelle: string;
  numero_piece?: string;
  montant: number;
  compte_debit?: { id: string; numero: string; intitule: string };
  compte_credit?: { id: string; numero: string; intitule: string };
}

export interface KpisDashboard {
  ca_mois_courant: number;
  factures_emises: number;
  factures_impayees: number;
  total_creances: number;
  total_dettes: number;
  solde_tresorerie: number;
  tva_a_payer: number;
  factures_par_statut: {
    impayee: number;
    partielle: number;
    payee: number;
    annulee: number;
  };
  dernieres_operations: OperationTresorerie[];
}

export interface EvolutionPoint {
  mois: string;
  ca: number;
  charges: number;
}

export interface RapportMensuel {
  date_debut: string;
  date_fin: string;
  ca: number;
  charges: number;
  resultat_net: number;
}

export interface DevisLigne {
  id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  tva_taux: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  ordre?: number;
}

export interface Devis {
  id: string;
  numero: string;
  client?: Client;
  client_id?: string;
  date_emission: string;
  date_validite?: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'converti';
  montant_ht: number;
  tva_taux: number;
  montant_tva: number;
  montant_ttc: number;
  notes?: string;
  lignes?: DevisLigne[];
  facture_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
