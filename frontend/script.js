// ============================================================
// script.js - Brew Bliss Coffee Shop
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const API_BASE_URL = 'https://coffee-brew-bliss-1.onrender.com/api';

  const requestApi = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }

    return data;
  };

  // ============================================================
  // 1. THEME TOGGLE
  // ============================================================
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme  = localStorage.getItem('brew-bliss-theme');

  const setTheme = (isDark) => {
    document.body.classList.toggle('dark-mode', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    localStorage.setItem('brew-bliss-theme', isDark ? 'dark' : 'light');
  };

  // Apply saved preference on load
  setTheme(savedTheme === 'dark');

  themeToggle.addEventListener('click', () => {
    setTheme(!document.body.classList.contains('dark-mode'));
  });

  // ============================================================
  // 2. NAVBAR - Scroll Hide / Show & Scrolled Style
  // ============================================================
  const navbar = document.getElementById('navbar');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Add "scrolled" class after 50px for background change
    navbar.classList.toggle('scrolled', currentScrollY > 50);

    // Hide navbar when scrolling down past 100px; show on scroll up
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
  });

  // ============================================================
  // 3. MOBILE MENU (Hamburger)
  // ============================================================
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  // Close mobile menu when any nav link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });

  // ============================================================
  // 4. MENU — Search & Category Filter
  // ============================================================
  const menuSearch     = document.getElementById('menu-search');
  const filterButtons  = document.querySelectorAll('.filter-btn');
  const menuCategories = document.querySelectorAll('.menu-category');
  let activeCategory   = 'all';

  const filterMenu = () => {
    const searchTerm = menuSearch.value.trim().toLowerCase();

    menuCategories.forEach(category => {
      const categoryMatches = activeCategory === 'all' || category.dataset.category === activeCategory;
      let visibleItems = 0;

      category.querySelectorAll('.coffee-card').forEach(card => {
        const nameMatches = card.dataset.name.includes(searchTerm);
        const isVisible   = categoryMatches && nameMatches;
        card.hidden = !isVisible;
        if (isVisible) visibleItems += 1;
      });

      // Hide the entire category section if no cards are visible
      category.hidden = visibleItems === 0;
    });
  };

  menuSearch.addEventListener('input', filterMenu);

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.filter;
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      filterMenu();
    });
  });

  // ============================================================
  // 5. TESTIMONIALS — Auto-Rotating Carousel
  // ============================================================
  const track    = document.getElementById('carousel-track');
  const slides   = document.querySelectorAll('.testimonial-slide');
  const nextBtn  = document.getElementById('next-btn');
  const prevBtn  = document.getElementById('prev-btn');
  let currentIndex   = 0;
  let sliderInterval = null;

  const updateSlider = () => {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  };

  const nextSlide = () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  };

  const prevSlide = () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlider();
  };

  const startInterval = () => {
    sliderInterval = setInterval(nextSlide, 3000);
  };

  const resetInterval = () => {
    clearInterval(sliderInterval);
    startInterval();
  };

  nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
  prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });

  startInterval();

  // ============================================================
  // 6. CART — State, UI & Interactions
  // ============================================================
  let cart = [];

  const cartIcon          = document.getElementById('cart-icon');
  const cartSidebar       = document.getElementById('cart-sidebar');
  const cartOverlay       = document.getElementById('cart-overlay');
  const closeCartBtn      = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartBadge         = document.getElementById('cart-badge');
  const cartSubtotal      = document.getElementById('cart-subtotal');
  const checkoutBtn       = document.getElementById('checkout-btn');
  const addToCartBtns     = document.querySelectorAll('.add-to-cart');

  /** Open the cart sidebar */
  const openCart = () => {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
  };

  /** Close the cart sidebar */
  const closeCart = () => {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
  };

  cartIcon.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);   // clicking overlay always closes

  /** Re-render the cart items list and update badge + subtotal */
  const updateCartUI = () => {
    cartItemsContainer.innerHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
      totalItems += item.qty;
      totalPrice += item.price * item.qty;

      const itemEl = document.createElement('div');
      itemEl.classList.add('cart-item');
      itemEl.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn minus" data-id="${item.id}" aria-label="Decrease quantity">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn plus"  data-id="${item.id}" aria-label="Increase quantity">+</button>
          <button class="remove-item"   data-id="${item.id}" aria-label="Remove ${item.name}">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    cartBadge.textContent    = totalItems;
    cartSubtotal.textContent = `$${totalPrice.toFixed(2)}`;
  };

  /** Add item to cart or increment quantity if it already exists */
  const addToCart = (id, name, price) => {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ id, name, price: parseFloat(price), qty: 1 });
    }
    updateCartUI();
  };

  /** Update quantity of a cart item by delta; remove if qty reaches 0 */
  const updateQty = (id, delta) => {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      updateCartUI();
    }
  };

  /** Remove an item from the cart entirely */
  const removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
  };

  // "Add to Cart" button clicks — use closest() to handle icon children safely
  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.id;
      const name  = btn.dataset.name;
      const price = btn.dataset.price;
      addToCart(id, name, price);

      // Visual feedback: briefly change button text
      const originalText = btn.textContent;
      btn.textContent    = '✓ Added!';
      btn.disabled       = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled    = false;
      }, 1000);
    });
  });

  // Delegated click handler for quantity and remove buttons inside cart
  cartItemsContainer.addEventListener('click', (e) => {
    const plusBtn   = e.target.closest('.plus');
    const minusBtn  = e.target.closest('.minus');
    const removeBtn = e.target.closest('.remove-item');

    if (plusBtn)   updateQty(plusBtn.dataset.id, 1);
    if (minusBtn)  updateQty(minusBtn.dataset.id, -1);
    if (removeBtn) removeFromCart(removeBtn.dataset.id);
  });

  checkoutBtn.addEventListener('click', async () => {
    if (!cart.length) {
      alert('Your cart is empty!');
      return;
    }

    const customerName = window.prompt('Please enter your name:');
    if (!customerName || !customerName.trim()) return;

    const customerEmail = window.prompt('Please enter your email:');
    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    checkoutBtn.disabled = true;

    try {
      const result = await requestApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          items: cart,
          total,
        }),
      });

      alert(`${result.message}\nTotal: $${total.toFixed(2)}`);
      cart = [];
      updateCartUI();
      closeCart();
    } catch (error) {
      alert(`Could not place your order: ${error.message}`);
    } finally {
      checkoutBtn.disabled = false;
    }
  });

  // ============================================================
  // 7. CONTACT FORM — Validation & Toast Notification
  // ============================================================
  const contactForm = document.getElementById('contact-form');
  const toast       = document.getElementById('toast');
  const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const authTitle = document.getElementById('auth-title');
  const authIntro = document.getElementById('auth-intro');
  const loginForm = document.getElementById('login-form');
  const loginStatus = document.getElementById('login-status');
  const signupForm = document.getElementById('signup-form');
  const signupStatus = document.getElementById('signup-status');
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');

  const setAuthMode = (mode) => {
    const isLogin = mode === 'login';
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
    authTitle.textContent = isLogin ? 'Welcome Back' : 'Create Your Account';
    authIntro.textContent = isLogin
      ? 'Sign in to manage your Brew Bliss orders.'
      : 'Join Brew Bliss and manage your orders.';
    loginStatus.textContent = '';
    signupStatus.textContent = '';
  };

  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode('signup');
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode('login');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      loginStatus.textContent = 'Please enter your email and password.';
      return;
    }

    if (!emailRegex.test(email)) {
      loginStatus.textContent = 'Please enter a valid email address.';
      return;
    }

    submitButton.disabled = true;
    loginStatus.textContent = 'Signing in...';

    try {
      const user = await requestApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('brew-bliss-token', user.token);
      localStorage.setItem('brew-bliss-user', JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role,
      }));
      loginStatus.textContent = `Welcome back, ${user.name}!`;
      loginForm.reset();
    } catch (error) {
      loginStatus.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const submitButton = signupForm.querySelector('button[type="submit"]');

    if (!name || !email || !password || !confirmPassword) {
      signupStatus.textContent = 'Please complete all fields.';
      return;
    }

    if (!emailRegex.test(email)) {
      signupStatus.textContent = 'Please enter a valid email address.';
      return;
    }

    if (password.length < 6) {
      signupStatus.textContent = 'Password must be at least 6 characters.';
      return;
    }

    if (password !== confirmPassword) {
      signupStatus.textContent = 'Passwords do not match.';
      return;
    }

    submitButton.disabled = true;
    signupStatus.textContent = 'Creating your account...';

    try {
      await requestApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      signupStatus.textContent = 'Account created successfully. Returning home...';
      signupForm.reset();
      window.setTimeout(() => {
        window.location.hash = 'home';
      }, 1200);
    } catch (error) {
      signupStatus.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    // Guard: all fields must be filled
    if (!name || !email || !message) return;

    // Validate email format
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const result = await requestApi('/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, message }),
      });

      toast.textContent = result.message;
      toast.classList.add('show');
      contactForm.reset();

      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    } catch (error) {
      alert(`Could not send your message: ${error.message}`);
    } finally {
      submitButton.disabled = false;
    }
  });

});

