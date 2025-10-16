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
    comments: [],
    products: [
        {
            id: 1,
            name: 'Caja Personal',
            description: '2 Choribolas + 1 Salsa a elección',
            price: 7000,
            promoPrice: 7000,
            category: 'combo',
            image: 'https://i.ibb.co/tMb1N7td/IMG-20250915-170950.jpg'
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
    initializeVideoPlayer();
    updatePromotionDisplay();
    updateTotal();
    loadSampleData();
    initializeAdminAccess();
    loadComments();
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

function initializeVideoPlayer() {
    const videos = [
        'https://drive.google.com/uc?export=download&id=1gFNuumQI27k_C33RX5L_0pqqAuwqC-pl',
        'https://drive.google.com/uc?export=download&id=1gwngRBw7D7Fq7c8j8nASpp8BmTEKeLt8'
    ];
    
    let currentVideoIndex = 0;
    const videoPlayer = document.getElementById('video-player');
    const videoSource = document.getElementById('video-source');
    
    function loadVideo(index) {
        videoSource.src = videos[index];
        videoPlayer.load();
        videoPlayer.play().catch(e => console.log('Autoplay prevented:', e));
    }
    
    videoPlayer.addEventListener('ended', function() {
        currentVideoIndex = (currentVideoIndex + 1) % videos.length;
        loadVideo(currentVideoIndex);
    });
    
    // Cargar primer video
    loadVideo(0);
}

function initializeAdminAccess() {
    // Ocultar botón admin para usuarios normales
    document.getElementById('admin-access-btn').style.display = 'none';
    
    // Configurar acceso por 3 toques en "Crispy Boom"
    const crispyBoomText = document.getElementById('crispy-boom-text');
    let tapCount = 0;
    let tapTimer;
    
    crispyBoomText.addEventListener('click', function() {
        tapCount++;
        
        if (tapCount === 1) {
            tapTimer = setTimeout(() => {
                tapCount = 0;
            }, 1000);
        } else if (tapCount === 3) {
            clearTimeout(tapTimer);
            tapCount = 0;
            showLoginModal();
        }
    });
}

function showLoginModal() {
    document.getElementById('admin-login-modal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('admin-login-modal').style.display = 'none';
}

function initializeEventListeners() {
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

    // Comment form
    document.getElementById('comment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addComment();
    });

    // Admin settings form
    document.getElementById('admin-settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateAdminCredentials();
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
    window.open(whatsappUrl, '_blank');
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

// ==================== SISTEMA DE COMENTARIOS ====================
function loadComments() {
    const savedComments = localStorage.getItem('crispyBoomComments');
    if (savedComments) {
        state.comments = JSON.parse(savedComments);
    }
    renderComments();
    renderAdminComments();
}

function saveComments() {
    localStorage.setItem('crispyBoomComments', JSON.stringify(state.comments));
}

function addComment() {
    const nameInput = document.getElementById('comment-name');
    const textInput = document.getElementById('comment-text');
    
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    
    if (!name || !text) {
        alert('Por favor completa tu nombre y comentario.');
        return;
    }
    
    const newComment = {
        id: Date.now().toString(),
        author: name,
        text: text,
        date: new Date().toISOString(),
        likes: 0,
        liked: false,
        replies: [],
        isAdmin: false
    };
    
    state.comments.unshift(newComment);
    saveComments();
    renderComments();
    renderAdminComments();
    
    // Limpiar formulario
    nameInput.value = '';
    textInput.value = '';
    
    alert('¡Comentario publicado!');
}

function renderComments() {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    
    if (state.comments.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: #666;">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
        return;
    }
    
    state.comments.forEach(comment => {
        const commentElement = createCommentElement(comment, false);
        commentsList.appendChild(commentElement);
    });
}

function renderAdminComments() {
    if (!state.currentAdmin) return;
    
    const adminCommentsList = document.getElementById('admin-comments-list');
    if (!adminCommentsList) return;
    
    adminCommentsList.innerHTML = '';
    
    if (state.comments.length === 0) {
        adminCommentsList.innerHTML = '<p>No hay comentarios para moderar</p>';
        return;
    }
    
    state.comments.forEach(comment => {
        const commentElement = createCommentElement(comment, true);
        adminCommentsList.appendChild(commentElement);
    });
}

function createCommentElement(comment, isAdminView) {
    const commentDiv = document.createElement('div');
    commentDiv.className = isAdminView ? 'admin-comment-card' : 'comment-card';
    commentDiv.id = `comment-${comment.id}`;
    
    const date = new Date(comment.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <div>
                <span class="comment-author">${comment.author}</span>
                ${comment.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            </div>
            <span class="comment-date">${date}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
        <div class="comment-actions">
            <button class="like-btn ${comment.liked ? 'liked' : ''}" onclick="toggleLike('${comment.id}')">
                <i class="fas fa-heart"></i> <span class="like-count">${comment.likes}</span>
            </button>
            <button class="reply-btn" onclick="showReplyForm('${comment.id}')">
                <i class="fas fa-reply"></i> Responder
            </button>
            ${isAdminView ? `<button class="delete-comment-btn" onclick="deleteComment('${comment.id}')">
                <i class="fas fa-trash"></i> Eliminar
            </button>` : ''}
        </div>
        <div class="reply-form" id="reply-form-${comment.id}" style="display: none;">
            <textarea id="reply-text-${comment.id}" placeholder="Escribe tu respuesta..." rows="2"></textarea>
            <button class="btn btn-primary" onclick="addReply('${comment.id}')">Enviar Respuesta</button>
            <button class="btn btn-outline" onclick="hideReplyForm('${comment.id}')">Cancelar</button>
        </div>
        ${comment.replies && comment.replies.length > 0 ? `
            <div class="replies-list">
                ${comment.replies.map(reply => `
                    <div class="reply-card">
                        <div class="reply-header">
                            <span class="reply-author">${reply.author} ${reply.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}</span>
                            <span class="comment-date">${new Date(reply.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="comment-text">${reply.text}</div>
                        ${isAdminView ? `<button class="delete-comment-btn" onclick="deleteReply('${comment.id}', '${reply.id}')" style="margin-top: 5px;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    return commentDiv;
}

function toggleLike(commentId) {
    const comment = state.comments.find(c => c.id === commentId);
    if (!comment) return;
    
    if (comment.liked) {
        comment.likes--;
        comment.liked = false;
    } else {
        comment.likes++;
        comment.liked = true;
    }
    
    saveComments();
    renderComments();
    renderAdminComments();
}

function showReplyForm(commentId) {
    document.querySelectorAll('.reply-form').forEach(form => {
        form.style.display = 'none';
    });
    docum
