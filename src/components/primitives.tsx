import { ORNAMENT_MARK_PATH } from "@/lib/ornament";

/** Компактный знак «қошқар мүйіз» — угловой маркер. */
export function OrnamentMark({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={ORNAMENT_MARK_PATH} />
    </svg>
  );
}

/**
 * Слот под фотографию.
 *
 * Не серый прямоугольник: слот в палитре проекта с войлочной штриховкой
 * и подписью, какой именно кадр сюда встаёт. Одновременно это ТЗ на съёмку —
 * школа получает не только сайт, но и список кадров.
 *
 * Реальное фото подставляется заменой одного пропса на <Image>; вёрстка,
 * соотношение сторон и анимации при этом не трогаются.
 */
export function Slot({
  ratio,
  caption,
  spec,
  tag,
  className,
}: {
  ratio: string;
  caption: string;
  spec?: string;
  tag?: string;
  className?: string;
}) {
  return (
    <figure
      className={`slot ${className ?? ""}`}
      style={{ aspectRatio: ratio }}
    >
      <OrnamentMark className="slot__mark" size={26} />
      {tag ? <span className="slot__tag">{tag}</span> : null}
      <figcaption className="slot__body">
        <p className="slot__caption">{caption}</p>
        {spec ? <p className="slot__spec">{spec}</p> : null}
      </figcaption>
    </figure>
  );
}

/**
 * Редакционная заметка: помечает место, куда нужны реальные данные школы.
 * Скрывается переключателем — выключенные, страница выглядит как продакшен.
 */
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <aside className="note">
      <span className="note__label">нужны данные школы</span>
      {children}
    </aside>
  );
}
