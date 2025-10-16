import { loginUser, addProduct, getProducts, updateProduct, deleteProduct } from './api.js';

const loginForm = document.getElementById('loginForm');
const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const loginSection = document.getElementById('loginSection');
const productSection = document.getElementById('productSection');
const productId = document.getElementById('productId');
const saveBtn = document.getElementById('saveBtn');
const cancelEdit = document.getElementById('cancelEdit');
const imageInput = document.getElementById('image');
const priceInput = document.getElementById('price');
const imageFile = document.getElementById('imageFile');
const uploadBtn = document.getElementById('uploadBtn');

let token = null;

// Login
// loginForm.addEventListener('submit', async e => {
//   e.preventDefault();
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   const data = await loginUser(email, password);
//   if (data.token) {
//     token = data.token;
//     alert('Login successful!');
//     loginSection.classList.add('hidden');
//     productSection.classList.remove('hidden');
//     loadProducts();
//   } else {
//     alert('Login failed: ' + data.message);
//   }
// });

loginForm.addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const data = await loginUser(email, password);

  if (data.token) {
    token = data.token;

    // swal ალერტები
    Swal.fire({
      icon: 'success',
      title: 'შესვლა წარმატებულია!',
      text: 'კეთილი იყოს შენი დაბრუნება, ადმინ ☕',
      confirmButtonColor: '#ffca28',
      background: '#2a1b13',
      color: '#f5f5f5',
      timer: 1800,
      showConfirmButton: false
    });

    // დაელოდე სანამ ალერტი დაიხურება, შემდეგ გამოაჩინე პროდუქტების სექცია
    setTimeout(() => {
      loginSection.classList.add('hidden');
      productSection.classList.remove('hidden');
      loadProducts();
    }, 1800);

  } else {
    // შეცდომის ალერტი
    Swal.fire({
      icon: 'error',
      title: 'შესვლა ვერ მოხერხდა!',
      text: data.message || 'გთხოვ შეამოწმე ელფოსტა ან პაროლი',
      confirmButtonText: 'გასაგებია',
      confirmButtonColor: '#ffca28',
      background: '#2a1b13',
      color: '#f5f5f5'
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const email = document.getElementById('email');
  const password = document.getElementById('password');

  // Clear any prefilled values
  if (email) email.value = '';
  if (password) password.value = '';

  // Some browsers fill a moment later, so clear again after short delay
  setTimeout(() => {
    if (email) email.value = '';
    if (password) password.value = '';
  }, 500);
});

// Upload Image
// uploadBtn.addEventListener('click', async () => {
//   if (!token) return alert('Login first');
//   if (!imageFile.files.length) return alert('Choose a file first');
//   const fd = new FormData();
//   fd.append('image', imageFile.files[0]);
//   const res = await fetch('/upload', {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${token}` },
//     body: fd
//   });
//   const data = await res.json();
//   if (res.ok) {
//     const absolute = new URL(data.path, window.location.origin).href;
//     imageInput.value = absolute;
//     alert('Image uploaded! URL set in the field.');
//   } else {
//     alert(data.message || 'Upload failed');
//   }
// });


uploadBtn.addEventListener('click', async () => {
  if (!token) {
    return Swal.fire({
      icon: 'warning',
      title: 'შესვლა აუცილებელია!',
      text: 'გთხოვ, ჯერ შეხვიდე ადმინად ☕',
      confirmButtonColor: '#ffca28',
      background: '#2a1b13',
      color: '#f5f5f5'
    });
  }

  if (!imageFile.files.length) {
    return Swal.fire({
      icon: 'info',
      title: 'აირჩიე სურათი!',
      text: 'ატვირთვამდე უნდა აირჩიო ფაილი 📸',
      confirmButtonColor: '#ffca28',
      background: '#2a1b13',
      color: '#f5f5f5'
    });
  }

  const fd = new FormData();
  fd.append('image', imageFile.files[0]);

  const res = await fetch('/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  const data = await res.json();

  if (res.ok) {
    const absolute = new URL(data.path, window.location.origin).href;
    imageInput.value = absolute;

    Swal.fire({
      icon: 'success',
      title: 'სურათი წარმატებით აიტვირთა!',
      text: 'URL ავტომატურად დაემატა ველში ✅',
      confirmButtonColor: '#ffca28',
      background: '#2a1b13',
      color: '#f5f5f5',
      timer: 2000,
      showConfirmButton: false
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'ატვირთვა ვერ მოხერხდა!',
      text: data.message || 'სცადე ხელახლა 😔',
      confirmButtonColor: '#ffca28',
      background: '#2a1b13',
      color: '#f5f5f5'
    });
  }
});

// Create or Update
// productForm.addEventListener('submit', async e => {
//   e.preventDefault();
//   const id = productId.value;
//   const title = document.getElementById('title').value;
//   const desc = document.getElementById('desc').value;
//   const image = imageInput.value;
//   const price = priceInput.value;

//   let resp;
//   if (id) {
//     resp = await updateProduct(token, id, title, desc, image, price);
//   } else {
//     resp = await addProduct(token, title, desc, image, price);
//   }
//   if (resp && resp.message) alert(resp.message);
//   resetForm();
//   loadProducts();
// });


productForm.addEventListener('submit', async e => {
  e.preventDefault();
  const id = productId.value;
  const title = document.getElementById('title').value.trim();
  const desc = document.getElementById('desc').value.trim();
  const image = imageInput.value.trim();
  const price = priceInput.value.trim();

  let resp;
  if (id) {
    resp = await updateProduct(token, id, title, desc, image, price);
  } else {
    resp = await addProduct(token, title, desc, image, price);
  }

  if (resp && resp.message) {
    Swal.fire({
      icon: 'success',
      title: id ? 'პროდუქტი განახლდა!' : 'პროდუქტი დამატებულია!',
      text: resp.message,
      confirmButtonColor: '#ffca28',
      background: '#2a1b13',
      color: '#f5f5f5',
      timer: 2000,
      showConfirmButton: false
    });
  }

  resetForm();
  loadProducts();
});

// Reset form
function resetForm(){
  productId.value = '';
  productForm.reset();
  saveBtn.textContent = 'Add Product';
  cancelEdit.classList.add('hidden');
}

// Cancel edit
cancelEdit.addEventListener('click', resetForm);

// Load list
function fmtPrice(p){ 
  const v = parseFloat(p); 
  return isNaN(v) ? '₾0.00' : `₾${v.toFixed(2)}`; 
}

async function loadProducts() {
  const products = await getProducts();
  productList.innerHTML = products.map(p => `
    <div class="card">
      <img src="${p.image_url}" alt="${p.title}">
      <div>
        <div class="title">${p.title}</div>
        <div class="price">${fmtPrice(p.price)}</div>
        <div class="desc">${p.short_description || ''}</div>
      </div>
      <div class="action-btns">
        <button class="edit" data-id="${p.id}" data-title="${p.title}" data-desc="${p.short_description || ''}" data-img="${p.image_url}" data-price="${p.price || 0}">Edit</button>
        <button class="delete" data-id="${p.id}">Delete</button>
      </div>
    </div>
  `).join('');

  // Bind edit buttons
  // document.querySelectorAll('.edit').forEach(btn => {
  //   btn.addEventListener('click', () => {
  //     productId.value = btn.dataset.id;
  //     document.getElementById('title').value = btn.dataset.title;
  //     document.getElementById('desc').value = btn.dataset.desc;
  //     imageInput.value = btn.dataset.img;
  //     priceInput.value = btn.dataset.price;
  //     saveBtn.textContent = 'Save Changes';
  //     cancelEdit.classList.remove('hidden');
  //     window.scrollTo({ top: 0, behavior: 'smooth' });
  //   });
  // });

  document.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      productId.value = btn.dataset.id;
      document.getElementById('title').value = btn.dataset.title;
      document.getElementById('desc').value = btn.dataset.desc;
      imageInput.value = btn.dataset.img;
      priceInput.value = btn.dataset.price;
      saveBtn.textContent = 'Save Changes';
      cancelEdit.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      Swal.fire({
        icon: 'info',
        title: 'რედაქტირების რეჟიმი!',
        text: 'შეგიძლია შეცვალო და შეინახო ცვლილებები.',
        confirmButtonColor: '#ffca28',
        background: '#2a1b13',
        color: '#f5f5f5',
        timer: 1500,
        showConfirmButton: false
      });
    });
  });

  // Bind delete buttons
  // document.querySelectorAll('.delete').forEach(btn => {
  //   btn.addEventListener('click', async () => {
  //     if (!confirm('Delete this product?')) return;
  //     const id = btn.dataset.id;
  //     const resp = await deleteProduct(token, id);
  //     if (resp && resp.message) alert(resp.message);
  //     loadProducts();
  //   });
  // });

  document.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const result = await Swal.fire({
        title: 'წაშლა გინდა?',
        text: 'დაადასტურე წაშლა!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffca28',
        cancelButtonColor: '#e74c3c',
        confirmButtonText: 'დიახ, წაშალე!',
        cancelButtonText: 'გაუქმება',
        background: '#2a1b13',
        color: '#f5f5f5'
      });

      if (result.isConfirmed) {
        const id = btn.dataset.id;
        const resp = await deleteProduct(token, id);

        if (resp && resp.message) {
          Swal.fire({
            icon: 'success',
            title: 'წარმატებით წაიშალა!',
            text: resp.message,
            confirmButtonColor: '#ffca28',
            background: '#2a1b13',
            color: '#f5f5f5',
            timer: 1800,
            showConfirmButton: false
          });
        }

        loadProducts();
      }
    });
  });
}
