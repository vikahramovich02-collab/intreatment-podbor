/* Иконки — тонкая линия, как на сайте InTreatment.
   Логотип-знак (закрашенный круг + пунктирное кольцо) наследует currentColor,
   поэтому одинаково работает на светлом и на тёмной кнопке. */

export function Mark({ className = "" }) {
  return (
    <span className={`mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 26.5 14" fill="none">
        <circle cx="5" cy="7.5" r="5" fill="currentColor" />
        <circle cx="19.5" cy="7" r="6.5" stroke="currentColor" strokeDasharray="1 1" />
      </svg>
    </span>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />
  </svg>
);

export const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M7 7l10 10M17 7L7 17" {...stroke} />
  </svg>
);

export const ChevronLeft = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M14.5 5L8 12l6.5 7" {...stroke} />
  </svg>
);

export const ChevronRight = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M9.5 5L16 12l-6.5 7" {...stroke} />
  </svg>
);

export const ArrowLeft = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" {...stroke} />
  </svg>
);

export const CardIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" {...stroke} />
    <path d="M3 10.5h18" {...stroke} />
  </svg>
);

export const ShieldIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M12 3l7 3v5.5c0 4.3-2.9 8.1-7 9.5-4.1-1.4-7-5.2-7-9.5V6z" {...stroke} />
  </svg>
);

export const ClockIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="8.5" {...stroke} />
    <path d="M12 7.5V12l3 1.8" {...stroke} />
  </svg>
);
