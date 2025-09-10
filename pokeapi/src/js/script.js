import {
    fetchAllPokemonNames,
    fetchDetailedPokemonData,
    fetchPokemonByGeneration,
    fetchAllTypeData
} from './api.js';

import {
    displayProducts,
    showLoadingSpinner,
    updateLoadMoreButton,
    generateTypeFilters,
    populateGenerationFilter,
    showToast,
    createPokemonImageHTML
} from './ui.js';

import { initCart, addToCart, removeFromCart } from './cart.js';
import { initComparison, addToCompare, removeFromCompare } from './comparison.js';
import { initTeamBuilder, addToTeam, removeFromTeam } from './team.js';
import { initDetailsModal, showDetails } from './detailsModal.js';

// Import battle-related modules
import { Pokemon, Move, Battle } from './battle.js';
import { BattleUI } from './battleUI.js';
import { BattleAI } from './battleAI.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const productList = document.getElementById('product-list');
    const generationFilterSelect = document.getElementById('generation-filter');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const pokemonSearchInput = document.getElementById('pokemon-search');
    const typeFiltersContainer = document.getElementById('type-filters');
    const sortBySelect = document.getElementById('sort-by');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const detailModalEl = document.getElementById('detailModal');
    const battleScreen = document.getElementById('battle-screen');
    const startBattleBtn = document.getElementById('start-battle-btn');

    // --- App State ---
    let allPokemonNames = [];
    let filteredAndSortedProductsGlobal = [];
    let currentPage = 0;
    const productsPerPage = 50;
    let activeTypeFilters = [];

    // --- Initialization ---
    const main = async () => {
        showLoadingSpinner(productList);
        loadMoreBtn.style.display = 'none';
        
        // Fetch initial data
        await fetchAllTypeData();
        const allPokemon = await fetchAllPokemonNames();
        allPokemonNames = allPokemon;
        filteredAndSortedProductsGlobal = [...allPokemonNames];

        // Initialize modules
        initCart(allPokemonNames);
        initComparison(allPokemonNames);
        initTeamBuilder(allPokemonNames);
        initDetailsModal(allPokemonNames, filteredAndSortedProductsGlobal, new bootstrap.Modal(detailModalEl));

        // Populate filters
        await populateGenerationFilter(generationFilterSelect);
        await generateTypeFilters(typeFiltersContainer);

        // Initial display
        await displayInitialProducts();

        // Set up event listeners
        setupEventListeners();
    };

    const displayInitialProducts = async () => {
        const initialDisplayPokemon = filteredAndSortedProductsGlobal.slice(0, productsPerPage);
        const detailedFetches = initialDisplayPokemon.map(p => fetchDetailedPokemonData(p));
        await Promise.all(detailedFetches);
        
        displayProducts(initialDisplayPokemon, productList);
        updateLoadMoreButton(productList, filteredAndSortedProductsGlobal, loadMoreBtn);
    };

    // --- Event Handling ---
    const setupEventListeners = () => {
        // Product list event delegation
        productList.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const card = target.closest('.product-card');
            const id = parseInt(card.dataset.id);

            switch (action) {
                case 'show-details':
                    showDetails(id);
                    break;
                case 'add-to-cart':
                    addToCart(id);
                    break;
                case 'add-to-compare':
                    addToCompare(id);
                    break;
                case 'add-to-team':
                    addToTeam(id);
                    break;
            }
        });

        // Filter and sort listeners
        pokemonSearchInput.addEventListener('input', applyFiltersAndSort);
        sortBySelect.addEventListener('change', applyFiltersAndSort);
        generationFilterSelect.addEventListener('change', applyFiltersAndSort);
        typeFiltersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('type-filter-btn')) {
                e.target.classList.toggle('active');
                applyFiltersAndSort();
            }
        });

        // Reset filters
        resetFiltersBtn.addEventListener('click', () => {
            pokemonSearchInput.value = '';
            sortBySelect.value = 'id-asc';
            generationFilterSelect.value = '';
            document.querySelectorAll('.type-filter-btn.active').forEach(btn => btn.classList.remove('active'));
            applyFiltersAndSort();
        });

        // Load more
        loadMoreBtn.addEventListener('click', handleLoadMore);

        // Modal event delegation for remove buttons
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const id = parseInt(target.dataset.id);
            switch (target.dataset.action) {
                case 'remove-from-cart':
                    removeFromCart(id);
                    break;
                case 'remove-from-compare':
                    removeFromCompare(id);
                    break;
                case 'remove-from-team':
                    removeFromTeam(id);
                    break;
            }
        });
        
        // Animate stat bars when detail modal is shown
        detailModalEl.addEventListener('shown.bs.modal', () => {
            const statBars = detailModalEl.querySelectorAll('.stat-bar');
            setTimeout(() => {
                statBars.forEach(bar => {
                    const value = bar.getAttribute('data-value');
                    bar.style.width = `${(value / 255) * 100}%`;
                });
            }, 100); // Small delay to ensure initial render
        });

        // Scroll accordion body into view when shown
        detailModalEl.addEventListener('shown.bs.collapse', event => {
            const accordionBody = event.target;
            if (accordionBody) {
                setTimeout(() => {
                    accordionBody.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300); // Delay to allow animation to finish
            }
        });

        // Handle clicks on evolution stages within the detail modal
        detailModalEl.addEventListener('click', (e) => {
            const target = e.target.closest('.evolution-stage');
            if (target) {
                const id = parseInt(target.dataset.id);
                showDetails(id);
            }
        });

        // Start Battle Button
        startBattleBtn.addEventListener('click', () => {
            // Hide main content, show battle screen
            document.querySelector('.container.mt-4').style.display = 'none'; // Hide product list and filters
            document.querySelector('#start-battle-btn').style.display = 'none'; // Hide the battle start button itself
            battleScreen.style.display = 'block';

            // Example Pokémon and Moves for testing
            const tackle = new Move('Tackle', 'normal', 40, 100, 'physical');
            const ember = new Move('Ember', 'fire', 40, 100, 'special');
            const waterGun = new Move('Water Gun', 'water', 40, 100, 'special');
            const growl = new Move('Growl', 'normal', 0, 100, 'status', (target) => target.changeStatStage('attack', -1));
            const poisonSting = new Move('Poison Sting', 'poison', 15, 100, 'physical', (target) => {
                if (Math.random() < 0.3) target.applyStatus('poison'); // 30% chance to poison
            });

            const charmander = new Pokemon('Charmander', 'fire', 39, 52, 43, 60, 50, 65, [ember, tackle], 4);
            const squirtle = new Pokemon('Squirtle', 'water', 44, 48, 65, 50, 64, 43, [waterGun, tackle], 7);
            const bulbasaur = new Pokemon('Bulbasaur', 'grass', 45, 49, 49, 65, 65, 45, [tackle, growl, poisonSting], 1);

            const battleUI = new BattleUI();
            const battleAI = new BattleAI([squirtle]); // Opponent has Squirtle

            const battle = new Battle([charmander], [squirtle], battleUI, battleAI); // Pass UI and AI instances
            battleUI.setBattleInstance(battle); // Set battle instance in UI

            // Override battle.log to update UI
            battle.log = (message) => {
                battleUI.displayMessage(message);
                console.log(message); // Keep console log for debugging
            };

            // Initial UI update
            battleUI.updatePokemonDisplay(battle.activePlayerPokemon, battle.activeOpponentPokemon);
            battleUI.showCommandMenu();

            // Start the battle loop (simplified for now, will need more interaction)
            // For now, just start the battle and let it run through its console logs
            battle.start();
        });
    };

    // --- Core Logic ---
    const applyFiltersAndSort = async () => {
        showLoadingSpinner(productList);
        loadMoreBtn.style.display = 'none';
        const selectedGeneration = generationFilterSelect.value;
        let products;

        if (selectedGeneration) {
            products = await fetchPokemonByGeneration(selectedGeneration);
        } else {
            products = [...allPokemonNames];
        }

        const searchTerm = pokemonSearchInput.value.toLowerCase();
        if (searchTerm) {
            products = products.filter(p => p.name.toLowerCase().includes(searchTerm));
        }

        activeTypeFilters = [...typeFiltersContainer.querySelectorAll('.active')].map(btn => btn.dataset.type);
        if (activeTypeFilters.length > 0) {
            const detailedFetches = products.map(p => fetchDetailedPokemonData(p));
            const detailedProducts = await Promise.all(detailedFetches);
            products = detailedProducts.filter(p => p && p.types.some(t => activeTypeFilters.includes(t.type.name)));
        }

        const sortBy = sortBySelect.value;
        products.sort((a, b) => {
            switch (sortBy) {
                case 'id-desc': return b.id - a.id;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                default: return a.id - b.id; // id-asc
            }
        });

        filteredAndSortedProductsGlobal = products;
        currentPage = 0;

        if (filteredAndSortedProductsGlobal.length === 0) {
            productList.innerHTML = '<p class="text-center text-muted">ไม่พบโปเกมอนที่ตรงกับเงื่อนไข</p>';
            loadMoreBtn.style.display = 'none';
        } else {
            const firstPage = filteredAndSortedProductsGlobal.slice(0, productsPerPage);
            const detailedFetches = firstPage.map(p => fetchDetailedPokemonData(p));
            await Promise.all(detailedFetches);
            displayProducts(firstPage, productList);
            updateLoadMoreButton(productList, filteredAndSortedProductsGlobal, loadMoreBtn);
        }
    };

    const handleLoadMore = async () => {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังโหลด...';

        currentPage++;
        const start = currentPage * productsPerPage;
        const end = start + productsPerPage;
        const nextBatch = filteredAndSortedProductsGlobal.slice(start, end);

        if (nextBatch.length > 0) {
            const detailedFetches = nextBatch.map(p => fetchDetailedPokemonData(p));
            await Promise.all(detailedFetches);
            
            // Append new products
            const fragment = document.createDocumentFragment();
            nextBatch.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'col-6 col-sm-6 col-md-4 col-lg-3';
                productCard.innerHTML = `
                    <div class="card h-100 product-card" data-id="${product.id}">
                        <div class="card-img-container" data-action="show-details" style="cursor: pointer;">
                            ${createPokemonImageHTML(product, 'card-img-top', '180px')}
                            <div class="card-body d-flex flex-column pb-0">
                                <h5 class="card-title">${product.name}</h5>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 pt-0 text-center">
                             <p class="card-text mb-2">฿${product.price.toFixed(2)}</p>
                             <div class="d-flex justify-content-between mt-2">
                                <button class="btn btn-outline-info btn-sm flex-grow-1 me-1" data-action="add-to-compare">เปรียบเทียบ</button>
                                <button class="btn btn-outline-success btn-sm flex-grow-1 ms-1" data-action="add-to-team">เพิ่มเข้าทีม</button>
                             </div>
                             <button class="btn btn-primary w-100 mt-2" data-action="add-to-cart">เพิ่มลงตะกร้า</button>
                        </div>
                    </div>
                `;
                fragment.appendChild(productCard);
            });
            productList.appendChild(fragment);
        }

        updateLoadMoreButton(productList, filteredAndSortedProductsGlobal, loadMoreBtn);
    };

    // --- Start the App ---
    main();
});