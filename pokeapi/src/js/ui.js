// --- IMAGE RENDERING HELPERS ---
export const onImageLoad = (imgElement) => {
    imgElement.classList.add('loaded');
    const loader = imgElement.parentElement.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
};

export const handleImageError = (imgElement) => {
    const fallback1 = imgElement.dataset.fallback1;
    const fallback2 = imgElement.dataset.fallback2;

    if (fallback1) {
        imgElement.dataset.fallback1 = fallback2 || '';
        imgElement.dataset.fallback2 = '';
        imgElement.src = fallback1;
    } else {
        imgElement.onerror = null;
        onImageLoad(imgElement);
    }
};

// Make them globally accessible for the inline onload/onerror attributes
window.onImageLoad = onImageLoad;
window.handleImageError = handleImageError;

export const createPokemonImageHTML = (pokemon, cssClass = '', containerStyles = '', id = '') => {
    const animatedGif = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`;
    const officialArtwork = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    const dreamWorld = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemon.id}.svg`;
    
    // Prioritize animated GIF, then official artwork, then dream world
    const src1 = animatedGif;
    const src2 = officialArtwork;
    const src3 = dreamWorld;

    return `
        <div class="img-container" style="${containerStyles}">
            <div class="loader"></div>
            <img src="${src1}"
                 ${id ? `id="${id}"` : ''}
                 class="${cssClass}"
                 alt="${pokemon.name}"
                 data-fallback1="${src2}"
                 data-fallback2="${src3}"
                 onload="onImageLoad(this)"
                 onerror="handleImageError(this)">
        </div>
    `;
};

export const createDetailModalImageHTML = (pokemon, cssClass = '', containerStyles = '', id = '') => {
    const officialArtwork = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    const animatedGif = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`;
    const dreamWorld = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemon.id}.svg`;

    // Prioritize official artwork for the main detail view
    const src1 = officialArtwork;
    const src2 = animatedGif;
    const src3 = dreamWorld;

    return `
        <div class="img-container" style="${containerStyles}">
            <div class="loader"></div>
            <img src="${src1}"
                 ${id ? `id="${id}"` : ''}
                 class="${cssClass}"
                 alt="${pokemon.name}"
                 data-fallback1="${src2}"
                 data-fallback2="${src3}"
                 onload="onImageLoad(this)"
                 onerror="handleImageError(this)">
        </div>
    `;
};

// --- UI RENDERING ---

export const displayProducts = (productsToDisplay, productList) => {
    const fragment = document.createDocumentFragment();
    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-6 col-sm-6 col-md-4 col-lg-3';
        // Use data attributes for event handling
        productCard.innerHTML = `
            <div class="card h-100 product-card" data-id="${product.id}">
                <div class="card-img-container" data-action="show-details" style="cursor: pointer;">
                    ${createPokemonImageHTML(product, 'card-img-top', '180px')}
                    <div class="card-body d-flex flex-column pb-0">
                        <h5 class="card-title">${product.name}</h5>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0 pt-0 text-center">
                     <p class="card-text mb-2">฿${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</p>
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
    productList.innerHTML = ''; // Clear previous content
    productList.appendChild(fragment);
};

export const showLoadingSpinner = (productList) => {
    productList.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
};

export const updateLoadMoreButton = (productList, filteredAndSortedProductsGlobal, loadMoreBtn) => {
    const currentlyDisplayedCount = productList.children.length;
    loadMoreBtn.style.display = currentlyDisplayedCount < filteredAndSortedProductsGlobal.length ? 'block' : 'none';
    loadMoreBtn.disabled = false;
    loadMoreBtn.innerHTML = 'โหลดเพิ่มเติม';
};

export const generateTypeFilters = async (typeFiltersContainer) => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/type');
        const data = await response.json();
        const allTypes = data.results.map(typeInfo => typeInfo.name);

        typeFiltersContainer.innerHTML = allTypes.map(type => 
            `<button class="btn btn-outline-secondary btn-sm type-filter-btn type-${type}" data-type="${type}">${type}</button>`
        ).join('');
    } catch (error) {
        console.error("Failed to fetch Pokemon types:", error);
    }
};

export const populateGenerationFilter = async (generationFilterSelect) => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/generation');
        const data = await response.json();
        const allGenerations = data.results.map(gen => {
            const id = gen.url.split('/').slice(-2, -1)[0];
            return { ...gen, id };
        });

        generationFilterSelect.innerHTML += allGenerations.map(gen => {
            const name = gen.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<option value="${gen.id}">${name}</option>`;
        }).join('');
        return allGenerations;
    } catch (error) {
        console.error("Failed to fetch generations:", error);
        return [];
    }
};

export const showToast = (message) => {
    const toastEl = document.getElementById('cartToast');
    const toastBody = document.getElementById('toast-body-content');
    if (!toastEl || !toastBody) return;

    toastBody.innerText = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
};