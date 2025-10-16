import { getProducts } from './api.js';

const grid = document.getElementById('grid');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalPrice = document.getElementById('modalPrice');
const closeModal = document.getElementById('closeModal');

function fmtPrice(p){ 
  const v = parseFloat(p); 
  return isNaN(v) ? '₾0.00' : `₾${v.toFixed(2)}`; 
}

async function renderProducts() {
  grid.innerHTML = '<p>Loading...</p>';
  const products = await getProducts();
  grid.innerHTML = products.map(p => `
    <div class="card">
      <img src="${p.image_url}" alt="${p.title}">
      <div class="title">${p.title}</div>
      <div class="price">${fmtPrice(p.price)}</div>
      <div class="desc">${p.short_description || ''}</div>
      <button class="more" data-title="${p.title}" data-desc="${p.short_description || ''}" data-img="${p.image_url}" data-price="${p.price || 0}">ვრცლად</button>
    </div>
  `).join('');


  document.querySelectorAll('.more').forEach(btn => {
    btn.addEventListener('click', () => {
      modalImage.src = btn.dataset.img;
      modalTitle.textContent = btn.dataset.title;
      modalDescription.textContent = btn.dataset.desc;
      modalPrice.textContent = fmtPrice(btn.dataset.price);
      modal.classList.remove('hidden');
    });
  });
}

closeModal.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

renderProducts();


