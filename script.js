// ==================== CONFIGURACIÓN INICIAL ====================
const CONFIG = {
    whatsapp: "573144751047",
    admin: {
        username: "patrón",
        password: "2006.01.28.123"
    },
    prices: {
        personal: 7000,
        familiar: 21000,
        domicilio: 2000
    },
    promotion: {
        active: true,
        days: [0], // 0 = Domingo
        personal: {
            originalPrice: 10500,
            promoPrice: 7000,
            description: "🎁 Domingos: Lleva 3 choribolas por $7.000"
        }
    }
};

// ==================== ESTADO GLOBAL ====================
let state = {
    order: {
        personal: { quantity: 0, salsa: '' },
        familiar: { quantity: 0 }
    },
    customer: {
        name: '',
        phone: '',
        address: '',
        notes: ''
    },
    orders: [],
    products: [
        {
            id: 1,
            name: 'Caja Personal',
            description: '2 Choribolas + 1 Salsa a elección',
            price: 7000,
            promoPrice: 7000,
            category: 'combo',
            image: 'https://i.ibb.co/84NNK73f/1760427991.png'
        },
        {
            id: 2,
            name: 'Caja Familiar',
            description: '6 Choribolas + Las 3 Salsas de la casa',
            price: 21000,
            promoPrice: 21000,
            category: 'combo',
            image: 'https://i.ibb.co/Y48bT8Wy/IMG-20250915-170714.jpg'
        }
    ],
    currentAdmin: null,
    analytics: {
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        popularProduct: '',
        salesData: [],
        zonesData: []
    }
};

// ==================== FUNCIONES DE INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousel();
    initializeEventListeners();
    updatePromotionDisplay();
    updateTotal();
    loadSampleData();
    initializeAdminSecurity();
});

function initializeCarousel() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-item');
    const totalSlides = slides.length;

    document.getElementById('next-btn').addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    });

    function updateCarousel() {
        const carouselInner = document.getElementById('carousel-inner');
        carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    // Auto-advance carousel
    setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);
}

function initializeAdminSecurity() {
    // Ocultar botón admin para usuarios normales
    document.getElementById('admin-access-btn').style.display = 'none';
    
    // Configurar acceso secreto por logo
    const logoLink = document.getElementById('logo-link');
    let pressTimer;
    
    logoLink.addEventListener('mousedown', function() {
        pressTimer = window.setTimeout(function() {
            showAdminAccessModal();
        }, 3000);
    });
    
    logoLink.addEventListener('touchstart', function(e) {
        pressTimer = window.setTimeout(function() {
            showAdminAccessModal();
        }, 3000);
        e.preventDefault();
    });
    
    logoLink.addEventListener('mouseup', clearPressTimer);
    logoLink.addEventListener('mouseleave', clearPressTimer);
    logoLink.addEventListener('touchend', clearPressTimer);
    
    function clearPressTimer() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }
}

function showAdminAccessModal() {
    document.getElementById('admin-access-modal').style.display = 'flex';
}

function closeAdminModal() {
    document.getElementById('admin-access-modal').style.display = 'none';
    document.getElementById('admin-access-btn').style.display = 'flex';
}

function showLoginModal() {
    document.getElementById('admin-login-modal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('admin-login-modal').style.display = 'none';
}

function initializeEventListeners() {
    // Admin login
    document.getElementById('admin-access-btn').addEventListener('click', showLoginModal);
    
    // Admin login form
    document.getElementById('admin-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        if (username === CONFIG.admin.username && password === CONFIG.admin.password) {
            state.currentAdmin = { username: username, name: 'Patrón' };
            closeLoginModal();
            showAdminPanel();
            initializeAdminPanel();
        } else {
            alert('❌ Credenciales incorrectas');
        }
    });

    // Admin logout
    document.getElementById('admin-logout-btn').addEventListener('click', function() {
        state.currentAdmin = null;
        document.getElementById('admin-view').style.display = 'none';
        document.getElementById('customer-view').style.display = 'block';
        document.getElementById('admin-access-btn').style.display = 'none';
    });

    // Customer form
    document.getElementById('open-customer-form').addEventListener('click', openCustomerForm);
    
    // Salsas selection
    document.querySelectorAll('input[name="personal-salsa"]').forEach(radio => {
        radio.addEventListener('click', function(e) {
            e.stopPropagation();
            state.order.personal.salsa = this.value;
        });
    });

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });

    // Orders filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            filterOrders(filter);
        });
    });
}

// ==================== FUNCIONES DE PEDIDOS ====================
function selectOption(type) {
    document.getElementById('personal-card').classList.remove('selected');
    document.getElementById('familiar-card').classList.remove('selected');
    document.getElementById(`${type}-card`).classList.add('selected');
}

function changeQuantity(type, change) {
    state.order[type].quantity = Math.max(0, state.order[type].quantity + change);
    document.getElementById(`${type}-quantity`).textContent = state.order[type].quantity;
    updateTotal();
}

function updateTotal() {
    let total = 0;
    let personalPrice = isPromoActive() ? CONFIG.promotion.personal.promoPrice : CONFIG.prices.personal;
    
    total += state.order.personal.quantity * personalPrice;
    total += state.order.familiar.quantity * CONFIG.prices.familiar;
    
    document.getElementById('total-display').textContent = `Total: $${total.toLocaleString()}`;
}

function isPromoActive() {
    if (!CONFIG.promotion.active) return false;
    const today = new Date().getDay();
    return CONFIG.promotion.days.includes(today);
}

function updatePromotionDisplay() {
    const isActive = isPromoActive();
    const promoBadge = document.getElementById('promo-badge');
    const originalPrice = document.getElementById('original-price');
    const currentPrice = document.getElementById('current-price');
    const promoText = document.getElementById('promo-text');

    if (isActive) {
        if (promoBadge) promoBadge.style.display = 'block';
        if (originalPrice) originalPrice.style.display = 'inline';
        if (currentPrice) currentPrice.textContent = `$${CONFIG.promotion.personal.promoPrice.toLocaleString()}`;
        if (promoText) promoText.style.display = 'block';
    } else {
        if (promoBadge) promoBadge.style.display = 'none';
        if (originalPrice) originalPrice.style.display = 'none';
        if (currentPrice) currentPrice.textContent = `$${CONFIG.prices.personal.toLocaleString()}`;
        if (promoText) promoText.style.display = 'none';
    }
}

// ==================== FORMULARIO DE CLIENTE ====================
function openCustomerForm() {
    const total = calculateOrderTotal();
    if (total === 0) {
        alert('Por favor agrega productos a tu pedido antes de continuar.');
        return;
    }

    processOrderWithPrompts();
}

function processOrderWithPrompts() {
    const customerName = prompt('👤 ¿Cuál es tu nombre completo?');
    if (!customerName) return;
    
    const customerPhone = prompt('📞 ¿Tu número de WhatsApp? (Ej: 3001234567)');
    if (!customerPhone) return;
    
    const customerAddress = prompt('📍 ¿Tu barrio y dirección para el domicilio?');
    if (!customerAddress) return;
    
    const customerNotes = prompt('📝 ¿Alguna nota adicional? (Ej: Sin picante, llamar antes...)\n(O presiona Cancelar si no hay notas)');

    // Crear orden
    const orderId = generateOrderId();
    const order = {
        id: orderId,
        customer: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            notes: customerNotes || ''
        },
        items: getOrderItems(),
        total: calculateOrderTotal() + CONFIG.prices.domicilio,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    // Agregar a órdenes y analytics
    state.orders.push(order);
    updateAnalytics(order);
    
    // Enviar a WhatsApp
    sendOrderToWhatsApp(order);
    
    // Resetear pedido
    resetOrder();
    
    alert(`✅ ¡Pedido #${orderId} creado!\n\nSe abrirá WhatsApp para que envíes tu comprobante.\n\nRecuerda:\n- Tu pedido llegará en 30-45 minutos\n- Valor total: $${order.total.toLocaleString()}\n- Pago contra entrega`);
}

function generateOrderId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `CRISPY-${timestamp.toString().slice(-6)}${random}`;
}

function getOrderItems() {
    const items = [];
    if (state.order.personal.quantity > 0) {
        items.push({
            type: 'personal',
            quantity: state.order.personal.quantity,
            salsa: state.order.personal.salsa,
            unitPrice: isPromoActive() ? CONFIG.promotion.personal.promoPrice : CONFIG.prices.personal
        });
    }
    if (state.order.familiar.quantity > 0) {
        items.push({
            type: 'familiar',
            quantity: state.order.familiar.quantity,
            unitPrice: CONFIG.prices.familiar
        });
    }
    return items;
}

function calculateOrderTotal() {
    let total = 0;
    const personalPrice = isPromoActive() ? CONFIG.promotion.personal.promoPrice : CONFIG.prices.personal;
    
    total += state.order.personal.quantity * personalPrice;
    total += state.order.familiar.quantity * CONFIG.prices.familiar;
    
    return total;
}

function getSalsaName(salsaKey) {
    const salsas = {
        'maiz': 'Salsa de Maíz',
        'tocineta': 'Salsa de Tocineta', 
        'ahumada': 'Salsa Ahumada'
    };
    return salsas[salsaKey] || '';
}

function sendOrderToWhatsApp(order) {
    let message = `¡Hola Crispy Boom! Quiero hacer un pedido:%0A%0A`;
    message += `📦 *Pedido #${order.id}*%0A`;
    message += `👤 *Cliente:* ${order.customer.name}%0A`;
    message += `📞 *WhatsApp:* ${order.customer.phone}%0A`;
    message += `📍 *Dirección:* ${order.customer.address}%0A`;
    
    if (order.customer.notes) {
        message += `📝 *Notas:* ${order.customer.notes}%0A`;
    }
    
    message += `%0A🛒 *Detalle del pedido:*%0A`;
    
    order.items.forEach(item => {
        if (item.type === 'personal') {
            const choribolasCount = isPromoActive() ? item.quantity * 3 : item.quantity * 2;
            message += `• ${item.quantity}x Caja Personal (${choribolasCount} choribolas)`;
            if (item.salsa) {
                message += ` - ${getSalsaName(item.salsa)}`;
            }
            message += `%0A`;
        } else {
            message += `• ${item.quantity}x Caja Familiar (${item.quantity * 6} choribolas)%0A`;
        }
    });
    
    message += `%0A💰 *Subtotal:* $${(order.total - CONFIG.prices.domicilio).toLocaleString()}%0A`;
    message += `🚚 *Domicilio:* $${CONFIG.prices.domicilio.toLocaleString()}%0A`;
    message += `💵 *TOTAL:* $${order.total.toLocaleString()}%0A%0A`;
    message += `¡Listo para enviar el comprobante de pago!`;

    const whatsappUrl = `https://wa.me/${CONFIG.whatsapp}?text=${message}`;
    window.location.href = whatsappUrl;
}

function resetOrder() {
    state.order = {
        personal: { quantity: 0, salsa: '' },
        familiar: { quantity: 0 }
    };
    document.getElementById('personal-quantity').textContent = '0';
    document.getElementById('familiar-quantity').textContent = '0';
    document.querySelectorAll('input[name="personal-salsa"]').forEach(radio => radio.checked = false);
    updateTotal();
}

// ==================== PANEL ADMINISTRADOR ====================
function showAdminPanel() {
    document.getElementById('customer-view').style.display = 'none';
    document.getElementById('admin-view').style.display = 'block';
    document.getElementById('admin-welcome').textContent = `Hola, ${state.currentAdmin.name}`;
}

function initializeAdminPanel() {
    updateDashboard();
    loadOrders();
    loadProducts();
    initializeCharts();
}

function updateDashboard() {
    // Actualizar estadísticas
    document.getElementById('total-sales').textContent = `$${state.analytics.totalSales.toLocaleString()}`;
    document.getElementById('total-orders').textContent = state.analytics.totalOrders;
    document.getElementById('total-customers').textContent = state.analytics.totalCustomers;
    document.getElementById('popular-product').textContent = state.analytics.popularProduct || '-';
}

function updateAnalytics(order) {
    // Actualizar analytics con nueva orden
    state.analytics.totalSales += order.total;
    state.analytics.totalOrders++;
    state.analytics.totalCustomers = new Set(state.orders.map(o => o.customer.phone)).size;
    
    // Calcular producto popular
    const productCounts = {};
    state.orders.forEach(order => {
        order.items.forEach(item => {
            const productName = item.type === 'personal' ? 'Caja Personal' : 'Caja Familiar';
            productCounts[productName] = (productCounts[productName] || 0) + item.quantity;
        });
    });
    
    const popularProduct = Object.keys(productCounts).reduce((a, b) => 
        productCounts[a] > productCounts[b] ? a : b, '');
    state.analytics.popularProduct = popularProduct;
    
    updateDashboard();
    updateCharts();
}

function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';
    
    if (state.orders.length === 0) {
        ordersList.innerHTML = '<p>No hay pedidos registrados</p>';
        return;
    }
    
    state.orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card-admin';
        orderElement.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-id">Pedido #${order.id}</div>
                    <div><strong>${order.customer.name}</strong> - ${order.customer.phone}</div>
                    <div>${order.customer.address}</div>
                    ${order.customer.notes ? `<div>📝 ${order.customer.notes}</div>` : ''}
                    <div>Total: $${order.total.toLocaleString()}</div>
                </div>
                <div class="order-status status-${order.status}">
                    ${order.status === 'pending' ? 'Pendiente' : 
                      order.status === 'preparing' ? 'En Preparación' : 'Entregado'}
                </div>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div>${item.quantity}x ${item.type === 'personal' ? 'Caja Personal' : 'Caja Familiar'} ${item.salsa ? `- ${getSalsaName(item.salsa)}` : ''}</div>
                `).join('')}
            </div>
            <div class="order-actions">
                ${order.status === 'pending' ? 
                    `<button class="action-btn btn-prepare" onclick="updateOrderStatus('${order.id}', 'preparing')">
                        <i class="fas fa-utensils"></i> En Preparación
                    </button>` : ''}
                ${order.status === 'preparing' ? 
                    `<button class="action-btn btn-deliver" onclick="updateOrderStatus('${order.id}', 'delivered')">
                        <i class="fas fa-check"></i> Entregado
                    </button>` : ''}
                <button class="action-btn" onclick="contactCustomer('${order.customer.phone}')" style="background: #25D366; color: white;">
                    <i class="fab fa-whatsapp"></i> Contactar
                </button>
            </div>
        `;
        ordersList.appendChild(orderElement);
    });
}

function filterOrders(filter) {
    const orders = document.querySelectorAll('.order-card-admin');
    orders.forEach(order => {
        const status = order.querySelector('.order-status').className;
        if (filter === 'all' || status.includes(filter)) {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
}

function updateOrderStatus(orderId, newStatus) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        loadOrders();
    }
}

function contactCustomer(phone) {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
}

function loadProducts() {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '';
    
    state.products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card-admin';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p><strong>Precio: $${product.price.toLocaleString()}</strong></p>
            <div class="order-actions">
                <button class="action-btn" style="background: var(--info); color: white;" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        productsList.appendChild(productElement);
    });
}

function showAddProductForm() {
    const name = prompt('Nombre del producto:');
    if (!name) return;
    
    const description = prompt('Descripción:');
    const price = parseInt(prompt('Precio:'));
    const image = prompt('URL de la imagen:');
    
    if (description && price && image) {
        const newProduct = {
            id: state.products.length + 1,
            name,
            description,
            price,
            promoPrice: price,
            category: 'product',
            image
        };
        
  
