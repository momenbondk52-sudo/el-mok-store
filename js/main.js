document.addEventListener("DOMContentLoaded", () => {
    // ======================================================
    // 1. الإعدادات والمتغيرات الأساسية
    // ======================================================
    const WHATSAPP_NUMBER = "201069565078";
    const SHIPPING_COST = 50;

    let currentUser = null;
    let cart = [];
    let favorites = [];
    let selectedSubscription = null; // لتخزين الاشتراك المختار مؤقتًا

    // ======================================================
    // 2. إدارة المستخدمين والبيانات (Firebase & LocalStorage)
    // ======================================================
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            const guestCart = JSON.parse(localStorage.getItem('guestCart'));
            const userData = await getUserData(user.uid);
            
            if (guestCart && guestCart.length > 0) {
                cart = [...userData.cart, ...guestCart];
                localStorage.removeItem('guestCart');
            } else {
                cart = userData.cart || [];
            }
            favorites = userData.favorites || [];
            await saveData();
        } else {
            currentUser = null;
            cart = JSON.parse(localStorage.getItem('guestCart')) || [];
            favorites = [];
        }
        updateUI();
        runPageSpecificFunctions();
    });

    const updateUI = () => {
        const userNav = document.getElementById('user-nav');
        if (userNav) {
            if (currentUser) {
                // **التعديل هنا: استخدام الاسم الكامل**
                const userName = currentUser.displayName || currentUser.email.split('@')[0];
                userNav.innerHTML = `<span style="margin-left: 1rem;">أهلاً، ${userName}</span><a href="#" id="logout-btn">تسجيل الخروج</a>`;
                document.getElementById('logout-btn').addEventListener('click', e => {
                    e.preventDefault();
                    auth.signOut();
                });
            } else {
                userNav.innerHTML = `<a href="login.html">تسجيل الدخول</a>`;
            }
        }
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCountEl.textContent = totalItems;
        }
    };

    const saveData = async () => {
        if (currentUser) {
            await updateUserData(currentUser.uid, { cart, favorites });
        } else {
            localStorage.setItem('guestCart', JSON.stringify(cart));
        }
        updateUI();
    };

    // ======================================================
    // 3. دوال عامة (تضاف للسلة، المفضلة، إلخ)
    // ======================================================
    window.addItemToCart = async (productId, weight, quantity) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const price = product.prices[weight];
        const existingItemIndex = cart.findIndex(item => item.id === productId && item.weight == weight && item.type === 'product');

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({ type: 'product', id: productId, name: product.name, weight, quantity, price, image: product.image });
        }
        await saveData();
        alert(`تمت إضافة "${product.name}" إلى السلة.`);
    };

    window.removeItemFromCart = async (index) => {
        cart.splice(index, 1);
        await saveData();
        runPageSpecificFunctions();
    };

    window.addItemToFavorites = async (productId) => {
        if (!currentUser) {
            alert("يجب تسجيل الدخول أولاً لإضافة منتجات للمفضلة.");
            window.location.href = 'login.html';
            return;
        }
        if (!favorites.some(fav => fav.id === productId)) {
            favorites.push({ id: productId });
            await saveData();
            alert("تمت الإضافة إلى المفضلة بنجاح.");
        } else {
            alert("المنتج موجود بالفعل في المفضلة.");
        }
    };
    
    window.removeItemFromFavorites = async (productId) => {
        favorites = favorites.filter(fav => fav.id !== productId);
        await saveData();
        runPageSpecificFunctions();
    };

    // ======================================================
    // 4. دوال خاصة بكل صفحة
    // ======================================================

    const renderHomePage = () => {
        const container = document.getElementById('products-grid');
        if (!container) return;
        container.innerHTML = products.map(p => `
            <div class="product-card">
                <a href="product.html?id=${p.id}" class="product-card-link">
                    <img src="${p.image}" alt="${p.name}">
                    <h3>${p.name}</h3>
                </a>
                <div class="product-card-controls">
                    <p>${p.description}</p>
                    <div class="product-card-actions">
                         <a href="product.html?id=${p.id}" class="cta-button">عرض المنتج</a>
                         <button onclick="addItemToFavorites(${p.id})" class="cta-button secondary">أضف للمفضلة</button>
                    </div>
                </div>
            </div>`).join('');
    };
    
    const renderProductDetailsPage = () => {
        const container = document.getElementById('product-details');
        if (!container) return;
        const productId = parseInt(new URLSearchParams(window.location.search).get('id'));
        const product = products.find(p => p.id === productId);
        if (!product) { container.innerHTML = "<h2>المنتج غير موجود.</h2>"; return; }

        const weightOptions = Object.keys(product.prices).map(weight =>
            `<option value="${weight}">${weight} جرام (${product.prices[weight]} جنيه)</option>`
        ).join('');

        container.innerHTML = `
            <div class="product-detail-layout">
                <img src="${product.image}" alt="${product.name}" class="product-detail-image">
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <p>${product.description}</p>
                    <div class="product-detail-controls">
                        <div class="form-group">
                            <label for="weight-select">اختر الوزن:</label>
                            <select id="weight-select">${weightOptions}</select>
                        </div>
                        <div class="form-group">
                            <label for="quantity-input">الكمية:</label>
                            <input type="number" id="quantity-input" value="1" min="1">
                        </div>
                        <div class="product-detail-actions">
                            <button id="add-to-cart-btn" class="cta-button">أضف للسلة</button>
                            <button id="add-to-fav-btn" class="cta-button secondary">أضف للمفضلة</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            const weight = document.getElementById('weight-select').value;
            const quantity = parseInt(document.getElementById('quantity-input').value);
            addItemToCart(productId, weight, quantity);
        });
        document.getElementById('add-to-fav-btn').addEventListener('click', () => addItemToFavorites(productId));
    };
    
    const renderSubscriptionsPage = () => {
        const container = document.getElementById('subscriptions-grid');
        if (!container) return;
        container.innerHTML = subscriptions.map(sub => `
            <div class="subscription-card">
                <h3>${sub.title}</h3>
                <p class="price">${sub.price} <span>جنيه ${sub.billing_cycle}</span></p>
                <ul>${sub.features.map(f => `<li>${f}</li>`).join('')}</ul>
                <button class="cta-button" onclick="openSubscriptionModal('${sub.id}')">اشترك الآن</button>
            </div>`).join('');
    };

    const modal = document.getElementById('coffee-type-modal');
    window.openSubscriptionModal = (subscriptionId) => {
        if (!currentUser) {
            alert("يجب تسجيل الدخول أولاً للاشتراك.");
            window.location.href = 'login.html';
            return;
        }
        selectedSubscription = subscriptions.find(s => s.id === subscriptionId);
        const optionsContainer = document.getElementById('modal-options');
        if(optionsContainer){
            optionsContainer.innerHTML = products.map(p => 
                `<button class="cta-button" onclick="selectCoffeeForSub('${p.name}')">${p.name}</button>`
            ).join('');
        }
        if(modal) modal.classList.add('active');
    };
    
    if (modal) {
        document.getElementById('modal-close-btn').addEventListener('click', () => modal.classList.remove('active'));
    }

    window.selectCoffeeForSub = async (coffeeName) => {
        if (!selectedSubscription) return;
        cart.push({
            type: 'subscription',
            id: selectedSubscription.id,
            name: `اشتراك ${selectedSubscription.title} (${coffeeName})`,
            price: selectedSubscription.price,
            quantity: 1,
            image: 'media/logo.png' // صورة افتراضية للاشتراك
        });
        await saveData();
        if(modal) modal.classList.remove('active');
        window.location.href = 'checkout.html';
    };

    const renderCartPage = () => {
        const container = document.getElementById('cart-container');
        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = "<h2>سلة التسوق فارغة.</h2>";
            return;
        }
        
        const subtotal = cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
        const total = subtotal + SHIPPING_COST;

        container.innerHTML = `
            <div class="cart-items">
                ${cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        ${item.type === 'product' ? `<p>الوزن: ${item.weight} جرام | الكمية: ${item.quantity}</p>` : '<p>اشتراك</p>'}
                        <p class="price">${item.price * (item.quantity || 1)} جنيه</p>
                    </div>
                    <button class="remove-btn" onclick="removeItemFromCart(${index})">&times;</button>
                </div>
                `).join('')}
            </div>
            <div class="cart-summary">
                <h3>ملخص الطلب</h3>
                <p><span>المجموع:</span> <span>${subtotal} جنيه</span></p>
                <p><span>تكلفة الشحن:</span> <span>${SHIPPING_COST} جنيه</span></p>
                <hr>
                <p class="total"><span>الإجمالي:</span> <span>${total} جنيه</span></p>
                <a href="checkout.html" class="cta-button" style="width: 100%;">الانتقال للدفع</a>
            </div>
        `;
    };

    const renderFavoritesPage = () => {
        const container = document.getElementById('favorites-grid');
        if (!container) return;
        if (!currentUser) {
            container.innerHTML = "<h2>الرجاء تسجيل الدخول لعرض قائمة المفضلة.</h2>";
            return;
        }
        if (favorites.length === 0) {
            container.innerHTML = "<h2>قائمة المفضلة فارغة.</h2>";
            return;
        }
        container.innerHTML = favorites.map(favItem => {
            const product = products.find(p => p.id === favItem.id);
            if (!product) return '';
            return `
            <div class="product-card">
                <a href="product.html?id=${product.id}" class="product-card-link">
                    <img src="${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                </a>
                <div class="product-card-controls">
                     <p>${product.description}</p>
                    <div class="product-card-actions">
                        <a href="product.html?id=${product.id}" class="cta-button">عرض المنتج</a>
                        <button class="cta-button secondary" onclick="removeItemFromFavorites(${product.id})">إزالة</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    };
    
    const handleCheckoutPage = () => {
        if (!currentUser) {
            alert("يجب تسجيل الدخول لإتمام عملية الشراء.");
            window.location.href = 'login.html';
            return;
        }
        const form = document.getElementById('checkout-form');
        const summaryContainer = document.getElementById('order-summary');
        const nameInput = document.getElementById('name');

        if(nameInput && currentUser && currentUser.displayName){
            nameInput.value = currentUser.displayName;
        }
        
        if (!form || !summaryContainer) return;
        
        const subtotal = cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
        const total = subtotal + SHIPPING_COST;

        summaryContainer.innerHTML = `
            <h3>ملخص طلبك</h3>
             ${cart.map(item => `<p>${item.name} (${item.quantity || 1})</p>`).join('')}
            <hr>
            <p>المجموع: <b>${subtotal} جنيه</b></p>
            <p>الشحن: <b>${SHIPPING_COST} جنيه</b></p>
            <p class="total">الإجمالي: <b>${total} جنيه</b></p>
        `;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = form['name'].value;
            const address = form['address'].value;
            const paymentMethod = form['payment-method'].value;

            let message = `*طلب جديد من متجر EL-MOK*\n\n`;
            message += `*العميل:* ${name}\n*العنوان:* ${address}\n*الدفع:* ${paymentMethod}\n\n--- *الطلب* ---\n`;
            cart.forEach(item => {
                const itemDetails = item.type === 'product' ? `(${item.weight} جرام) x ${item.quantity}` : '(اشتراك)';
                message += `- ${item.name} ${itemDetails}\n`;
            });
            message += `\n*الإجمالي المطلوب:* ${total} جنيه`;

            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
            
            cart = [];
            await saveData();
            alert("تم إرسال طلبك بنجاح! سيتم توجيهك للصفحة الرئيسية.");
            window.location.href = 'index.html';
        });
    };

    // ======================================================
    // 5. مشغل الدوال (Router)
    // ======================================================
    const runPageSpecificFunctions = () => {
        const pageId = document.body.id;
        if (pageId === 'home-page') renderHomePage();
        if (pageId === 'product-page') renderProductDetailsPage();
        if (pageId === 'subscriptions-page') renderSubscriptionsPage();
        if (pageId === 'cart-page') renderCartPage();
        if (pageId === 'favorites-page') renderFavoritesPage();
        if (pageId === 'checkout-page') handleCheckoutPage();
    };
});