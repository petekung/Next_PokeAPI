"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import styles from "./globals.module.css";
import Navbar from "./components/Navber";
import Footer from "./components/Footer";
import PokemonModal from "./components/PokemonModal";
import type { Pokemon, PokemonDetail } from "./types"; // 👈 Import จากไฟล์ใหม่

export default function Home() {
  const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
  const [pokemonsOnPage, setPokemonsOnPage] = useState<PokemonDetail[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [inputPage, setInputPage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);

  const limit = 20;
  const maxVisiblePages = 6;

  // โหลดชื่อโปเกมอนทั้งหมดครั้งเดียวตอนเริ่ม
  useEffect(() => {
    const fetchAllNames = async () => {
      setLoadingAll(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1302`);
        const data = await res.json();
        setAllPokemons(data.results);
      } catch (err) {
        console.error(err);
        setAlertMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
      setLoadingAll(false);
    };
    fetchAllNames();
  }, []);

  // โหลด detail สำหรับโปเกมอนในหน้าปัจจุบัน หรือเมื่อมีการค้นหา
  const fetchPageDetails = useCallback(async () => {
    if (allPokemons.length === 0) return;

    setLoadingPage(true);
    const filtered = allPokemons.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setTotalPages(Math.ceil(filtered.length / limit));

    const start = (page - 1) * limit;
    const end = start + limit;
    const pagePokemons = filtered.slice(start, end);

    try {
      const detailsPromises = pagePokemons.map(p => fetch(p.url).then(res => res.json()));
      const details = await Promise.all(detailsPromises);
      setPokemonsOnPage(details);
    } catch {
      setAlertMsg("An error occurred while loading some Pokémon.");
      setTimeout(() => setAlertMsg(""), 3000);
    }
    setLoadingPage(false);
  }, [allPokemons, page, searchTerm]);

  useEffect(() => {
    fetchPageDetails();
  }, [fetchPageDetails]);

  // ฟังก์ชันสำหรับเปิด Modal และส่งข้อมูลฉบับเต็ม
  // ไม่ต้อง fetch ใหม่แล้ว เพราะเรามีข้อมูลครบจากการ์ดแล้ว
  const handleCardClick = (pokemon: PokemonDetail) => {
    setSelectedPokemon(pokemon);
  };
  
  const handleGoPage = () => {
    const target = Number(inputPage);
    if (!isNaN(target)) {
      if (target < 1) setPage(1);
      else if (target > totalPages) setPage(totalPages);
      else setPage(target);
      setInputPage("");
    }
  };

  const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <div className={styles.container}>
        {alertMsg && <div className={styles.alert}>{alertMsg}</div>}
        {loadingAll && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading all Pokémon...</p>
          </div>
        )}
        {!loadingAll && (
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Find your favorite Pokémon..."
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
              className={styles.searchInput}
            />
          </div>
        )}

        {loadingPage ? (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        ) : pokemonsOnPage.length === 0 && !loadingAll ? (
          <p className={styles.noResults}>No Pokémon found for "{searchTerm}"</p>
        ) : (
          <div className={styles.grid}>
            {pokemonsOnPage.map((pokemon) => (
              <div
                key={pokemon.id}
                className={styles.card}
                onClick={() => handleCardClick(pokemon)} // 👈 แก้ไขตรงนี้
              >
                <h1 className={styles.name}>{pokemon.name.toUpperCase()}</h1>
                {pokemon.sprites.front_default ? (
                  <Image
                    src={pokemon.sprites.other?.['official-artwork'].front_default || pokemon.sprites.front_default}
                    alt={pokemon.name}
                    width={128}
                    height={128}
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.cardSpinner}></div>
                )}
                <p className={styles.id}>#{String(pokemon.id).padStart(4, '0')}</p>
              </div>
            ))}
          </div>
        )}

        {!loadingAll && totalPages > 0 && (
          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>◀ Prev</button>
            {pages.map((num) => (
              <button key={num} className={page === num ? styles.activePage : ""} onClick={() => setPage(num)}>
                {num}
              </button>
            ))}
            <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>Next ▶</button>
            <div className={styles.container_GO}>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                placeholder={`1-${totalPages}`}
                className={styles.pageInput}
              />
              <button className={styles.goButton} onClick={handleGoPage}>Go</button>
            </div>
          </div>
        )}
        
        {selectedPokemon && (
          <PokemonModal
            pokemon={selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}