/**
 * The insurers shown in the comparison list.
 *
 * These are the real companies in the Iranian market, because a comparison screen listing
 * invented names is impossible to evaluate. **No commercial relationship with any of them
 * exists yet** — every rate in this repository is a placeholder, and the UI says so. If that
 * ever becomes a problem before partnerships are signed, swapping this one file is the fix.
 *
 * `solvencyLevel` is سطح توانگری مالی (1 strongest … 5 weakest) and `claimSatisfaction` is a
 * 0–100 score. Both are PLACEHOLDER values, not published figures.
 */
export interface InsurerSeed {
  slug: string
  name: string
  solvencyLevel: number
  claimSatisfaction: number
  branchCount: number
  sortWeight: number
}

export const INSURERS: InsurerSeed[] = [
  { slug: 'pasargad', name: 'بیمه پاسارگاد', solvencyLevel: 1, claimSatisfaction: 88, branchCount: 320, sortWeight: 1 },
  { slug: 'saman', name: 'بیمه سامان', solvencyLevel: 1, claimSatisfaction: 85, branchCount: 210, sortWeight: 2 },
  { slug: 'karafarin', name: 'بیمه کارآفرین', solvencyLevel: 1, claimSatisfaction: 83, branchCount: 180, sortWeight: 3 },
  { slug: 'dey', name: 'بیمه دی', solvencyLevel: 2, claimSatisfaction: 79, branchCount: 240, sortWeight: 4 },
  { slug: 'alborz', name: 'بیمه البرز', solvencyLevel: 2, claimSatisfaction: 77, branchCount: 260, sortWeight: 5 },
]
