"use client";

import Image from "next/image";
import styles from "../../css/globals.module.css";
import { useState, useEffect } from "react";
import type { PokemonDetail } from "../types"; // 👈 Import จากไฟล์ใหม่

interface PokemonModalProps {
  pokemon: PokemonDetail;
  onClose: () => void;
}

const formatStatName = (name: string): string => {
  return name.replace("special-attack", "Sp. Atk").replace("special-defense", "Sp. Def").replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
};

export default function PokemonModal({ pokemon, onClose }: PokemonModalProps) {
  const [currentImage, setCurrentImage] = useState<string>("");

  const imageSources = [
    pokemon.sprites.other?.['official-artwork'].front_default,
    pokemon.sprites.front_default,
    pokemon.sprites.front_shiny,
    pokemon.sprites.back_default,
    pokemon.sprites.back_shiny,
  ].filter((url): url is string => !!url);

  useEffect(() => {
    if (imageSources.length > 0) {
      setCurrentImage(imageSources[0]);
    }
  }, [pokemon.id]);
  
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>

        <div className={styles.modalHeader}>
          {currentImage && (
            <div className={styles.modalImageContainer}>
              <Image src={currentImage} alt={pokemon.name} width={150} height={150} className={styles.modalImage} key={currentImage} />
            </div>
          )}
          
          {imageSources.length > 1 && (
            <div className={styles.thumbnailContainer}>
              {imageSources.map((src, index) => (
                <button key={index} className={`${styles.thumbnailButton} ${currentImage === src ? styles.activeThumbnail : ''}`} onClick={() => setCurrentImage(src)}>
                  <Image src={src} alt={`Thumbnail ${index + 1}`} width={50} height={50} />
                </button>
              ))}
            </div>
          )}

          <h2 className={styles.modalPokemonName}>{pokemon.name}</h2>
          <p className={styles.modalPokemonId}>#{String(pokemon.id).padStart(4, '0')}</p>
        </div>

        <div className={styles.modalBody}>
          <div className={`${styles.modalSection} ${styles.typesSection}`}>
            {pokemon.types?.map((t) => (
              <span key={t.type.name} className={`${styles.typeBadge} ${styles[t.type.name]}`}>
                {t.type.name}
              </span>
            ))}
          </div>

          <div className={styles.modalGrid}>
            <div className={styles.modalInfoBox}>
              <h4>Height</h4>
              <p>{pokemon.height ? (pokemon.height / 10).toFixed(1) : "?"} m</p>
            </div>
            <div className={styles.modalInfoBox}>
              <h4>Weight</h4>
              <p>{pokemon.weight ? (pokemon.weight / 10).toFixed(1) : "?"} kg</p>
            </div>
            <div className={styles.modalInfoBox}>
              <h4>Base EXP</h4>
              <p>{pokemon.base_experience ?? 'N/A'}</p>
            </div>
          </div>
          
          <div className={styles.modalSection}>
            <h3>Abilities</h3>
            <ul className={styles.abilitiesList}>
              {pokemon.abilities?.map((a) => (
                <li key={a.ability.name}>
                  {a.ability.name}
                  {a.is_hidden && <span className={styles.hiddenAbility}> (Hidden)</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.modalSection}>
            <h3>Base Stats</h3>
            {pokemon.stats?.map((s) => (
              <div key={s.stat.name} className={styles.statRow}>
                <span className={styles.statName}>{formatStatName(s.stat.name)}</span>
                <span className={styles.statValue}>{s.base_stat}</span>
                <div className={styles.statBarBg}>
                  <div className={`${styles.statBarFill} ${styles['stat-' + s.stat.name]}`} style={{ width: `${(s.base_stat / 255) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}