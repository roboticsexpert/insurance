import { PageHeader } from '../components/PageHeader'

const FAQ = [
  {
    q: 'بیمه‌نامه را چطور تحویل می‌گیرم؟',
    a: 'بلافاصله بعد از پرداخت، بیمه‌نامه در حساب کاربری شما صادر می‌شود و از بخش «بیمه‌نامه‌های من» قابل مشاهده و دریافت است.',
  },
  {
    q: 'قیمت‌ها با خرید مستقیم از شرکت بیمه فرق دارد؟',
    a: 'خیر. نرخ‌ها همان نرخ مصوب شرکت بیمه است و بابت استفاده از این سامانه هزینه‌ای اضافه نمی‌شود.',
  },
  {
    q: 'اگر پرداخت انجام شد ولی بیمه‌نامه صادر نشد چه می‌شود؟',
    a: 'مبلغ پرداختی محفوظ است و پیگیری صدور به‌صورت خودکار انجام می‌شود. در صورت انصراف، وجه تا ۷۲ ساعت به حساب شما بازمی‌گردد.',
  },
]

export function SupportPage() {
  return (
    <div>
      <PageHeader title="پشتیبانی" subtitle="پاسخ سؤال‌های پرتکرار" />
      <div className="space-y-3 px-5">
        {FAQ.map(({ q, a }) => (
          <details
            key={q}
            className="rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-strong marker:hidden">
              {q}
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
