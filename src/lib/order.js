import { money } from "./format.js";

/* Заказ — то, что клиент оплачивает на платформе.
   Путь одинаковый для сессии и для продукта самопомощи:
   выбор → регистрация → личный кабинет → оплата. */

export const sessionOrder = ({ person, day, slot, name }) => ({
  kind: "session",
  person,
  day,
  slot,
  name,
  price: person.price,
  title: `Сессия с ${person.name}`,
  meta: `${day.label} в ${slot} · онлайн, 1 час`,
});

export const productOrder = (product) => ({
  kind: "product",
  product,
  price: product.price,
  title: product.title,
  meta: `${product.kind} · ${product.meta}`,
});

export const orderLine = (order) =>
  order.kind === "session" ? "Консультация, 1 час" : order.product.kind;

export const orderTotal = (order, discount = 0) => Math.round(order.price * (1 - discount));

export const orderPriceLabel = (order) => money(order.price);
