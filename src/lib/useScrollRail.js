import { useCallback, useEffect, useRef, useState } from "react";

/* Свой бегунок прокрутки: системный на macOS и iOS оверлейный —
   появляется только во время скролла, поэтому рисуем маленький свой.
   Ось определяем по тому, куда элемент реально скроллится. */
export default function useScrollRail() {
  const nodeRef = useRef(null);
  const watchRef = useRef(null);
  const [rail, setRail] = useState(null);

  const sync = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return setRail(null);

    const vertical = node.scrollHeight - node.clientHeight > 4;
    const horizontal = node.scrollWidth - node.clientWidth > 4;
    if (!vertical && !horizontal) return setRail(null);

    const axis = vertical ? "y" : "x";
    const view = axis === "y" ? node.clientHeight : node.clientWidth;
    const full = axis === "y" ? node.scrollHeight : node.scrollWidth;
    const pos = axis === "y" ? node.scrollTop : node.scrollLeft;

    const size = Math.max((view / full) * 100, 12); // короткий бегунок всё равно видно
    const offset = (pos / (full - view)) * (100 - size);
    return setRail({ axis, size, offset });
  }, []);

  /* Список наполняется уже после монтирования — следим и за размером, и за составом */
  const ref = useCallback(
    (node) => {
      watchRef.current?.resize.disconnect();
      watchRef.current?.mutation.disconnect();
      nodeRef.current = node;
      if (!node) {
        watchRef.current = null;
        return setRail(null);
      }
      const resize = new ResizeObserver(sync);
      resize.observe(node);
      for (const child of node.children) resize.observe(child);
      const mutation = new MutationObserver(sync);
      mutation.observe(node, { childList: true, subtree: true });
      watchRef.current = { resize, mutation };
      return sync();
    },
    [sync]
  );

  useEffect(() => {
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      watchRef.current?.resize.disconnect();
      watchRef.current?.mutation.disconnect();
    };
  }, [sync]);

  return { ref, rail, sync, nodeRef };
}
