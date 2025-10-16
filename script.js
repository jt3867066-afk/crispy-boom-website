// ==================== CONFIGURACIÓN INICIAL ====================
const CONFIG = {
    whatsapp: "573144751047",
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
    admins: [
        { email: 'admin@crispyboom.com', password: 'admin123', name: 'Administrador Principal' }
    ],
    products: [
        {
            id: 1,
            name: 'Caja Personal',
            description: '2 Choribolas + 1 Salsa a elección',
            price: 7000,
            promoPrice: 7000,
            category: 'combo'
        },
        {
            id: 2,
            name: 'Caja Familiar',
            description: '6 Choribolas + Las 3 Salsas de la casa',
            price: 21000,
            promoPrice: 21000,
            category: 'combo'
        }
    ],
    currentAdmin: null
};

// ==================== FUNCIONES DE INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousel();
    initializeEventListeners();
    updatePromotionDisplay();
    updateTotal();
    loadSampleData();
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

function initializeEventListeners() {
    // Admin login
    document.getElementById('admin-login-btn').addEventListener('click', () => {
        showLoginModal();
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
}

function showLoginModal() {
    const email = prompt('Email administrador:');
    if (email) {
        const password = prompt('Contraseña:');
        
        const admin = state.admins.find(a => a.email === email && a.password === password);
        if (admin) {
            state.currentAdmin = admin;
            alert('✅ Acceso concedido al panel admin\n\nEn una versión completa aquí se mostraría el panel de administración para gestionar pedidos.');
        } else {
            alert('❌ Credenciales incorrectas\n\nPrueba con:\nEmail: admin@crispyboom.com\nContraseña: admin123');
        }
    }
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

    // Simulamos el formulario con prompts
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

    // Agregar a órdenes
    state.orders.push(order);
    
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
    
    // ✅ USAMOS location.href PARA MEJOR COMPATIBILIDAD EN CELULAR
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

// ==================== UTILIDADES ====================
function scrollToOrder() {
    document.getElementById('pedido').scrollIntoView({ behavior: 'smooth' });
}

function scrollToProduct() {
    document.getElementById('producto').scrollIntoView({ behavior: 'smooth' });
}

function loadSampleData() {
    // Datos de ejemplo para demostración
    console.log('✅ Crispy Boom - Página cargada correctamente');
    console.log('📞 WhatsApp: ' + CONFIG.whatsapp);
    console.log('🛒 Productos cargados: ' + state.products.length);
}

// ==================== ANIMACIONES ====================
document.addEventListener('DOMContentLoaded', () => {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach((highlight, index) => {
        highlight.style.animationDelay = `${index * 0.2}s`;
    });
});

// ==================== DETECCIÓN DE DOMINGOS ====================
function checkDayOfWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    console.log(`📅 Hoy es ${dayNames[dayOfWeek]} - Promoción 2x1: ${isPromoActive() ? 'ACTIVA' : 'INACTIVA'}`);
}

// Ejecutar detección de día
checkDayOfWeek();
