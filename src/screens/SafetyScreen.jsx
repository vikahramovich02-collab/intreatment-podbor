import Header from "../components/Header.jsx";
import { ShieldIcon } from "../components/icons.jsx";

/* Показываем, если в чате прозвучало что-то про угрозу жизни.
   Подбор в этот момент останавливается — это осознанное решение, а не ошибка. */
export default function SafetyScreen({ onBack }) {
  return (
    <div className="app">
      <Header />

      <main className="funnel">
        <div className="column">
          <div className="done" role="alert">
            <div className="done__mark" aria-hidden="true">
              <ShieldIcon />
            </div>
            <h1 className="funnel__title">Похоже, сейчас вам может быть небезопасно</h1>
            <p className="funnel__sub" style={{ margin: "12px auto 0" }}>
              InTreatment не заменяет экстренную и кризисную помощь. Пожалуйста, не оставайтесь с
              этим в одиночестве.
            </p>

            <div className="done__card">
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                Если есть угроза жизни или здоровью — позвоните в экстренную службу вашего региона
                прямо сейчас. Если угрозы нет, но тяжело, — свяжитесь с человеком, которому
                доверяете, или с круглосуточной линией психологической помощи.
              </p>
            </div>

            <div className="done__actions">
              <button className="btn btn--primary btn--lg" type="button" onClick={onBack}>
                Вернуться к подбору
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
