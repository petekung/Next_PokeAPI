import { fetchDetailedPokemonData } from './api.js';
import { createPokemonImageHTML, showToast } from './ui.js';

let pokemonToCompare = [];
let allPokemonNames = [];

const comparePokemonContainer = document.getElementById('compare-pokemon-container');
const clearCompareBtn = document.getElementById('clear-compare-btn');
const compareModalEl = document.getElementById('compareModal');

export const initComparison = (pokemonData) => {
    allPokemonNames = pokemonData;
    pokemonToCompare = JSON.parse(localStorage.getItem('pokemonToCompare')) || [];

    clearCompareBtn.addEventListener('click', clearComparison);
    compareModalEl.addEventListener('shown.bs.modal', renderCompareModalContent);
};

export const addToCompare = (id) => {
    const product = allPokemonNames.find(p => p.id === id);
    if (!product) return;

    if (pokemonToCompare.length >= 2) {
        showToast('ไม่สามารถเพิ่มได้! เปรียบเทียบได้สูงสุด 2 ตัว');
        return;
    }

    if (pokemonToCompare.some(p => p.id === id)) {
        showToast(`${product.name} อยู่ในรายการเปรียบเทียบแล้ว!`);
        return;
    }

    pokemonToCompare.push(product);
    localStorage.setItem('pokemonToCompare', JSON.stringify(pokemonToCompare));
    showToast(`เพิ่ม ${product.name} เพื่อเปรียบเทียบแล้ว!`);
    renderCompareModalContent();
};

export const removeFromCompare = (id) => {
    pokemonToCompare = pokemonToCompare.filter(p => p.id !== id);
    localStorage.setItem('pokemonToCompare', JSON.stringify(pokemonToCompare));
    renderCompareModalContent();
};

const clearComparison = () => {
    pokemonToCompare = [];
    localStorage.setItem('pokemonToCompare', JSON.stringify(pokemonToCompare));
    renderCompareModalContent();
};

const renderCompareModalContent = async () => {
    if (!comparePokemonContainer) return;

    if (pokemonToCompare.length === 0) {
        comparePokemonContainer.innerHTML = '<p class="text-center text-muted">เลือกโปเกมอน 2 ตัวเพื่อเปรียบเทียบ</p>';
        return;
    }

    comparePokemonContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const renderPromises = pokemonToCompare.map(async (pokemon) => {
        const detailedData = await fetchDetailedPokemonData(pokemon);
        if (!detailedData) return '';

        return `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header text-center">
                        <h5 class="card-title text-capitalize mb-0">${detailedData.name} <span class="text-muted">#${String(detailedData.id).padStart(3, '0')}</span></h5>
                    </div>
                    <div class="card-body text-center">
                        ${createPokemonImageHTML(detailedData, 'img-fluid mb-3', '150px')}
                        <p><strong>ประเภท:</strong> ${detailedData.types.map(t => `<span class="badge rounded-pill me-1 type-${t.type.name}">${t.type.name}</span>`).join('')}</p>
                        <p><strong>สูง:</strong> ${detailedData.height / 10} m | <strong>น้ำหนัก:</strong> ${detailedData.weight / 10} kg</p>
                        <h6>ค่าพลัง:</h6>
                        <ul class="list-unstyled text-start px-3">
                            ${detailedData.stats.map(s => `
                                <li>
                                    <div class="d-flex justify-content-between">
                                        <span class="text-capitalize">${s.stat.name.replace('-', ' ')}:</span>
                                        <span>${s.base_stat}</span>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-info" role="progressbar" style="width: ${(s.base_stat / 255) * 100}%" aria-valuenow="${s.base_stat}" aria-valuemin="0" aria-valuemax="255"></div>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="card-footer text-center">
                        <button class="btn btn-outline-danger btn-sm" data-action="remove-from-compare" data-id="${pokemon.id}">ลบออก</button>
                    </div>
                </div>
            </div>
        `;
    });

    const cardsHTML = await Promise.all(renderPromises);
    comparePokemonContainer.innerHTML = cardsHTML.join('');
};
