import { Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WordItem } from "../hooks/useSpeedSortingGame";

interface WordCardsAnimationProps {
  words: WordItem[];
  speed: number;
  draggedItem: string | null;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, wordId: string) => void;
  onDragEnd: () => void;
}

export function WordCardsAnimation({
  words,
  speed,
  draggedItem,
  onDragStart,
  onDragEnd,
}: WordCardsAnimationProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [singleWidth, setSingleWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [offset, setOffset] = useState(0);

  const repeatedWords = useMemo(() => {
    if (!words.length || !singleWidth)
      return words.length ? [...words, ...words] : [];
    const copies = Math.max(2, Math.ceil(containerWidth / singleWidth) + 1);
    return Array(copies).fill(words).flat();
  }, [words, singleWidth, containerWidth]);

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      const width = el.scrollWidth / 2;
      const safeWidth = width || 1;
      setSingleWidth((prevWidth) => {
        if (prevWidth === safeWidth) return prevWidth;
        return safeWidth;
      });
      setOffset((prev) => {
        const widthVal = safeWidth;
        if (!widthVal) return prev;
        const normalized = ((prev % widthVal) + widthVal) % widthVal;
        return normalized - widthVal;
      });
      const containerEl = containerRef.current;
      if (containerEl) setContainerWidth(containerEl.clientWidth || 0);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [words.length]);

  useEffect(() => {
    if (!singleWidth) return;

    let rafId: number;
    let lastTs = performance.now();
    const pixelsPerSecond = 240 * speed;

    const tick = (ts: number) => {
      const delta = ts - lastTs;
      lastTs = ts;
      setOffset((prev) => {
        let next = prev + (delta / 1000) * pixelsPerSecond;
        if (next >= 0) next -= singleWidth;
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [singleWidth, speed]);

  return (
    <div className="mb-6 sm:mb-8 lg:mb-12 overflow-hidden" ref={containerRef}>
      <div className="relative h-24 sm:h-32 lg:h-40">
        <div
          className="flex gap-4 absolute whitespace-nowrap will-change-transform"
          ref={trackRef}
          style={{
            transform: `translateX(${offset}px)`,
            width: "max-content",
          }}
        >
          {repeatedWords.map((word, index) => {
            const canDrag = !word.completed;

            return (
              <div
                key={`${word.id}-${index}`}
                draggable={canDrag}
                onDragStart={
                  canDrag ? (e) => onDragStart(e, word.id) : undefined
                }
                onDragEnd={canDrag ? onDragEnd : undefined}
                className={`rounded-lg sm:rounded-xl text-sm sm:text-lg lg:text-2xl font-semibold sm:font-bold transition-all shrink-0 
                  w-[120px] h-20 sm:w-[150px] sm:h-[100px] lg:w-[200px] lg:h-[140px] 
                  flex items-center justify-center ${
                    !word.completed
                      ? `bg-white text-black border sm:border-2 border-gray-300 cursor-move shadow-sm sm:shadow-md ${
                          draggedItem
                            ? ""
                            : "hover:border-gray-500 hover:shadow-md sm:hover:shadow-lg"
                        }`
                      : "bg-green-100 text-green-600 border sm:border-2 border-green-300 shadow-sm sm:shadow-md"
                  }`}
                style={{
                  opacity: draggedItem === word.id ? 0.3 : 1,
                }}
              >
                {word.completed ? (
                  <Check className="w-4 h-4 sm:w-6 sm:h-6 lg:w-10 lg:h-10" />
                ) : word.type === "image" && word.imageUrl ? (
                  <img
                    src={word.imageUrl}
                    alt={word.text}
                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                  />
                ) : (
                  word.text
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
