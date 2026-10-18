<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "@/components/shared/modal.vue";

const store = useAdmin();
const checkPermission = store.checkPermission;
const router = useRouter();

// State
const loading = ref(false);
const searchQuery = ref("");
const barcodeInput = ref("");
const searchResults = ref([]);
const cart = ref([]);
const customerPhone = ref("");
const customer = ref(null);
const orderDiscount = ref(0);
const payments = ref([
    { method: 'cash', amount: 0 }
]);

const showVariantModal = ref(false);
const selectedProduct = ref(null);

const searchInput = ref(null);
const barcodeInputRef = ref(null);

// Computed
const cartTotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.total, 0);
});

const finalTotal = computed(() => {
    return Math.max(0, cartTotal.value - orderDiscount.value);
});

const totalPaid = computed(() => {
    return payments.value.reduce((sum, p) => sum + (p.amount || 0), 0);
});

const remainingAmount = computed(() => {
    return finalTotal.value - totalPaid.value;
});

const paymentMatch = computed(() => {
    return totalPaid.value >= finalTotal.value;
});

const canSubmitOrder = computed(() => {
    return cart.value.length > 0 &&
        customerPhone.value &&
        paymentMatch.value &&
        !loading.value;
});

// Methods
// در ابتدای فایل، یک متغیر برای ذخیره controller تعریف کن
let searchController = null;

async function searchProducts() {
    // اگر قبلاً درخواستی در حال اجراست، آن را کنسل کن
    if (searchController) {
        searchController.abort();
    }

    if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
    }

    // ایجاد controller جدید
    searchController = new AbortController();

    try {
        const { data } = await axios.get('/pos/products/search', {
            params: { q: searchQuery.value },
            signal: searchController.signal // ارسال سیگنال برای کنسل کردن
        });
        searchResults.value = data.data || [];
    } catch (err) {
        // اگر درخواست کنسل شده باشه، خطا رو نادیده بگیر
        if (axios.isCancel(err) || err.name === 'AbortError') {
            console.log('Search request cancelled');
            return;
        }
        console.error('Search error:', err);
    } finally {
        searchController = null;
    }
}

function addFirstProduct() {
    if (searchResults.value.length > 0) {
        addToCart(searchResults.value[0]);
    }
}
let barcodeTimeout = null;

async function handleBarcode() {
    // اگر مقدار بارکد کمتر از ۳ کاراکتر باشه، نادیده بگیر
    if (barcodeInput.value.length < 3) return;

    // تاخیر برای اطمینان از کامل شدن بارکد
    clearTimeout(barcodeTimeout);
    barcodeTimeout = setTimeout(async () => {
        try {
            // کنسل کردن درخواست قبلی
            if (searchController) {
                searchController.abort();
                searchController = null;
            }

            searchController = new AbortController();

            const { data } = await axios.get('/pos/products/search-by-barcode', {
                params: { barcode: barcodeInput.value },
                signal: searchController.signal
            });

            if (data.success && data.data) {
                const { product, variant } = data.data;
                // اضافه کردن مستقیم به سبد با تنوع پیدا شده
                addVariantToCart(product, variant);
                barcodeInput.value = "";
                searchQuery.value = "";
                searchResults.value = [];
            } else {
                Swal.fire('خطا', data.message || 'محصولی یافت نشد', 'error');
                barcodeInput.value = "";
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error('Barcode error:', err);
            Swal.fire('خطا', 'مشکلی در جستجوی بارکد پیش آمد', 'error');
        } finally {
            searchController = null;
        }
    }, 300);
}

// تابع جدید برای اضافه کردن مستقیم تنوع به سبد
function addVariantToCart(product, variant) {
    if (variant.stock < 1) {
        Swal.fire('خطا', 'موجودی این تنوع کافی نیست', 'error');
        return;
    }

    const existingItem = cart.value.find(item =>
        item.id === product.id && item.variant_id === variant.id
    );

    if (existingItem) {
        existingItem.quantity += 1;
        updateCart();
    } else {
        cart.value.push({
            id: product.id,
            variant_id: variant.id,
            title: product.title + ' - ' + (variant.sku || ''),
            sku: variant.sku,
            unit_price: variant.price,
            quantity: 1,
            discount: 0,
            total: variant.price,
            stock: variant.stock
        });
    }
}


function addToCart(product) {
    // اگه محصول تنوع نداره، خطا بده (چون همه باید داشته باشن)
    if (!product.variants || product.variants.length === 0) {
        Swal.fire('خطا', 'این محصول تنوع ندارد', 'error');
        return;
    }

    // اگر فقط یک تنوع داره، مستقیم اضافه کن
    if (product.variants.length === 1) {
        addVariantToCart(product, product.variants[0]);
        return;
    }

    // اگر چند تنوع داره، مودال رو باز کن
    selectedProduct.value = product;
    showVariantModal.value = true;
}



function selectVariant(variant) {
    if (variant.stock < 1) {
        Swal.fire('خطا', 'موجودی این تنوع کافی نیست', 'error');
        return;
    }

    const product = selectedProduct.value;
    addVariantToCart(product, variant);

    showVariantModal.value = false;
    selectedProduct.value = null;
    searchQuery.value = "";
    searchResults.value = [];
    nextTick(() => searchInput.value?.focus());
}
function updateQuantity(index, delta) {
    const item = cart.value[index];
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.stock) {
        Swal.fire('خطا', 'موجودی کافی نیست', 'error');
        return;
    }
    item.quantity = newQty;
    updateCart();
}

function updateCart() {
    cart.value.forEach(item => {
        // تخفیف به تومان: از قیمت کل کم میشه
        const discountAmount = item.discount || 0;
        item.total = (item.unit_price * item.quantity) - discountAmount;
        // اگر تخفیف بیشتر از قیمت کل بود، صفر کن
        if (item.total < 0) item.total = 0;
    });
}

function removeFromCart(index) {
    cart.value.splice(index, 1);
}

function clearCart() {
    Swal.fire({
        title: 'خالی کردن سبد؟',
        text: 'آیا مطمئن هستید؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'بله',
        cancelButtonText: 'انصراف'
    }).then(result => {
        if (result.isConfirmed) {
            cart.value = [];
            orderDiscount.value = 0;
        }
    });
}

function clearSearch() {
    searchQuery.value = "";
    searchResults.value = [];
    nextTick(() => searchInput.value?.focus());
}

async function findCustomer() {
    if (!customerPhone.value) return;
    try {
        const { data } = await axios.get('/users', {
            params: { search: customerPhone.value, role: 'customer' }
        });
        if (data.data && data.data.length > 0) {
            customer.value = data.data[0];
        } else {
            // ثبت مشتری جدید
            const result = await Swal.fire({
                title: 'مشتری جدید',
                text: 'این شماره در سیستم موجود نیست. آیا می‌خواهید ثبت نام کند؟',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'بله',
                cancelButtonText: 'خیر'
            });
            if (result.isConfirmed) {
                const { data: newUser } = await axios.post('/users', {
                    full_name: 'مشتری جدید',
                    mobile: customerPhone.value,
                    password: '12345678',
                    is_active: true
                });
                customer.value = newUser.data;
                Swal.fire('موفق', 'مشتری ثبت شد', 'success');
            }
        }
    } catch (err) {
        console.error('Find customer error:', err);
        Swal.fire('خطا', 'مشکلی در پیدا کردن مشتری پیش آمد', 'error');
    }
}

function clearCustomer() {
    customer.value = null;
    customerPhone.value = "";
}

function addPayment() {
    payments.value.push({ method: 'cash', amount: 0 });
}

function removePayment(index) {
    payments.value.splice(index, 1);
}

function updatePaymentTotal() {
    // این تابع برای رفرش محاسبات استفاده میشه
}

async function submitOrder() {
    if (!canSubmitOrder.value) return;

    const result = await Swal.fire({
        title: 'تایید سفارش',
        html: `
      <div class="text-end">
        <p><strong>مبلغ کل:</strong> ${formatPrice(finalTotal.value)}</p>
        <p><strong>روش پرداخت:</strong> ${payments.value.map(p => p.method).join(' + ')}</p>
        <p><strong>مبلغ پرداختی:</strong> ${formatPrice(totalPaid.value)}</p>
      </div>
    `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ثبت سفارش',
        cancelButtonText: 'انصراف'
    });

    if (!result.isConfirmed) return;

    loading.value = true;
    try {
        const payload = {
            user_phone: customerPhone.value,
            items: cart.value.map(item => ({
                product_id: item.id,
                variant_id: item.variant_id || null,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_amount: item.discount || 0 // تخفیف به تومان
            })),
            payments: payments.value.map(p => ({
                method: p.method,
                amount: p.amount
            })),
            discount_amount: orderDiscount.value, // تخفیف کل به تومان
            notes: ''
        };

        const { data } = await axios.post('/pos/orders', payload);
        Swal.fire('موفق', 'سفارش با موفقیت ثبت شد', 'success');

        // پرینت فاکتور
        if (data.data) {
            const orderUrl = `/pos/order/print/${data.data.id}`;
            window.open(orderUrl, '_blank');
        }

        resetForm();
    } catch (err) {
        console.error('Submit error:', err);
        Swal.fire('خطا', err.response?.data?.message || 'مشکلی در ثبت سفارش پیش آمد', 'error');
    } finally {
        loading.value = false;
    }
}

function resetForm() {
    cart.value = [];
    orderDiscount.value = 0;
    payments.value = [{ method: 'cash', amount: 0 }];
    customer.value = null;
    customerPhone.value = "";
    searchQuery.value = "";
    searchResults.value = [];
    nextTick(() => searchInput.value?.focus());
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

onMounted(() => {
    nextTick(() => searchInput.value?.focus());
});
</script>
<template>
    <div class="pos-container" v-if="checkPermission(['pos_store'])">
        <div class="row g-0">
            <!-- ستون سمت چپ: جستجو و سبد خرید -->
            <div class="col-md-8 pe-3">
                <!-- جستجو -->
                <div class="pos-card pos-card-search mb-3">
                    <div class="pos-card-body">
                        <div class="search-wrapper">
                            <div class="search-input-group">
                                <span class="search-icon">
                                    <i class="bi bi-search"></i>
                                </span>
                                <input v-model="searchQuery" type="text" class="search-input"
                                    placeholder="جستجو با نام، بارکد یا SKU..." @input="searchProducts"
                                    @keydown.enter.prevent="addFirstProduct" ref="searchInput" />
                                <button class="search-clear" @click="clearSearch" v-if="searchQuery">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <input v-model="barcodeInput" type="text" @input="handleBarcode" ref="barcodeInput"
                                class="barcode-hidden-input" />
                        </div>

                        <!-- نتایج جستجو -->
                        <div v-if="searchResults.length > 0 && searchQuery" class="search-results">
                            <div v-for="product in searchResults" :key="product.id" class="search-result-item"
                                @click="addToCart(product)">
                                <div class="result-info">
                                    <span class="result-title">{{ product.title }}</span>
                                    <span class="result-sku" v-if="product.sku">SKU: {{ product.sku }}</span>
                                    <span class="result-stock" :class="product.stock > 0 ? 'in-stock' : 'out-of-stock'">
                                        {{ product.stock > 0 ? 'موجودی: ' + product.stock : 'ناموجود' }}
                                    </span>
                                </div>
                                <div class="result-price">
                                    <span class="price">{{ formatPrice(product.price) }}</span>
                                    <span v-if="product.variants?.length" class="variant-badge">تنوع</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- سبد خرید -->
                <div class="pos-card">
                    <div class="pos-card-header">
                        <div class="header-left">
                            <i class="bi bi-cart3"></i>
                            <span>سبد خرید</span>
                            <span class="cart-badge">{{ cart.length }}</span>
                        </div>
                        <div class="header-right">
                            <button class="btn-clear-cart" @click="clearCart" v-if="cart.length">
                                <i class="bi bi-trash3"></i>
                                خالی کردن
                            </button>
                            <span class="cart-total">مجموع: {{ formatPrice(cartTotal) }}</span>
                        </div>
                    </div>
                    <div class="pos-card-body">
                        <div v-if="cart.length === 0" class="empty-cart">
                            <i class="bi bi-cart3 empty-icon"></i>
                            <p>سبد خرید خالی است</p>
                        </div>

                        <div v-else>
                            <table class="pos-table">
                                <thead>
                                    <tr>
                                        <th style="width: 30%;">محصول</th>
                                        <th style="width: 15%;">قیمت واحد</th>
                                        <th style="width: 15%;">تعداد</th>
                                        <th style="width: 20%;">تخفیف (تومان)</th>
                                        <th style="width: 15%;">جمع</th>
                                        <th style="width: 5%;">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, index) in cart" :key="index">
                                        <td>
                                            <div class="product-cell">
                                                <span class="product-title">{{ item.title }}</span>
                                                <span class="product-sku">{{ item.sku }}</span>
                                            </div>
                                        </td>
                                        <td>{{ formatPrice(item.unit_price) }}</td>
                                        <td>
                                            <div class="qty-control">
                                                <button class="qty-btn" @click="updateQuantity(index, -1)">
                                                    <i class="bi bi-dash"></i>
                                                </button>
                                                <input v-model.number="item.quantity" type="number" class="qty-input"
                                                    min="1" @change="updateCart" />
                                                <button class="qty-btn" @click="updateQuantity(index, 1)">
                                                    <i class="bi bi-plus"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <input v-model.number="item.discount" type="number" class="discount-input"
                                                min="0" placeholder="۰" @change="updateCart" />
                                        </td>
                                        <td class="item-total">{{ formatPrice(item.total) }}</td>
                                        <td>
                                            <button class="btn-remove" @click="removeFromCart(index)">
                                                <i class="bi bi-x-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <!-- تخفیف کل فاکتور -->
                            <div class="discount-row">
                                <div class="discount-label">تخفیف کل</div>
                                <div class="discount-input-wrapper">
                                    <input v-model.number="orderDiscount" type="number" class="discount-input-lg"
                                        placeholder="۰" min="0" @change="updateCart" />
                                    <span class="discount-unit">تومان</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ستون سمت راست: اطلاعات مشتری و پرداخت -->
            <div class="col-md-4 ps-3">
                <!-- اطلاعات مشتری -->
                <div class="pos-card mb-3">
                    <div class="pos-card-header">
                        <i class="bi bi-person"></i>
                        <span>اطلاعات مشتری</span>
                    </div>
                    <div class="pos-card-body">
                        <div class="customer-search">
                            <input v-model="customerPhone" type="text" class="customer-input" placeholder="شماره موبایل"
                                @keydown.enter="findCustomer" />
                            <button class="btn-customer-search" @click="findCustomer" :disabled="!customerPhone">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>

                        <div v-if="customer" class="customer-info">
                            <hr />
                            <div class="customer-details">
                                <div>
                                    <strong>{{ customer.full_name || 'مشتری' }}</strong>
                                    <div class="customer-phone">{{ customer.mobile }}</div>
                                </div>
                                <span class="customer-orders">{{ customer.orders_count || 0 }} سفارش</span>
                            </div>
                            <button class="btn-change-customer" @click="clearCustomer">
                                <i class="bi bi-x"></i>
                                تغییر مشتری
                            </button>
                        </div>
                    </div>
                </div>

                <!-- پرداخت -->
                <div class="pos-card pos-card-payment">
                    <div class="pos-card-header">
                        <i class="bi bi-credit-card"></i>
                        <span>پرداخت</span>
                    </div>
                    <div class="pos-card-body">
                        <div class="total-amount">
                            <label>مبلغ کل</label>
                            <h2>{{ formatPrice(finalTotal) }}</h2>
                        </div>

                        <div class="payment-methods">
                            <label>روش‌های پرداخت</label>
                            <div v-for="(payment, index) in payments" :key="index" class="payment-row">
                                <select v-model="payment.method" class="payment-select">
                                    <option value="cash">نقدی</option>
                                    <option value="card">کارت</option>
                                    <option value="transfer">انتقال</option>
                                </select>
                                <input v-model.number="payment.amount" type="number" class="payment-input"
                                    placeholder="مبلغ" min="0" @change="updatePaymentTotal" />
                                <button v-if="payments.length > 1" class="btn-remove-payment"
                                    @click="removePayment(index)">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                            <button class="btn-add-payment" @click="addPayment">
                                <i class="bi bi-plus"></i>
                                افزودن روش پرداخت
                            </button>
                        </div>

                        <div class="payment-summary" :class="paymentMatch ? 'summary-success' : 'summary-danger'">
                            <div class="summary-row">
                                <span>مبلغ پرداختی:</span>
                                <strong>{{ formatPrice(totalPaid) }}</strong>
                            </div>
                            <div class="summary-row">
                                <span>باقیمانده:</span>
                                <strong>{{ formatPrice(remainingAmount) }}</strong>
                            </div>
                        </div>

                        <div class="action-buttons">
                            <button class="btn-submit" @click="submitOrder" :disabled="!canSubmitOrder">
                                <i class="bi bi-check-circle"></i>
                                ثبت سفارش
                            </button>
                            <button class="btn-reset" @click="resetForm" :disabled="loading">
                                <i class="bi bi-arrow-counterclockwise"></i>
                                جدید
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- مودال انتخاب تنوع -->
        <Modal v-if="showVariantModal" id="showVariantModal" @closeModal="() => showVariantModal = false"
            :title="'انتخاب تنوع - ' + (selectedProduct?.title || '')">
            <div v-if="selectedProduct">
                <div class="variant-grid">
                    <div v-for="variant in selectedProduct.variants" :key="variant.id" class="variant-card"
                        @click="selectVariant(variant)">
                        <div class="variant-info">
                            <div class="variant-attributes">
                                <span v-for="(item, index) in variant.values" :key="index" class="variant-attr">
                                    {{ item.attribute?.name || 'مشخصه' }}: {{ item.value }}
                                </span>
                            </div>
                            <div class="variant-sku">{{ variant.sku || 'بدون SKU' }}</div>
                            <div class="variant-price">{{ formatPrice(variant.price) }}</div>
                            <span class="variant-stock" :class="variant.stock > 0 ? 'in-stock' : 'out-of-stock'">
                                موجودی: {{ variant.stock }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="variant-modal-actions">
                    <button class="btn-secondary" @click="showVariantModal = false">انصراف</button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<style scoped>
/* ===== Container ===== */
.pos-container {
    padding: 20px;
    background: #f0f2f5;
    min-height: calc(100vh - 60px);
}

/* ===== Cards ===== */
.pos-card {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.pos-card-search {
    border-bottom: 3px solid #2c7be5;
}

.pos-card-payment {
    border-top: 3px solid #2c7be5;
}

.pos-card-header {
    padding: 12px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
    color: #1a1a2e;
}

.pos-card-body {
    padding: 16px 20px;
}

/* ===== Search ===== */
.search-wrapper {
    position: relative;
}

.search-input-group {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    transition: all 0.2s;
}

.search-input-group:focus-within {
    border-color: #2c7be5;
    box-shadow: 0 0 0 3px rgba(44, 123, 229, 0.1);
}

.search-icon {
    padding: 0 12px;
    color: #6c757d;
    font-size: 18px;
}

.search-input {
    flex: 1;
    border: none;
    padding: 12px 0;
    font-size: 16px;
    outline: none;
    color:black;
    background: transparent;
    font-family: inherit;
}

.search-clear {
    background: none;
    border: none;
    padding: 0 12px;
    color: #6c757d;
    cursor: pointer;
    font-size: 16px;
}

.barcode-hidden-input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    z-index: -1;
}

/* ===== Search Results ===== */
.search-results {
    margin-top: 12px;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e9ecef;
    border-radius: 8px;
}

.search-result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #f1f3f5;
    cursor: pointer;
    transition: background 0.15s;
}

.search-result-item:hover {
    background: #f8f9fa;
}

.search-result-item:last-child {
    border-bottom: none;
}

.result-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.result-title {
    font-weight: 500;
    color: #1a1a2e;
}

.result-sku {
    font-size: 12px;
    color: #6c757d;
    background: #f1f3f5;
    padding: 2px 8px;
    border-radius: 4px;
}

.result-stock {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
}

.result-stock.in-stock {
    background: #d4edda;
    color: #155724;
}

.result-stock.out-of-stock {
    background: #f8d7da;
    color: #721c24;
}

.result-price {
    display: flex;
    align-items: center;
    gap: 8px;
}

.result-price .price {
    font-weight: 600;
    color: #2c7be5;
}

.variant-badge {
    font-size: 10px;
    background: #fff3cd;
    color: #856404;
    padding: 2px 8px;
    border-radius: 4px;
}

/* ===== Cart ===== */
.cart-badge {
    background: #2c7be5;
    color: #fff;
    border-radius: 50%;
    padding: 2px 10px;
    font-size: 13px;
    margin-right: 8px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.btn-clear-cart {
    background: none;
    border: none;
    color: #dc3545;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

.btn-clear-cart:hover {
    text-decoration: underline;
}

.cart-total {
    font-weight: 600;
    color: #28a745;
    font-size: 16px;
}

.empty-cart {
    text-align: center;
    padding: 40px 0;
    color: #6c757d;
}

.empty-icon {
    font-size: 48px;
    color: #dee2e6;
}

/* ===== Table ===== */
.pos-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.pos-table thead th {
    background: #f8f9fa;
    text-align: center;
    padding: 10px 8px;
    border-bottom: 2px solid #e9ecef;
    font-weight: 600;
    color: #495057;
}

.pos-table tbody td {
    text-align: center;
    padding: 8px;
    vertical-align: middle;
    border-bottom: 1px solid #f1f3f5;
}

.product-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.product-title {
    font-weight: 500;
    font-size: 14px;
}

.product-sku {
    font-size: 11px;
    color: #6c757d;
}

/* ===== Quantity Control ===== */
.qty-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.qty-btn {
    width: 28px;
    height: 28px;
    border: 1px solid #dee2e6;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #495057;
    transition: all 0.15s;
}

.qty-btn:hover {
    background: #e9ecef;
}

.qty-input {
    width: 40px;
    text-align: center;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 4px 0;
    font-size: 14px;
}

.discount-input {
    width: 80px;
    text-align: center;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 14px;
}

.item-total {
    font-weight: 600;
    color: #28a745;
}

.btn-remove {
    background: none;
    border: none;
    color: #dc3545;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
}

.btn-remove:hover {
    color: #bd2130;
}

/* ===== Discount Row ===== */
.discount-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 2px dashed #dee2e6;
}

.discount-label {
    font-weight: 500;
    color: #495057;
}

.discount-input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
}

.discount-input-lg {
    width: 120px;
    text-align: center;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 16px;
}

.discount-unit {
    color: #6c757d;
    font-size: 14px;
}

/* ===== Customer ===== */
.customer-search {
    display: flex;
    gap: 8px;
}

.customer-input {
    flex: 1;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
}

.customer-input:focus {
    outline: none;
    border-color: #2c7be5;
    box-shadow: 0 0 0 3px rgba(44, 123, 229, 0.1);
}

.btn-customer-search {
    background: #2c7be5;
    border: none;
    color: #fff;
    padding: 0 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
}

.btn-customer-search:hover:not(:disabled) {
    background: #1a5fc7;
}

.btn-customer-search:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.customer-info {
    margin-top: 8px;
}

.customer-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.customer-phone {
    font-size: 13px;
    color: #6c757d;
}

.customer-orders {
    background: #e9ecef;
    padding: 2px 12px;
    border-radius: 12px;
    font-size: 13px;
}

.btn-change-customer {
    background: none;
    border: none;
    color: #6c757d;
    font-size: 13px;
    cursor: pointer;
    margin-top: 4px;
}

.btn-change-customer:hover {
    color: #dc3545;
}

/* ===== Payment ===== */
.total-amount {
    text-align: center;
    padding: 8px 0 16px;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 16px;
}

.total-amount label {
    display: block;
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 4px;
}

.total-amount h2 {
    color: #2c7be5;
    margin: 0;
    font-size: 28px;
}

.payment-methods {
    margin-bottom: 16px;
}

.payment-methods label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #495057;
}

.payment-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: center;
}

.payment-select {
    flex: 1;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 14px;
}

.payment-input {
    flex: 2;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 14px;
}

.payment-input:focus,
.payment-select:focus {
    outline: none;
    border-color: #2c7be5;
    box-shadow: 0 0 0 3px rgba(44, 123, 229, 0.1);
}

.btn-remove-payment {
    background: none;
    border: none;
    color: #dc3545;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
}

.btn-add-payment {
    background: none;
    border: 1px dashed #6c757d;
    color: #6c757d;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    width: 100%;
    transition: all 0.15s;
}

.btn-add-payment:hover {
    border-color: #2c7be5;
    color: #2c7be5;
    background: #f8f9fa;
}

/* ===== Payment Summary ===== */
.payment-summary {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 15px;
}

.summary-success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
}

.summary-danger {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
}

/* ===== Action Buttons ===== */
.action-buttons {
    display: flex;
    gap: 8px;
}

.btn-submit {
    flex: 2;
    background: #28a745;
    border: none;
    color: #fff;
    padding: 12px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-submit:hover:not(:disabled) {
    background: #218838;
}

.btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-reset {
    flex: 1;
    background: #6c757d;
    border: none;
    color: #fff;
    padding: 12px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-reset:hover:not(:disabled) {
    background: #5a6268;
}

.btn-reset:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ===== Variant Modal ===== */
.variant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 4px;
}

.variant-card {
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
}

.variant-card:hover {
    border-color: #2c7be5;
    background: #f8f9fa;
    transform: translateY(-2px);
}

.variant-attributes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    margin-bottom: 6px;
}

.variant-attr {
    font-size: 12px;
    background: #e9ecef;
    padding: 2px 8px;
    border-radius: 4px;
    color: #495057;
}

.variant-sku {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 4px;
}

.variant-price {
    font-weight: 600;
    color: #2c7be5;
    font-size: 18px;
}

.variant-stock {
    display: inline-block;
    font-size: 12px;
    padding: 2px 12px;
    border-radius: 12px;
    margin-top: 4px;
}

.variant-stock.in-stock {
    background: #d4edda;
    color: #155724;
}

.variant-stock.out-of-stock {
    background: #f8d7da;
    color: #721c24;
}

.variant-modal-actions {
    text-align: center;
    margin-top: 16px;
}

.btn-secondary {
    background: #6c757d;
    border: none;
    color: #fff;
    padding: 8px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
}

.btn-secondary:hover {
    background: #5a6268;
}
</style>

<style>
#showVariantModal .modalContent {
    background: white;
    padding: 20px;
    min-width: max(320px, 50vw);
    border-radius: 12px;
    max-width: 73vw;
    max-height: 80vh;
    overflow: hidden;
}
</style>
