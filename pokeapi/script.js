document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const productList = document.getElementById('product-list');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const detailModalEl = document.getElementById('detailModal');
    const detailModal = new bootstrap.Modal(detailModalEl);
    const detailModalLabel = document.getElementById('detailModalLabel');

    // App State
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let productsCache = [];

    // --- DATA FETCHING ---
    const fetchProducts = async () => {
        try {
            productList.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=30');
            const data = await response.json();
            const products = await Promise.all(data.results.map(async (pokemon) => {
                const pokeResponse = await fetch(pokemon.url);
                const pokeData = await pokeResponse.json();
                const animatedSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokeData.id}.gif`;
                const staticSprite = pokeData.sprites.front_default;
                return {
                    id: pokeData.id,
                    name: pokeData.name,
                    image: animatedSprite,
                    thumbnail: staticSprite,
                    price: Math.floor(Math.random() * 500) + 50,
                    fullData: pokeData
                };
            }));
            productsCache = products;
            displayProducts(products);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            productList.innerHTML = '<p class="text-center text-danger">ไม่สามารถโหลดสินค้าได้</p>';
        }
    };

    // --- RENDERING FUNCTIONS ---
    const displayProducts = (products) => {
        productList.innerHTML = '';
        products.forEach(product => {
            const productCard = `
                <div class="col-6 col-sm-6 col-md-4 col-lg-3">
                    <div class="card h-100 product-card">
                        <div onclick="showDetails(${product.id})" style="cursor: pointer;">
                            <img src="${product.image}" class="card-img-top" alt="${product.name}" onerror="this.onerror=null;this.src='${product.thumbnail}';">
                            <div class="card-body d-flex flex-column pb-0">
                                <h5 class="card-title">${product.name}</h5>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 pt-0 text-center">
                             <p class="card-text mb-2">฿${product.price.toFixed(2)}</p>
                             <button class="btn btn-primary w-100" onclick="addToCart(${product.id})">เพิ่มลงตะกร้า</button>
                        </div>
                    </div>
                </div>
            `;
            productList.innerHTML += productCard;
        });
    };

    // --- DETAIL MODAL ---
    window.showDetails = async (id) => {
        const product = productsCache.find(p => p.id === id);
        if (!product) return;

        const modalBody = document.getElementById('detailModalBody');
        const modalHeader = document.getElementById('detailModalHeader');

        modalHeader.className = 'modal-header';
        modalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-light" style="width: 3rem; height: 3rem;" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        detailModal.show();

        try {
            const data = product.fullData;
            const primaryType = data.types[0].type.name;
            modalHeader.classList.add(`header-${primaryType}`);

            const speciesResponse = await fetch(data.species.url);
            const speciesData = await speciesResponse.json();
            const evolutionResponse = await fetch(speciesData.evolution_chain.url);
            const evolutionData = await evolutionResponse.json();

            detailModalLabel.innerHTML = `<span class="text-capitalize">${data.name}</span> <span class="text-muted">#${String(data.id).padStart(3, '0')}</span>`;
            modalBody.innerHTML = renderModalBodyContent(data, evolutionData);
            setupSliderArrows();

            // Animate stat bars after content is rendered
            const statBars = detailModalEl.querySelectorAll('.stat-bar');
            statBars.forEach(bar => {
                const value = bar.getAttribute('data-value');
                const percentage = (value / 255) * 100;
                bar.style.width = `${percentage}%`;
            });

        } catch (error) {
            console.error("Failed to load details:", error);
            modalBody.innerHTML = '<p class="text-center text-danger p-5">ขออภัย, ไม่สามารถโหลดข้อมูล chi tiết ได้</p>';
        }
    };

    const renderModalBodyContent = (data, evolutionData) => {
        return `
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
    };

    const renderImageGallery = (data) => {
        const mainImage = data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default || '';
        const spriteUrls = getAllSpriteUrls(data.sprites);
        const spriteGallery = spriteUrls.map(url => `<img src="${url}" class="sprite-gallery-img" alt="pokemon sprite" onclick="document.getElementById('main-pokemon-img').src='${url}'">`).join('');
        return `
            <div class="main-img-container mb-3"><img src="${mainImage}" id="main-pokemon-img" class="main-pokemon-img" alt="${data.name}"></div>
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
                    <div class="accordion-body"><p><strong>ประเภท:</strong> ${types}</p><p><strong>สูง:</strong> ${data.height / 10} m | <strong>น้ำหนัก:</strong> ${data.weight / 10} kg</p><h6>ความสามารถ:</h6><ul class="abilities-list">${abilities}</ul></div>
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
                        <div class="stat-bar stat-${statName.split(' ').join('-')}" data-value="${statValue}" style="width: 0%;"></div>
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
        let evolutionHTML = '<div class="d-flex justify-content-center align-items-center h-100"><p class="text-center mt-4">โปเกมอนตัวนี้ไม่มีสายวิวัฒนาการ</p></div>';
        if (evolutionChain.length > 1) {
            evolutionHTML = evolutionChain.map((pokemon, index) => {
                const isActive = pokemon.name === currentPokemonName ? 'active' : '';
                const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                const stageHTML = `<div class="evolution-stage text-center ${isActive}" onclick="showDetails(${pokemon.id})"><img src="${spriteUrl}" class="evolution-img"><p class="text-capitalize mb-0">${pokemon.name}</p></div>`;
                const arrowHTML = index < evolutionChain.length - 1 ? '<div class="evolution-arrow fs-2">&rarr;</div>' : '';
                return stageHTML + arrowHTML;
            }).join('');
        }
        return `
            <div class="accordion-item">
                <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#evolution-collapse">สายวิวัฒนาการ</button></h2>
                <div id="evolution-collapse" class="accordion-collapse collapse">
                    <div class="accordion-body evolution-body">${evolutionHTML}</div>
                </div>
            </div>
        `;
    };

    const setupSliderArrows = () => {
        const mainPokemonImg = document.getElementById('main-pokemon-img');
        const spriteGalleryImgs = document.querySelectorAll('.sprite-gallery-img');
        const prevBtn = document.getElementById('slider-arrow-prev');
        const nextBtn = document.getElementById('slider-arrow-next');
        // spriteSlider is no longer needed here as we are not scrolling it automatically

        if (!mainPokemonImg || spriteGalleryImgs.length === 0 || !prevBtn || !nextBtn) return;

        const updateMainImage = (direction) => {
            let currentIndex = -1;
            for (let i = 0; i < spriteGalleryImgs.length; i++) {
                if (mainPokemonImg.src === spriteGalleryImgs[i].src) {
                    currentIndex = i;
                    break;
                }
            }

            let newIndex = currentIndex;
            if (direction === 'next') {
                newIndex = (currentIndex + 1) % spriteGalleryImgs.length;
            } else if (direction === 'prev') {
                newIndex = (currentIndex - 1 + spriteGalleryImgs.length) % spriteGalleryImgs.length;
            }

            mainPokemonImg.src = spriteGalleryImgs[newIndex].src;
            // Removed automatic scroll of sprite slider on arrow click as per user request.
        };

        prevBtn.addEventListener('click', () => updateMainImage('prev'));
        nextBtn.addEventListener('click', () => updateMainImage('next'));
    };

    detailModalEl.addEventListener('shown.bs.modal', () => {
        const statBars = detailModalEl.querySelectorAll('.stat-bar');
        setTimeout(() => {
            statBars.forEach(bar => {
                const value = bar.getAttribute('data-value');
                const percentage = (value / 255) * 100;
                bar.style.width = `${percentage}%`;
            });
        }, 100);
    });

    detailModalEl.addEventListener('shown.bs.collapse', event => {
        const accordionBody = event.target; // event.target is the accordion-collapse element
        if (accordionBody) {
            // Use a small timeout to allow Bootstrap's collapse animation to start
            setTimeout(() => {
                accordionBody.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100); // Reduced timeout for quicker response
        }
    });

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

    // --- CART FUNCTIONS ---
    window.addToCart = (id) => {
        const product = productsCache.find(p => p.id === id);
        if (!product) return;
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: product.id, name: product.name, price: product.price, image: product.thumbnail, quantity: 1 });
        }
        const toast = new bootstrap.Toast(document.getElementById('cartToast'));
        document.getElementById('toast-body-content').innerText = `เพิ่ม ${product.name} ลงในตะกร้าแล้ว!`;
        toast.show();
        updateCart();
    };

    const updateCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartTotal.textContent = `฿${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`;
    };

    const renderCartItems = () => {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center">ตะกร้าของคุณว่างเปล่า</p>';
            return;
        }
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const cartItem = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <div>
                            <h6 class="mb-0 text-capitalize">${item.name}</h6>
                            <small class="text-muted">จำนวน: ${item.quantity} x ฿${item.price.toFixed(2)}</small>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id})"><i class="bi bi-trash-fill"></i></button>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItem;
        });
    };

    window.removeFromCart = (id) => {
        cart = cart.filter(item => item.id !== id);
        updateCart();
    };

    // Initial Load
    fetchProducts();
    updateCart();
});