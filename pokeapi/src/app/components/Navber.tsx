"use client";
import styles from "../globals.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navLogo}>Pokédex</div>
      <ul className={styles.navLinks}>
        <li><a href="#">Home</a></li>
        <li><a href="#">Pokémon</a></li>
        <li><a href="#">About</a></li>
      </ul>
    </nav>
  );
}
