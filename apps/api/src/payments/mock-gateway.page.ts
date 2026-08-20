import { toPersianDigits } from '../common/fa'

type PageProps =
  | { kind: 'not-found' }
  | {
      kind: 'form'
      authority: string
      amountFa: string
      productTitleFa: string
      insurerNameFa: string
      deadlineSeconds: number
    }

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )

const shell = (body: string): string => `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>درگاه پرداخت اینترنتی</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #eef1f5; color: #1f2733;
    font-family: Tahoma, "Segoe UI", system-ui, sans-serif;
    padding: 16px;
  }
  .card { width: 100%; max-width: 420px; background: #fff; border-radius: 14px;
          box-shadow: 0 10px 40px rgba(16,24,40,.10); overflow: hidden; }
  .top { background: #0f3d6e; color: #fff; padding: 14px 18px; display: flex;
         align-items: center; justify-content: space-between; }
  .top strong { font-size: 15px; }
  .sim { font-size: 11px; background: #ffd54f; color: #4a3b00; padding: 3px 8px; border-radius: 999px; }
  .rows { padding: 14px 18px; border-bottom: 1px solid #eceff3; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; font-size: 13px; }
  .row span:first-child { color: #6b7684; }
  .row span:last-child { font-weight: 700; }
  .amount { font-size: 17px; color: #0f3d6e; }
  form { padding: 16px 18px 18px; }
  label { display: block; font-size: 12px; color: #6b7684; margin: 10px 0 5px; }
  input { width: 100%; padding: 10px 12px; border: 1px solid #dfe4ea; border-radius: 8px;
          background: #f6f8fa; color: #55606d; font-family: inherit; font-size: 14px;
          letter-spacing: .06em; text-align: center; }
  .pair { display: flex; gap: 10px; }
  .note { margin: 12px 0 0; font-size: 11px; line-height: 1.9; color: #8b95a3; }
  .btns { display: grid; gap: 9px; margin-top: 16px; }
  button { padding: 13px; border: 0; border-radius: 9px; font-family: inherit; font-size: 14px;
           font-weight: 700; cursor: pointer; }
  .pay { background: #1e874b; color: #fff; }
  .fail { background: #fff; color: #b4232a; border: 1px solid #f0c4c6; }
  .cancel { background: transparent; color: #6b7684; }
  .timer { text-align: center; font-size: 12px; color: #6b7684; padding: 0 18px 14px; }
  .missing { padding: 32px 20px; text-align: center; }
</style>
</head>
<body><div class="card">${body}</div></body>
</html>`

export function renderMockGatewayPage(props: PageProps): string {
  if (props.kind === 'not-found') {
    return shell(
      `<div class="missing"><p><strong>تراکنش پیدا نشد</strong></p>
       <p style="font-size:13px;color:#6b7684">این نشانی معتبر نیست یا مهلت آن تمام شده است.</p></div>`,
    )
  }

  const { authority, amountFa, productTitleFa, insurerNameFa, deadlineSeconds } = props

  /*
   * The card fields are readonly with obviously fake values on purpose.
   *
   * A mock bank page that accepts card input is a liability: sooner or later somebody types a
   * real PAN into it during a demo, and it lands in a request log. The page needs to *look*
   * like Shaparak, not to collect anything.
   */
  return shell(`
    <div class="top">
      <strong>درگاه پرداخت اینترنتی</strong>
      <span class="sim">شبیه‌سازی</span>
    </div>

    <div class="rows">
      <div class="row"><span>پذیرنده</span><span>بیمه ۲۴۷</span></div>
      <div class="row"><span>بابت</span><span>${escapeHtml(productTitleFa)} — ${escapeHtml(insurerNameFa)}</span></div>
      <div class="row"><span>مبلغ</span><span class="amount">${escapeHtml(amountFa)}</span></div>
    </div>

    <form method="post" action="/mock-gateway/settle">
      <input type="hidden" name="authority" value="${escapeHtml(authority)}">

      <label>شماره کارت</label>
      <input readonly value="${toPersianDigits('6037-9911-2233-4455')}" tabindex="-1">

      <div class="pair">
        <div style="flex:1">
          <label>تاریخ انقضا</label>
          <input readonly value="${toPersianDigits('08/12')}" tabindex="-1">
        </div>
        <div style="flex:1">
          <label>CVV2</label>
          <input readonly value="${toPersianDigits('***')}" tabindex="-1">
        </div>
      </div>

      <p class="note">
        این صفحه یک شبیه‌سازی است و هیچ تراکنش واقعی انجام نمی‌شود. اطلاعات کارت غیرقابل ویرایش
        است و جایی ذخیره نمی‌شود.
      </p>

      <div class="btns">
        <button class="pay" name="outcome" value="PAID" type="submit">پرداخت موفق</button>
        <button class="fail" name="outcome" value="FAILED" type="submit">پرداخت ناموفق</button>
        <button class="cancel" name="outcome" value="CANCELLED" type="submit">انصراف و بازگشت</button>
      </div>
    </form>

    <p class="timer">زمان باقی‌مانده: <span id="t">${toPersianDigits('15:00')}</span></p>

    <script>
      (function () {
        var left = ${deadlineSeconds};
        var el = document.getElementById('t');
        var fa = function (n) { return String(n).replace(/[0-9]/g, function (d) {
          return String.fromCharCode(0x06f0 + Number(d)); }); };
        setInterval(function () {
          if (left <= 0) return;
          left -= 1;
          var m = Math.floor(left / 60), s = left % 60;
          el.textContent = fa(m + ':' + (s < 10 ? '0' + s : s));
        }, 1000);
      })();
    </script>
  `)
}
