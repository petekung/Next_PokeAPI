"use client";
import styles from "../../css/globals.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} Pokédex by พีท | Built with Next.js</p>
    </footer>
  );
}
