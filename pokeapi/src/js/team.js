import { fetchDetailedPokemonData, getTypeDataCache } from './api.js';
import { createPokemonImageHTML, showToast } from './ui.js';

let myPokemonTeam = [];
let allPokemonNames = [];

// DOM Elements
const teamItemsContainer = document.getElementById('team-items');
const clearTeamBtn = document.getElementById('clear-team-btn');
const teamBuilderModalEl = document.getElementById('teamBuilderModal');
const analyzeTeamBtn = document.getElementById('analyze-team-btn');
const analyticsModalEl = document.getElementById('analyticsModal');
const analyticsLoading = document.getElementById('analytics-loading');
const analyticsContent = document.getElementById('analytics-content');

let analyticsModal;
let typeChartInstance = null;
let statsRadarChartInstance = null;

export const initTeamBuilder = (pokemonData) => {
    allPokemonNames = pokemonData;
    myPokemonTeam = JSON.parse(localStorage.getItem('myPokemonTeam')) || [];
    analyticsModal = new bootstrap.Modal(analyticsModalEl);

    clearTeamBtn.addEventListener('click', clearTeam);
    teamBuilderModalEl.addEventListener('shown.bs.modal', renderTeamBuilderModalContent);
    analyzeTeamBtn.addEventListener('click', analyzeTeam);
};

export const addToTeam = (id) => {
    const product = allPokemonNames.find(p => p.id === id);
    if (!product) return;

    if (myPokemonTeam.length >= 6) {
        showToast('ทีมเต็มแล้ว! เพิ่มได้สูงสุด 6 ตัว');
        return;
    }

    if (myPokemonTeam.some(p => p.id === id)) {
        showToast(`${product.name} อยู่ในทีมแล้ว!`);
        return;
    }

    myPokemonTeam.push(product);
    localStorage.setItem('myPokemonTeam', JSON.stringify(myPokemonTeam));
    showToast(`เพิ่ม ${product.name} ลงในทีมแล้ว!`);
    renderTeamBuilderModalContent();
};

export const removeFromTeam = (id) => {
    myPokemonTeam = myPokemonTeam.filter(p => p.id !== id);
    localStorage.setItem('myPokemonTeam', JSON.stringify(myPokemonTeam));
    renderTeamBuilderModalContent();
};

const clearTeam = () => {
    myPokemonTeam = [];
    localStorage.setItem('myPokemonTeam', JSON.stringify(myPokemonTeam));
    renderTeamBuilderModalContent();
};

const renderTeamBuilderModalContent = async () => {
    if (!teamItemsContainer) return;
    analyzeTeamBtn.disabled = myPokemonTeam.length === 0;

    if (myPokemonTeam.length === 0) {
        teamItemsContainer.innerHTML = '<p class="text-center text-muted">ยังไม่มีโปเกมอนในทีมของคุณ</p>';
        return;
    }

    teamItemsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const renderPromises = myPokemonTeam.map(async (pokemon) => {
        const detailedData = await fetchDetailedPokemonData(pokemon);
        if (!detailedData) return '';
        return `
            <div class="col-6 col-md-4 col-lg-4">
                <div class="card h-100 text-center">
                    ${createPokemonImageHTML(detailedData, 'card-img-top', '100px')}
                    <div class="card-body p-2">
                        <h6 class="card-title text-capitalize mb-1">${detailedData.name}</h6>
                        <button class="btn btn-outline-danger btn-sm" data-action="remove-from-team" data-id="${pokemon.id}">ลบออก</button>
                    </div>
                </div>
            </div>
        `;
    });

    const cardsHTML = await Promise.all(renderPromises);
    teamItemsContainer.innerHTML = cardsHTML.join('');
};

// --- TEAM ANALYTICS FUNCTIONS ---
const analyzeTeam = async () => {
    analyticsLoading.style.display = 'flex';
    analyticsContent.style.display = 'none';
    analyticsModal.show();

    const teamDetails = await Promise.all(
        myPokemonTeam.map(p => fetchDetailedPokemonData(p))
    );

    const { teamStats, baselineStats } = calculateTeamAverageStats(teamDetails);
    renderStatsRadarChart(teamStats, baselineStats);

    const typeEffectiveness = calculateTeamTypeEffectiveness(teamDetails);
    renderTypeChart(typeEffectiveness);

    analyticsLoading.style.display = 'none';
    analyticsContent.style.display = 'block';
};

const calculateTeamAverageStats = (teamDetails) => {
    const statKeys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    const teamStats = { hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 };

    teamDetails.forEach(pokemon => {
        pokemon.stats.forEach(stat => {
            teamStats[stat.stat.name] += stat.base_stat;
        });
    });

    const teamSize = teamDetails.length;
    const avgTeamStats = statKeys.map(key => teamStats[key] / teamSize);
    
    const baselineStats = [75, 75, 75, 75, 75, 75]; // Using a fixed baseline for comparison

    return { teamStats: avgTeamStats, baselineStats };
};

const calculateTeamTypeEffectiveness = (teamDetails) => {
    const typeDataCache = getTypeDataCache();
    const typeNames = Object.keys(typeDataCache);
    const effectiveness = Object.fromEntries(typeNames.map(name => [name, 0]));

    teamDetails.forEach(pokemon => {
        const pokemonTypes = pokemon.types.map(t => t.type.name);
        const defenseMultipliers = {};

        pokemonTypes.forEach(type => {
            const relations = typeDataCache[type];
            if (!relations) return;
            relations.double_damage_from.forEach(t => defenseMultipliers[t.name] = (defenseMultipliers[t.name] || 1) * 2);
            relations.half_damage_from.forEach(t => defenseMultipliers[t.name] = (defenseMultipliers[t.name] || 1) * 0.5);
            relations.no_damage_from.forEach(t => defenseMultipliers[t.name] = (defenseMultipliers[t.name] || 1) * 0);
        });
        
        typeNames.forEach(typeName => {
            const multiplier = defenseMultipliers[typeName];
            if (multiplier > 1) effectiveness[typeName] += 1; // Weak
            if (multiplier < 1) effectiveness[typeName] -= 1; // Resistant
        });
    });

    return effectiveness;
};

const renderStatsRadarChart = (teamStats, baselineStats) => {
    const ctx = document.getElementById('stats-radar-chart').getContext('2d');
    const labels = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];

    if (statsRadarChartInstance) {
        statsRadarChartInstance.destroy();
    }

    statsRadarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'ค่าพลังเฉลี่ยของทีม',
                data: teamStats,
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
            }, {
                label: 'ค่าเฉลี่ยทั่วไป',
                data: baselineStats,
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                pointBackgroundColor: 'rgb(255, 99, 132)',
            }]
        },
        options: {
            maintainAspectRatio: false,
            elements: { line: { borderWidth: 3 } },
            scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 120 } }
        }
    });
};

const renderTypeChart = (effectiveness) => {
    const ctx = document.getElementById('type-chart').getContext('2d');
    const labels = Object.keys(effectiveness);
    const data = Object.values(effectiveness);

    if (typeChartInstance) {
        typeChartInstance.destroy();
    }

    typeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Team Weakness/Resistance',
                data: data,
                backgroundColor: data.map(value => value > 0 ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)'),
                borderColor: data.map(value => value > 0 ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'),
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: { x: { stacked: true, ticks: { stepSize: 1 } }, y: { stacked: true } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            if (value > 0) return `Weakness Score: ${value}`;
                            if (value < 0) return `Resistance Score: ${-value}`;
                            return 'Neutral';
                        }
                    }
                }
            }
        }
    });
};
