
let detailedPokemonCache = {};
let typeDataCache = {};

// --- DATA FETCHING ---
export const fetchAllTypeData = async () => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/type');
        const data = await response.json();
        const typePromises = data.results.map(type => fetch(type.url).then(res => res.json()));
        const allTypeDetails = await Promise.all(typePromises);
        allTypeDetails.forEach(typeDetail => {
            typeDataCache[typeDetail.name] = typeDetail.damage_relations;
        });
        return typeDataCache;
    } catch (error) {
        console.error("Failed to fetch type data:", error);
    }
};

export const fetchAllPokemonNames = async (limit = 100000, offset = 0) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        return data.results
            .map(pokemon => {
                const id = pokemon.url.split('/').slice(-2, -1)[0];
                return {
                    id: parseInt(id),
                    name: pokemon.name,
                    url: pokemon.url,
                    price: Math.floor(Math.random() * 500) + 50,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`,
                    thumbnail: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`
                };
            })
            .filter(pokemon => pokemon.name !== 'miraidon-low-power-mode');
    } catch (error) {
        console.error("Failed to fetch Pokemon names:", error);
        return [];
    }
};

export const fetchDetailedPokemonData = async (pokemon) => {
    if (detailedPokemonCache[pokemon.id]) {
        return detailedPokemonCache[pokemon.id];
    }
    try {
        const pokeResponse = await fetch(pokemon.url);
        const pokeData = await pokeResponse.json();
        detailedPokemonCache[pokemon.id] = pokeData;
        return pokeData;
    } catch (error) {
        console.error(`Failed to fetch detailed data for ${pokemon.name}:`, error);
        return null;
    }
};

export const fetchPokemonByGeneration = async (generationId) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/generation/${generationId}`);
        const data = await response.json();
        return data.pokemon_species
            .map(pokemon => {
                const id = pokemon.url.split('/').slice(-2, -1)[0];
                const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${id}/`;
                return {
                    id: parseInt(id),
                    name: pokemon.name,
                    url: pokemonUrl,
                    price: Math.floor(Math.random() * 500) + 50,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`,
                    thumbnail: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`
                };
            })
            .filter(pokemon => pokemon.name !== 'miraidon-low-power-mode');
    } catch (error) {
        console.error(`Failed to fetch Pokemon for generation ${generationId}:`, error);
        return [];
    }
};

export const getDetailedPokemonCache = () => detailedPokemonCache;
export const getTypeDataCache = () => typeDataCache;
