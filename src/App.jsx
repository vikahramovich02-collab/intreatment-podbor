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
   Плюс ветка safety, если в чате прозвучал кризис. */
export default function App() {
  const [screen, setScreen] = useState("chat");
  const [order, setOrder] = useState(null);
  const [holdStartedAt, setHoldStartedAt] = useState(null);
  const [account, setAccount] = useState(null);
  const [payment, setPayment] = useState(null);

  const restart = () => {
    setScreen("chat");
    setOrder(null);
    setHoldStartedAt(null);
    setAccount(null);
    setPayment(null);
  };

  if (screen === "safety") return <SafetyScreen onBack={() => setScreen("chat")} />;

  if (screen === "register")
    return (
      <RegisterScreen
        order={order}
        holdStartedAt={holdStartedAt}
        onBack={() => setScreen("chat")}
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
        onEnter={() => setScreen("cabinet")}
        onRestart={restart}
      />
    );

  if (screen === "cabinet")
    return (
      <CabinetScreen
        order={order}
        payment={payment}
        holdStartedAt={holdStartedAt}
        onPay={() => setScreen("checkout")}
        onRestart={restart}
      />
    );

  return (
    <ChatScreen
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
  );
}
