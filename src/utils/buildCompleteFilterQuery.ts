import type { FilterState } from '../store/filterStore';

/**
 * Pure helper – receives an **immutable snapshot** of the filter state
 * and returns a parametrised SQL WHERE fragment.
 */
export const buildCompleteFilterQuery = ({
  startDate,
  endDate,
  selectedBrands,
  selectedRegions,
  minConfidence,
}: Readonly<FilterState>): string => {
  const clauses: string[] = [];
  if (startDate && endDate)
    clauses.push(`interaction_date BETWEEN '${startDate}T00:00:00Z' AND '${endDate}T23:59:59Z'`);
  if (selectedBrands.length)
    clauses.push(`brand IN (${selectedBrands.map(b => `'${b}'`).join(',')})`);
  if (selectedRegions.length)
    clauses.push(`region IN (${selectedRegions.map(r => `'${r}'`).join(',')})`);
  if (minConfidence !== undefined) clauses.push(`nlp_confidence_score >= ${minConfidence}`);

  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
};
