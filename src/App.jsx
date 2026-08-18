import { useState } from "react";
import ChatScreen from "./screens/ChatScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import CheckoutScreen from "./screens/CheckoutScreen.jsx";
import DoneScreen from "./screens/DoneScreen.jsx";
import CabinetScreen from "./screens/CabinetScreen.jsx";
import SafetyScreen from "./screens/SafetyScreen.jsx";
import { sessionOrder, productOrder } from "./lib/order.js";

/* Путь до входа на платформу: chat → register → cabinet.
   Оплата происходит уже внутри платформы: cabinet → checkout → done → cabinet.
   Чат не размонтируется — иначе при возврате терялась бы вся история разговора. */
export default function App() {
  const [screen, setScreen] = useState("chat");
  const [order, setOrder] = useState(null);
  const [holdStartedAt, setHoldStartedAt] = useState(null);
  const [account, setAccount] = useState(null);
  const [payment, setPayment] = useState(null);
  const [reopen, setReopen] = useState(null); // просьба открыть карточку на расписании
  const [resetAt, setResetAt] = useState(0); // сброс чата на главную

  const goHome = () => {
    setScreen("chat");
    setOrder(null);
    setHoldStartedAt(null);
    setAccount(null);
    setPayment(null);
    setResetAt(Date.now());
  };

  /* Из регистрации возвращаемся к карточке специалиста, а не в пустоту */
  const backToCard = () => {
    setScreen("chat");
    if (order?.kind === "session") setReopen({ person: order.person, at: Date.now() });
  };

  const funnel = (() => {
    if (screen === "safety") return <SafetyScreen onBack={() => setScreen("chat")} />;
    if (screen === "register")
      return (
        <RegisterScreen
          order={order}
          holdStartedAt={holdStartedAt}
          onHome={goHome}
          onBack={backToCard}
          onDone={(user) => {
            setAccount(user);
            setScreen("cabinet");
          }}
        />
      );
    if (screen === "checkout")
      return (
        <CheckoutScreen
          order={order}
          holdStartedAt={holdStartedAt}
          account={account}
          onHome={goHome}
          onBack={() => setScreen("cabinet")}
          onPaid={(result) => {
            setPayment(result);
            setScreen("done");
          }}
        />
      );
    if (screen === "done")
      return (
        <DoneScreen
          order={order}
          payment={payment}
          account={account}
          onHome={goHome}
          onEnter={() => setScreen("cabinet")}
        />
      );
    if (screen === "cabinet")
      return (
        <CabinetScreen
          order={order}
          payment={payment}
          holdStartedAt={holdStartedAt}
          onHome={goHome}
          onPay={() => setScreen("checkout")}
          onRestart={goHome}
        />
      );
    return null;
  })();

  return (
    <>
      <div hidden={screen !== "chat"}>
        <ChatScreen
          reopen={reopen}
          resetAt={resetAt}
          onHome={goHome}
          onCrisis={() => setScreen("safety")}
          onLogin={() => order && setScreen("cabinet")}
          onBook={(next) => {
            setOrder(sessionOrder(next));
            setHoldStartedAt(Date.now());
            setScreen("register");
          }}
          onBuyProduct={(product) => {
            setOrder(productOrder(product));
            setHoldStartedAt(null);
            setScreen("register");
          }}
        />
      </div>
      {funnel}
    </>
  );
}
