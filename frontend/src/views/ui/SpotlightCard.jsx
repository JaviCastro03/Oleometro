import { useRef } from 'react';
import styles from './SpotlightCard.module.css';

/** Glass card whose border and glow follow the pointer. */
export default function SpotlightCard({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);

  const onPointerMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${event.clientX - box.left}px`);
    node.style.setProperty('--my', `${event.clientY - box.top}px`);
  };

  return (
    <Tag ref={ref} onPointerMove={onPointerMove} className={`${styles.card} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
