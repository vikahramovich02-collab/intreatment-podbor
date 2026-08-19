import { Mark } from "./icons.jsx";

/* Выбранный в попапе материал приходит в ленту как сообщение от InTreatment —
   дальше он покупается тем же путём, что и сессия. */
export default function ProductCard({ product, time, onBuy }) {
  return (
    <article className="msg rec">
      <div className="msg__head">
        <span className="msg__head-avatar">
          <Mark />
        </span>
        <b className="msg__head-name">InTreatment</b>
      </div>

      {/* Карточка кликается целиком — как у психолога */}
      <div
        className="rec__card rec__card--clickable"
        role="button"
        tabIndex={0}
        aria-label={`Забрать: ${product.title}`}
        onClick={() => onBuy?.(product)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onBuy?.(product);
          }
        }}
      >
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

        </div>
      </div>

      {time && <time className="msg__time">{time}</time>}
    </article>
  );
}
