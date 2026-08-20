/**
 * All money in the system is an integer count of RIAL. Never a float, never a string.
 * Tomans exist only at the UI edge: 1 Toman = 10 Rial.
 */
export type Rial = number

export const rialToToman = (rial: Rial): number => Math.round(rial / 10)
export const tomanToRial = (toman: number): Rial => Math.round(toman * 10)

/** Round to the nearest 1,000 Rial (100 Toman) — how Iranian premiums are actually quoted. */
export const roundPremium = (rial: Rial): Rial => Math.round(rial / 1000) * 1000
