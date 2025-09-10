import { fetchDetailedPokemonData } from './api.js';
import { createPokemonImageHTML, createDetailModalImageHTML } from './ui.js';

let allPokemonNames = [];
let filteredAndSortedProductsGlobal = [];
let detailModal;

// Initialize module with data and modal instance
export const initDetailsModal = (allPokemon, filteredPokemon, modalInstance) => {
    allPokemonNames = allPokemon;
    filteredAndSortedProductsGlobal = filteredPokemon;
    detailModal = modalInstance;
};

// The main function to show pokemon details
export const showDetails = async (id) => {
    const product = allPokemonNames.find(p => p.id === id) || filteredAndSortedProductsGlobal.find(p => p.id === id);
    if (!product) return;

    const modalEl = detailModal._element;
    const modalBody = modalEl.querySelector('#detailModalBody');
    const modalHeader = modalEl.querySelector('#detailModalHeader');
    const detailModalLabel = modalEl.querySelector('#detailModalLabel');

    // Reset header and show spinner
    modalHeader.className = 'modal-header';
    modalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    detailModal.show();

    try {
        const data = await fetchDetailedPokemonData(product);
        if (!data) throw new Error("Failed to fetch detailed data.");

        const speciesData = await fetch(data.species.url).then(res => res.json());
        const evolutionData = await fetch(speciesData.evolution_chain.url).then(res => res.json());

        // --- Render Modal Content ---
        const primaryType = data.types[0].type.name;
        modalHeader.classList.add(`header-${primaryType}`);
        detailModalLabel.innerHTML = `<span class="text-capitalize">${data.name}</span> <span class="text-muted">#${String(data.id).padStart(3, '0')}</span>`;
        modalBody.innerHTML = renderModalBodyContent(data, evolutionData);

        // The animation for stat bars is handled by a 'shown.bs.modal' event listener in the main script

    } catch (error) {
        console.error("Failed to load details:", error);
        modalBody.innerHTML = '<p class="text-center text-danger p-5">ขออภัย, ไม่สามารถโหลดข้อมูลรายละเอียดได้</p>';
    }
};

// --- Helper functions for rendering parts of the modal ---

const renderModalBodyContent = (data, evolutionData) => `
    <div class="container-fluid">
        <div class="row">
            <div class="col-lg-5 text-center">
                ${renderImageGallery(data)}
            </div>
            <div class="col-lg-7">
                <div class="accordion" id="pokemonAccordion">
                    ${renderInfoAccordion(data)}
                    ${renderStatsAccordion(data)}
                    ${renderEvolutionAccordion(evolutionData, data.name)}
                </div>
            </div>
        </div>
    </div>
`;

const renderImageGallery = (data) => {
    const spriteUrls = getAllSpriteUrls(data.sprites);
    // Make each sprite clickable to update the main image
    const spriteGallery = spriteUrls.map(url => 
        `<img src="${url}" class="sprite-gallery-img" alt="pokemon sprite" onclick="document.getElementById('main-pokemon-img').src='${url}'">`
    ).join('');

    return `
        ${createDetailModalImageHTML(data, 'main-pokemon-img', '280px', 'main-pokemon-img')}
        <div class="sprite-slider-container position-relative">
            <div class="sprite-slider" id="sprite-slider">${spriteGallery}</div>
        </div>
    `;
};

const renderInfoAccordion = (data) => {
    const types = data.types.map(typeInfo => `<span class="badge rounded-pill me-1 type-${typeInfo.type.name}">${typeInfo.type.name}</span>`).join('');
    const abilities = data.abilities.map(abilityInfo => `<li>${abilityInfo.ability.name}</li>`).join('');
    return `
        <div class="accordion-item">
            <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#info-collapse" aria-expanded="true">ข้อมูลทั่วไป</button></h2>
            <div id="info-collapse" class="accordion-collapse collapse show">
                <div class="accordion-body">
                    <p><strong>ประเภท:</strong> ${types}</p>
                    <p><strong>สูง:</strong> ${data.height / 10} m | <strong>น้ำหนัก:</strong> ${data.weight / 10} kg</p>
                    <h6>ความสามารถ:</h6>
                    <ul class="abilities-list">${abilities}</ul>
                </div>
            </div>
        </div>
    `;
};

const renderStatsAccordion = (data) => {
    const statsHTML = data.stats.map(statInfo => {
        const statName = statInfo.stat.name.replace('-', ' ');
        const statValue = statInfo.base_stat;
        return `
            <div class="stat-row">
                <span class="stat-name">${statName}</span>
                <div class="stat-bar-container">
                    <div class="stat-bar stat-${statName.split(' ').join('-')}" data-value="${statValue}"></div>
                </div>
                <span class="stat-value">${statValue}</span>
            </div>
        `;
    }).join('');
    return `
        <div class="accordion-item">
            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#stats-collapse">ค่าพลัง</button></h2>
            <div id="stats-collapse" class="accordion-collapse collapse">
                <div class="accordion-body">${statsHTML}</div>
            </div>
        </div>
    `;
};

const renderEvolutionAccordion = (evolutionData, currentPokemonName) => {
    const evolutionChain = parseEvolutionChain(evolutionData.chain);
    if (evolutionChain.length <= 1) {
        return ''; // Don't show evolution tab if there is no evolution
    }

    const evolutionStagesHTML = evolutionChain.map((pokemon, index) => {
        const isActive = pokemon.name === currentPokemonName ? 'active' : '';
        // Note: Using data-id attributes for event delegation instead of inline onclick
        const imageHTML = createPokemonImageHTML(pokemon, 'evolution-img', '90px');
        const stageHTML = `
            <div class="evolution-stage text-center ${isActive}" data-id="${pokemon.id}" style="cursor:pointer;">
                ${imageHTML}
                <p class="text-capitalize mb-0">${pokemon.name}</p>
            </div>
        `;
        const arrowHTML = index < evolutionChain.length - 1 ? '<div class="evolution-arrow fs-2">&rarr;</div>' : '';
        return stageHTML + arrowHTML;
    }).join('');

    return `
        <div class="accordion-item">
            <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#evolution-collapse">สายวิวัฒนาการ</button></h2>
            <div id="evolution-collapse" class="accordion-collapse collapse">
                <div class="accordion-body evolution-body">
                    <div class="evolution-chain">${evolutionStagesHTML}</div>
                </div>
            </div>
        </div>
    `;
};

const parseEvolutionChain = (chain) => {
    let evoChain = [];
    let current = chain;
    do {
        const speciesName = current.species.name;
        const speciesId = current.species.url.split('/').slice(-2, -1)[0];
        evoChain.push({ name: speciesName, id: speciesId });
        current = current.evolves_to[0];
    } while (!!current && current.hasOwnProperty('evolves_to'));
    return evoChain;
};

const getAllSpriteUrls = (spritesObj) => {
    const urls = [];
    const findUrls = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') urls.push(obj[key]);
            else if (obj[key] && typeof obj[key] === 'object') findUrls(obj[key]);
        }
    };
    findUrls(spritesObj);
    const officialArtwork = spritesObj.other?.['official-artwork']?.front_default;
    const dreamWorld = spritesObj.other?.dream_world?.front_default;
    const uniqueUrls = [...new Set(urls)].filter(url => url);
    const filteredUrls = uniqueUrls.filter(url => url !== officialArtwork && url !== dreamWorld);
    const finalUrls = [];
    if (officialArtwork) finalUrls.push(officialArtwork);
    if (dreamWorld) finalUrls.push(dreamWorld);
    return finalUrls.concat(filteredUrls.reverse());
};