"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./globals.module.css";

interface Pokemon {
  name: string;
  url: string;
}

interface PokemonDetail {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
  };
  types?: { type: { name: string } }[];
  abilities?: { ability: { name: string } }[];
}

export default function Home() {
  const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
  const [pokemons, setPokemons] = useState<PokemonDetail[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [inputPage, setInputPage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  const limit = 20;
  const maxVisiblePages = 6;

  // โหลดชื่อโปเกมอนทั้งหมด
  useEffect(() => {
    const fetchAllNames = async () => {
      setLoadingAll(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0`);
        const data = await res.json();
        setAllPokemons(data.results);
        setTotalPages(Math.ceil(data.results.length / limit));
      } catch (err) {
        console.error(err);
        setAlertMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setTimeout(() => setAlertMsg(""), 5000);
      }
      setLoadingAll(false);
    };
    fetchAllNames();
  }, []);

  // โหลด detail สำหรับหน้า/ค้นหา
  useEffect(() => {
    if (allPokemons.length === 0) return;

    const fetchPageDetails = async () => {
      setLoadingPage(true);
      const filtered = allPokemons.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setTotalPages(Math.ceil(filtered.length / limit));

      const start = (page - 1) * limit;
      const end = start + limit;
      const pagePokemons = filtered.slice(start, end);

      try {
        const details: PokemonDetail[] = await Promise.all(
          pagePokemons.map(async (p: Pokemon) => {
            try {
              const res = await fetch(p.url);
              return res.json();
            } catch {
              return { id: 0, name: p.name, sprites: { front_default: null } };
            }
          })
        );
        setPokemons(details);
      } catch {
        setAlertMsg("An error occurred while loading some Pokémon.");
        setTimeout(() => setAlertMsg(""), 5000);
      }
      setLoadingPage(false);
    };

    fetchPageDetails();
  }, [allPokemons, page, searchTerm]);

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
    <div className={styles.container}>

      {/* Alert / ป๊อบอัพมุมขวาบน */}
      {alertMsg && <div className={styles.alert}>{alertMsg}</div>}

      {/* Loading overlay สำหรับตอนเริ่มเว็บ */}
      {loadingAll && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Search Box */}
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

      {/* Pokemon Grid */}
      {pokemons.length === 0  ? (
        <p className={styles.noResults}>No Pokemon found </p>
      ) : (
        <div className={styles.grid}>
          {pokemons.map((pokemon) => (
            <div
              key={pokemon.id}
              className={styles.card}
              onClick={() => {
                setSelectedPokemon(pokemon);
                setShowModal(true);
              }}
            >
              <h1 className={styles.name}>{pokemon.name.toUpperCase()}</h1>
              {pokemon.sprites.front_default ? (
                <Image
                  src={pokemon.sprites.front_default}
                  alt={pokemon.name}
                  width={128}
                  height={128}
                  className={styles.image}
                />
              ) : loadingPage ? (
                <div className={styles.cardSpinner}></div>
              ) : null}
              <p className={styles.id}>#{pokemon.id}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loadingAll && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>◀ Prev</button>
          {pages.map((num) => (
            <button
              key={num}
              className={page === num ? styles.activePage : ""}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next ▶</button>

          <div className={styles.container_GO}>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              placeholder={`1 - ${totalPages}`}
              className={styles.pageInput}
            />
            <button onClick={handleGoPage}>Go</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedPokemon && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()} // คลิกข้างในไม่ปิด
          >
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
              &times;
            </button>
            <h2>{selectedPokemon.name.toUpperCase()}</h2>
            {selectedPokemon.sprites.front_default && (
              <Image
                src={selectedPokemon.sprites.front_default}
                alt={selectedPokemon.name}
                width={150}
                height={150}
              />
            )}
            <p>ID: #{selectedPokemon.id}</p>
            {/* ถ้าต้องการใส่ข้อมูลอื่นๆ เช่น types, abilities */}
          </div>
        </div>
      )}


    </div>
  );
}
