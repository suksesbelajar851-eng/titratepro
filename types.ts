export type Step = 
  | 'initial'
  | 'setup_apparatus'
  | 'add_hcl'
  | 'add_pp'
  | 'fill_buret'
  | 'titrating'
  | 'equivalence'
  | 'over_titrated';

export interface TitrationState {
  step: Step;
  volumeHCl: number; // in mL
  molarityHCl: number;
  volumeNaOH: number; // in mL
  molarityNaOH: number;
  ppAdded: boolean;
  isStirring: boolean;
  isTitrating: boolean;
  history: { volume: number; ph: number }[];
}
