/**
 * Provincial capitals and the larger cities.
 *
 * `quakeZone` is 1 (highest seismic risk) to 4, and drives the earthquake add-on on home-fire
 * cover. These are **approximate placeholders** based on the general seismic picture, not the
 * official استاندارد ۲۸۰۰ zoning — that table must be sourced before real home-fire rates ship.
 */
export interface CitySeed {
  provinceFa: string
  nameFa: string
  quakeZone: number
}

export const CITIES: CitySeed[] = [
  { provinceFa: 'تهران', nameFa: 'تهران', quakeZone: 1 },
  { provinceFa: 'تهران', nameFa: 'ری', quakeZone: 1 },
  { provinceFa: 'تهران', nameFa: 'اسلامشهر', quakeZone: 1 },
  { provinceFa: 'البرز', nameFa: 'کرج', quakeZone: 1 },
  { provinceFa: 'اصفهان', nameFa: 'اصفهان', quakeZone: 3 },
  { provinceFa: 'اصفهان', nameFa: 'کاشان', quakeZone: 2 },
  { provinceFa: 'خراسان رضوی', nameFa: 'مشهد', quakeZone: 2 },
  { provinceFa: 'خراسان رضوی', nameFa: 'نیشابور', quakeZone: 2 },
  { provinceFa: 'فارس', nameFa: 'شیراز', quakeZone: 2 },
  { provinceFa: 'فارس', nameFa: 'مرودشت', quakeZone: 2 },
  { provinceFa: 'آذربایجان شرقی', nameFa: 'تبریز', quakeZone: 1 },
  { provinceFa: 'آذربایجان غربی', nameFa: 'ارومیه', quakeZone: 1 },
  { provinceFa: 'خوزستان', nameFa: 'اهواز', quakeZone: 3 },
  { provinceFa: 'خوزستان', nameFa: 'آبادان', quakeZone: 3 },
  { provinceFa: 'قم', nameFa: 'قم', quakeZone: 2 },
  { provinceFa: 'کرمانشاه', nameFa: 'کرمانشاه', quakeZone: 1 },
  { provinceFa: 'کرمان', nameFa: 'کرمان', quakeZone: 2 },
  { provinceFa: 'کرمان', nameFa: 'بم', quakeZone: 1 },
  { provinceFa: 'یزد', nameFa: 'یزد', quakeZone: 3 },
  { provinceFa: 'گیلان', nameFa: 'رشت', quakeZone: 2 },
  { provinceFa: 'مازندران', nameFa: 'ساری', quakeZone: 2 },
  { provinceFa: 'مازندران', nameFa: 'بابل', quakeZone: 2 },
  { provinceFa: 'گلستان', nameFa: 'گرگان', quakeZone: 2 },
  { provinceFa: 'همدان', nameFa: 'همدان', quakeZone: 2 },
  { provinceFa: 'اردبیل', nameFa: 'اردبیل', quakeZone: 1 },
  { provinceFa: 'زنجان', nameFa: 'زنجان', quakeZone: 2 },
  { provinceFa: 'قزوین', nameFa: 'قزوین', quakeZone: 1 },
  { provinceFa: 'مرکزی', nameFa: 'اراک', quakeZone: 2 },
  { provinceFa: 'لرستان', nameFa: 'خرم‌آباد', quakeZone: 1 },
  { provinceFa: 'کردستان', nameFa: 'سنندج', quakeZone: 2 },
  { provinceFa: 'هرمزگان', nameFa: 'بندرعباس', quakeZone: 2 },
  { provinceFa: 'بوشهر', nameFa: 'بوشهر', quakeZone: 2 },
  { provinceFa: 'سیستان و بلوچستان', nameFa: 'زاهدان', quakeZone: 2 },
  { provinceFa: 'سیستان و بلوچستان', nameFa: 'چابهار', quakeZone: 2 },
  { provinceFa: 'سمنان', nameFa: 'سمنان', quakeZone: 2 },
  { provinceFa: 'خراسان شمالی', nameFa: 'بجنورد', quakeZone: 2 },
  { provinceFa: 'خراسان جنوبی', nameFa: 'بیرجند', quakeZone: 3 },
  { provinceFa: 'چهارمحال و بختیاری', nameFa: 'شهرکرد', quakeZone: 2 },
  { provinceFa: 'کهگیلویه و بویراحمد', nameFa: 'یاسوج', quakeZone: 2 },
  { provinceFa: 'ایلام', nameFa: 'ایلام', quakeZone: 1 },
]
