import { createPokemonImageHTML, showToast } from './ui.js';

let cart = [];
let allPokemonNames = [];

const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

export const initCart = (pokemonData) => {
    allPokemonNames = pokemonData;
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCart();
};

export const addToCart = (id) => {
    const product = allPokemonNames.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    showToast(`เพิ่ม ${product.name} ลงในตะกร้าแล้ว!`);
    updateCart();
};

export const removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    updateCart();
};

const updateCart = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartTotal.textContent = `฿${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`;
};

const renderCartItems = () => {
    if (!cartItemsContainer) return;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center">ตะกร้าของคุณว่างเปล่า</p>';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center">
                ${createPokemonImageHTML(item, 'cart-item-img', '50px')}
                <div class="ms-3">
                    <h6 class="mb-0 text-capitalize">${item.name}</h6>
                    <small class="text-muted">จำนวน: ${item.quantity} x ฿${item.price.toFixed(2)}</small>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-danger" data-action="remove-from-cart" data-id="${item.id}"><i class="bi bi-trash-fill"></i></button>
        </div>
    `).join('');
};
