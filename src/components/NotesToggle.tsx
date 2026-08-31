"use client";

import { useEffect, useState } from "react";

/**
 * Переключатель редакционных заметок.
 *
 * Включено — видно, куда нужны реальные материалы школы: фотографии, цифры,
 * тексты. Выключено — страница выглядит ровно так, как её увидит родитель.
 *
 * Это сделано для показа заказчику: на одной и той же странице можно сначала
 * показать готовый продукт, а потом одним нажатием — объём работы, который
 * остаётся за школой.
 */
export function NotesToggle({
  labels,
}: {
  labels: { toggleShow: string; toggleHide: string; panelBody: string };
}) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    document.body.dataset.notes = on ? "on" : "off";
  }, [on]);

  return (
    <div className="notes-toggle">
      <button
        className="notes-toggle__btn"
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
      >
        <span className={`notes-toggle__dot ${on ? "is-on" : ""}`} />
        {on ? labels.toggleHide : labels.toggleShow}
      </button>
      {on ? <p className="notes-toggle__hint">{labels.panelBody}</p> : null}
    </div>
  );
}
