import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

/** Counts from the previous value to the next one. `format` must be a stable function. */
export default function AnimatedNumber({ value, format }) {
  const ref = useRef(null);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (value == null || reduceMotion) {
      node.textContent = value == null ? '—' : format(value);
      previous.current = value ?? 0;
      return undefined;
    }
    const controls = animate(previous.current, value, {
      duration: 0.9,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (current) => {
        node.textContent = format(current);
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduceMotion, format]);

  return <span ref={ref} />;
}
