import styles from './GlowButton.module.css';

/** Link-button with an animated conic-gradient border. */
export default function GlowButton({ icon, children, ...rest }) {
  return (
    <a className={styles.button} {...rest}>
      <span className={styles.inner}>
        {icon}
        {children}
      </span>
    </a>
  );
}
