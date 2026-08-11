import { Mark } from "./icons.jsx";
import { money } from "../lib/format.js";

/* Выбранный в попапе материал приходит в ленту как сообщение от InTreatment —
   дальше он покупается тем же путём, что и сессия. */
export default function ProductCard({ product, onBuy, time }) {
  return (
    <article className="msg rec">
      <div className="msg__head">
        <span className="msg__head-avatar">
          <Mark />
        </span>
        <b className="msg__head-name">InTreatment</b>
      </div>

      <div className="rec__card">
        <div className="rec__head">
          <b className="rec__name">{product.title}</b>
          <span className="rec__role">
            {product.kind} · {product.meta}
          </span>
        </div>

        <div className="rec__bottom">
          <div className="rec__col">
            <p className="rec__about">{product.about}</p>
            <p className="rec__about product__for">{product.forWhom}</p>
          </div>

          <button
            className="btn btn--primary btn--sm"
            type="button"
            onClick={() => onBuy(product)}
          >
            Забрать за {money(product.price)}
          </button>
        </div>
      </div>

      {time && <time className="msg__time">{time}</time>}
    </article>
  );
}
