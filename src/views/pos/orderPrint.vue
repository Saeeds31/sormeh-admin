<template>
    <div class="order-page" v-if="checkPermission(['pos_view'])">
        <!-- دکمه پرینت (فقط در صفحه نمایش) -->
        <div class="print-actions no-print">
            <button class="btn-print" @click="printOrder">
                <i class="bi bi-printer"></i>
                چاپ فاکتور
            </button>
            <button class="btn-back" @click="closeTab">
                <i class="bi bi-x-lg"></i>
                بستن
            </button>
        </div>

        <!-- محتوای قابل پرینت -->
        <div id="printableOrder" class="order-receipt">
            <!-- هدر فاکتور -->
            <div class="receipt-header">
                <h2 class="store-name">{{ storeName }}</h2>
                <p class="store-info">{{ storeAddress }}</p>
                <p class="store-info">تلفن: {{ storePhone }}</p>
                <div class="divider"></div>
                <p class="receipt-title">فاکتور فروش</p>
                <p class="order-number">شماره: #{{ order.id }}</p>
                <p class="order-date">تاریخ: {{ formatDateTime(order.created_at) }}</p>
                <p class="order-cashier">فروشنده: {{ order.cashier?.full_name || 'نامشخص' }}</p>
                <div class="divider"></div>
            </div>

            <!-- اطلاعات مشتری -->
            <div class="customer-section" v-if="order.user">
                <p><strong>مشتری:</strong> {{ order.user.full_name || 'مشتری' }}</p>
                <p><strong>موبایل:</strong> {{ order.user.mobile || '—' }}</p>
                <div class="divider"></div>
            </div>

            <!-- جدول اقلام -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th class="col-item">کالا</th>
                        <th class="col-qty">تعداد</th>
                        <th class="col-price">قیمت</th>
                        <th class="col-total">جمع</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in order.items" :key="item.id">
                        <td class="col-item">
                            {{ item.product_name || item.product?.title }}
                            <span class="item-sku" v-if="item.sku">({{ item.sku }})</span>
                            <span class="item-discount" v-if="item.discount_amount > 0">
                                -{{ formatPrice(item.discount_amount) }}
                            </span>
                        </td>
                        <td class="col-qty">{{ item.quantity }}</td>
                        <td class="col-price">{{ formatPrice(item.unit_price) }}</td>
                        <td class="col-total">{{ formatPrice(item.total_price) }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="divider"></div>

            <!-- جمع‌ها -->
            <div class="totals">
                <div class="total-row">
                    <span>جمع کل:</span>
                    <span>{{ formatPrice(order.subtotal) }}</span>
                </div>
                <div class="total-row" v-if="order.discount_amount > 0">
                    <span>تخفیف:</span>
                    <span class="discount-amount">-{{ formatPrice(order.discount_amount) }}</span>
                </div>
                <div class="total-row grand-total">
                    <span>مبلغ قابل پرداخت:</span>
                    <span>{{ formatPrice(order.total_amount) }}</span>
                </div>
            </div>

            <div class="divider"></div>

            <!-- روش پرداخت -->
            <div class="payment-section">
                <p><strong>روش پرداخت:</strong></p>
                <div v-for="payment in order.payments" :key="payment.id" class="payment-row">
                    <span>{{ getPaymentLabel(payment.payment_method) }}</span>
                    <span>{{ formatPrice(payment.amount) }}</span>
                </div>
                <div class="divider"></div>
                <p><strong>مبلغ پرداختی:</strong> {{ formatPrice(order.paid_amount) }}</p>
                <p v-if="order.change_amount > 0"><strong>بازگشت:</strong> {{ formatPrice(order.change_amount) }}</p>
            </div>

            <div class="divider"></div>

            <!-- پیام پایانی -->
            <div class="receipt-footer">
                <p>{{ storeFooter }}</p>
                <p class="thank-you">با تشکر از خرید شما</p>
                <p class="date-print">تاریخ چاپ: {{ formatDateTime(new Date()) }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import axios from "axios";
import Swal from "sweetalert2";

const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();

// اطلاعات فروشگاه (از env یا config)
const storeName = import.meta.env.VITE_STORE_NAME || 'فروشگاه';
const storeAddress = import.meta.env.VITE_STORE_ADDRESS || 'آدرس فروشگاه';
const storePhone = import.meta.env.VITE_STORE_PHONE || '۰۲۱-۱۲۳۴۵۶۷۸';
const storeFooter = import.meta.env.VITE_STORE_FOOTER || 'کالاهای خریداری شده قابل تعویض نمی‌باشند';

const loading = ref(false);
const order = ref({
    id: null,
    user: null,
    cashier: null,
    items: [],
    payments: [],
    subtotal: 0,
    discount_amount: 0,
    total_amount: 0,
    paid_amount: 0,
    change_amount: 0,
    created_at: null
});

async function getOrderDetails() {
    const orderId = route.params.id;
    if (!orderId) {
        Swal.fire('خطا', 'شناسه سفارش نامعتبر است', 'error');
        return;
    }

    loading.value = true;
    try {
        const { data } = await axios.get(`/pos/orders/print/${orderId}`);
        order.value = data.data;
    } catch (err) {
        console.error('Error loading order:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری سفارش پیش آمد', 'error');
    } finally {
        loading.value = false;
    }
}

function printOrder() {
    const printContents = document.getElementById('printableOrder').innerHTML;

    // باز کردن پنجره جدید برای پرینت
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
        Swal.fire('خطا', 'لطفاً باز شدن پنجره جدید را مجاز کنید', 'error');
        return;
    }

    printWindow.document.write(`
        <html>
            <head>
                <title>فاکتور #${order.value.id}</title>
                <style>
                    /* ===== استایل پرینت لیبل باریک ===== */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Tahoma', 'Arial', sans-serif;
                        direction: rtl;
                        background: #fff;
                        padding: 8px;
                        font-size: 11px;
                        line-height: 1.5;
                        color: #1a1a2e;
                        width: 80mm;
                        margin: 0 auto;
                    }
                    .order-receipt {
                        width: 100%;
                        padding: 4px 0;
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 6px;
                    }
                    .store-name {
                        font-size: 16px;
                        font-weight: 700;
                        color: #1a1a2e;
                        margin: 0 0 2px 0;
                    }
                    .store-info {
                        font-size: 10px;
                        color: #555;
                        margin: 1px 0;
                    }
                    .receipt-title {
                        font-size: 14px;
                        font-weight: 600;
                        margin: 4px 0 2px 0;
                    }
                    .order-number {
                        font-size: 12px;
                        font-weight: 600;
                        margin: 2px 0;
                    }
                    .order-date, .order-cashier {
                        font-size: 10px;
                        color: #555;
                        margin: 1px 0;
                    }
                    .divider {
                        border-top: 1px dashed #ccc;
                        margin: 4px 0;
                    }
                    .customer-section {
                        font-size: 10px;
                        padding: 2px 0;
                    }
                    .customer-section p {
                        margin: 1px 0;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                        margin: 4px 0;
                    }
                    .items-table th {
                        background: #f8f9fa;
                        text-align: center;
                        padding: 3px 2px;
                        border-bottom: 1px solid #ddd;
                        font-weight: 600;
                        font-size: 9px;
                    }
                    .items-table td {
                        text-align: center;
                        padding: 3px 2px;
                        border-bottom: 1px dashed #eee;
                    }
                    .col-item {
                        text-align: right;
                        width: 45%;
                    }
                    .col-qty {
                        width: 15%;
                    }
                    .col-price {
                        width: 20%;
                    }
                    .col-total {
                        width: 20%;
                        font-weight: 600;
                    }
                    .item-sku {
                        font-size: 8px;
                        color: #888;
                    }
                    .item-discount {
                        font-size: 8px;
                        color: #dc3545;
                        display: block;
                    }
                    .totals {
                        margin: 4px 0;
                        padding: 2px 0;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 2px 0;
                        font-size: 10px;
                    }
                    .grand-total {
                        font-size: 13px;
                        font-weight: 700;
                        border-top: 2px solid #1a1a2e;
                        padding-top: 4px;
                        margin-top: 2px;
                    }
                    .discount-amount {
                        color: #dc3545;
                    }
                    .payment-section {
                        font-size: 10px;
                        padding: 2px 0;
                    }
                    .payment-section p {
                        margin: 1px 0;
                    }
                    .payment-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 1px 0;
                        font-size: 10px;
                    }
                    .receipt-footer {
                        text-align: center;
                        font-size: 9px;
                        color: #888;
                        margin-top: 4px;
                        padding-top: 4px;
                        border-top: 1px dashed #ccc;
                    }
                    .thank-you {
                        font-size: 11px;
                        font-weight: 600;
                        color: #1a1a2e;
                        margin: 2px 0;
                    }
                    .date-print {
                        font-size: 8px;
                        color: #aaa;
                    }
                    @media print {
                        body {
                            width: 80mm;
                            padding: 4px;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContents}
                <script>
                    // پرینت خودکار بعد از لود کامل
                    window.onload = function() {
                        window.print();
                        // بعد از پرینت، پنجره رو ببند
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                <\/script>
            </body>
        </html>
    `);

    printWindow.document.close();
}

function closeTab() {
    // تلاش برای بستن پنجره فعلی
    if (window.opener) {
        // اگر صفحه با window.open باز شده
        window.close();
    } else {
        // اگر صفحه مستقیماً باز شده، به صفحه قبلی برگرد
        Swal.fire({
            title: 'خروج از صفحه؟',
            text: 'آیا می‌خواهید به صفحه قبل برگردید؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'بله',
            cancelButtonText: 'خیر'
        }).then(result => {
            if (result.isConfirmed) {
                window.location.href = '/pos/create';
            }
        });
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0);
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fa-IR');
}

function getPaymentLabel(method) {
    const labels = {
        cash: 'نقدی',
        card: 'کارت',
        transfer: 'انتقال'
    };
    return labels[method] || method;
}

onMounted(() => {
    getOrderDetails();
});
</script>

<style scoped>
.order-page {
    background: #f8f9fa;
    min-height: 100vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.print-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    position: sticky;
    top: 0;
    background: #f8f9fa;
    padding: 12px 0;
    z-index: 100;
    width: 100%;
    max-width: 400px;
    justify-content: center;
}

.btn-print {
    background: #2c7be5;
    border: none;
    color: #fff;
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s;
}

.btn-print:hover {
    background: #1a5fc7;
}

.btn-back {
    background: #dc3545;
    border: none;
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s;
}

.btn-back:hover {
    background: #bd2130;
}

/* ===== استایل صفحه نمایش (غیر پرینت) ===== */
.order-receipt {
    background: #fff;
    border-radius: 12px;
    padding: 20px 24px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    font-family: 'Tahoma', 'Arial', sans-serif;
    direction: rtl;
    font-size: 13px;
    line-height: 1.6;
    color: #1a1a2e;
}

.receipt-header {
    text-align: center;
    margin-bottom: 10px;
}

.store-name {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0 0 4px 0;
}

.store-info {
    font-size: 12px;
    color: #555;
    margin: 2px 0;
}

.receipt-title {
    font-size: 16px;
    font-weight: 600;
    margin: 6px 0 4px 0;
}

.order-number {
    font-size: 14px;
    font-weight: 600;
    margin: 4px 0;
}

.order-date,
.order-cashier {
    font-size: 12px;
    color: #555;
    margin: 2px 0;
}

.divider {
    border-top: 1px dashed #ccc;
    margin: 6px 0;
}

.customer-section {
    font-size: 12px;
    padding: 4px 0;
}

.customer-section p {
    margin: 2px 0;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin: 6px 0;
}

.items-table th {
    background: #f8f9fa;
    text-align: center;
    padding: 6px 4px;
    border-bottom: 1px solid #ddd;
    font-weight: 600;
}

.items-table td {
    text-align: center;
    padding: 6px 4px;
    border-bottom: 1px dashed #eee;
}

.col-item {
    text-align: right;
}

.item-sku {
    font-size: 10px;
    color: #888;
}

.item-discount {
    font-size: 10px;
    color: #dc3545;
    display: block;
}

.totals {
    margin: 6px 0;
    padding: 4px 0;
}

.total-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13px;
}

.grand-total {
    font-size: 16px;
    font-weight: 700;
    border-top: 2px solid #1a1a2e;
    padding-top: 6px;
    margin-top: 4px;
}

.discount-amount {
    color: #dc3545;
}

.payment-section {
    font-size: 12px;
    padding: 4px 0;
}

.payment-section p {
    margin: 2px 0;
}

.payment-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
}

.receipt-footer {
    text-align: center;
    font-size: 11px;
    color: #888;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #ccc;
}

.thank-you {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 4px 0;
}

.date-print {
    font-size: 10px;
    color: #aaa;
}

@media print {
    .order-page {
        background: #fff;
        padding: 0;
        margin: 0;
    }

    .print-actions {
        display: none !important;
    }

    .order-receipt {
        box-shadow: none;
        border-radius: 0;
        padding: 4px 6px;
        max-width: 80mm;
    }
}
</style>