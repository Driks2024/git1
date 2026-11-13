/** Modelo de alcance potencial fornecido no briefing (estimativa, sem deduplicação). */
export const DENTISTS = 25000;
export const PATIENTS_PER_DENTIST_MONTH = 10;
export const DEPENDENTS_PER_PATIENT = 3;

export type ReachModel = {
  dentists: number;
  direct: number; // contatos diretos potenciais/mês
  indirect: number; // contatos indiretos potenciais/mês
  total: number; // exposições potenciais/mês
};

export function reach(
  dentists = DENTISTS,
  patientsPerDentist = PATIENTS_PER_DENTIST_MONTH,
  dependentsPerPatient = DEPENDENTS_PER_PATIENT,
): ReachModel {
  for (const [v, label] of [
    [dentists, 'dentistas'],
    [patientsPerDentist, 'pacientes por dentista'],
    [dependentsPerPatient, 'dependentes por paciente'],
  ] as const) {
    if (!Number.isFinite(v) || v < 0) throw new RangeError(`${label} inválido`);
  }
  const direct = dentists * patientsPerDentist;
  const indirect = direct * dependentsPerPatient;
  return { dentists, direct, indirect, total: direct + indirect };
}
