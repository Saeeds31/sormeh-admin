<template>
    <div class="container-fluid mt-4" v-if="checkPermission(['pos_view'])">
        <!-- هدر -->
        <div class="page-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                    <router-link to="/pos/cashier/sessions" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-right"></i>
                        بازگشت
                    </router-link>
                    <h3 class="mb-0">
                        <i class="bi bi-clock-history"></i>
                        جزئیات شیفت #{{ session.id }}
                    </h3>
                    <span :class="session.status === 'open' ? 'badge bg-success' : 'badge bg-secondary'">
                        {{ session.status === 'open' ? 'باز' : 'بسته' }}
                    </span>
                </div>
                <div class="d-flex gap-2">
                    
                    <button v-if="session.status === 'open'" class="btn btn-danger" @click="closeSession">
                        <i class="bi bi-x-circle"></i>
                        بستن شیفت
                    </button>
                </div>
            </div>
        </div>

        <!-- لودینگ -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
            <!-- اطلاعات اصلی -->
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="info-card">
                        <span class="info-label">فروشنده</span>
                        <span class="info-value">{{ session.cashier?.full_name || 'نامشخص' }}</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <span class="info-label">تاریخ شروع</span>
                        <span class="info-value">{{ formatDateTime(session.opened_at) }}</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <span class="info-label">تاریخ پایان</span>
                        <span class="info-value">{{ session.closed_at ? formatDateTime(session.closed_at) : '—' }}</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <span class="info-label">مدت زمان</span>
                        <span class="info-value">{{ statistics.duration || 'در حال انجام' }}</span>
                    </div>
                </div>
            </div>

            <!-- کارت‌های آماری -->
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="stats-card bg-primary text-white">
                        <div class="stats-icon"><i class="bi bi-cart-check"></i></div>
                        <div class="stats-content">
                            <span class="stats-label">تعداد سفارشات</span>
                            <span class="stats-value">{{ statistics.orders_count }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-success text-white">
                        <div class="stats-icon"><i class="bi bi-graph-up"></i></div>
                        <div class="stats-content">
                            <span class="stats-label">فروش ناخالص</span>
                            <span class="stats-value">{{ formatPrice(statistics.total_sales) }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-danger text-white">
                        <div class="stats-icon"><i class="bi bi-arrow-return-left"></i></div>
                        <div class="stats-content">
                            <span class="stats-label">برگشتی</span>
                            <span class="stats-value">{{ formatPrice(statistics.total_refunds) }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-info text-white">
                        <div class="stats-icon"><i class="bi bi-cash-stack"></i></div>
                        <div class="stats-content">
                            <span class="stats-label">خالص فروش</span>
                            <span class="stats-value">{{ formatPrice(statistics.net_sales) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- اطلاعات صندوق -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5><i class="bi bi-cash-coin"></i> اطلاعات صندوق</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="balance-box">
                                <span class="balance-label">موجودی اولیه</span>
                                <span class="balance-value">{{ formatPrice(statistics.opening_balance) }}</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="balance-box">
                                <span class="balance-label">فروش نقدی</span>
                                <span class="balance-value text-success">{{ formatPrice(statistics.cash_sales) }}</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="balance-box">
                                <span class="balance-label">فروش کارتی</span>
                                <span class="balance-value text-info">{{ formatPrice(statistics.card_sales) }}</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="balance-box">
                                <span class="balance-label">فروش انتقالی</span>
                                <span class="balance-value text-warning">{{ formatPrice(statistics.transfer_sales) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-3">
                            <div class="balance-box">
                                <span class="balance-label">برداشت‌ها</span>
                                <span class="balance-value text-danger">{{ formatPrice(statistics.total_withdraws) }}</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="balance-box">
                                <span class="balance-label">موجودی فعلی (محاسبه‌شده)</span>
                                <span class="balance-value text-primary">{{ formatPrice(statistics.calculated_balance) }}</span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="balance-box" :class="statistics.is_matched === true ? 'matched' : statistics.is_matched === false ? 'unmatched' : ''">
                                <span class="balance-label">موجودی نهایی (ثبت‌شده)</span>
                                <span class="balance-value">
                                    {{ statistics.closing_balance !== null ? formatPrice(statistics.closing_balance) : '—' }}
                                </span>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="balance-box">
                                <span class="balance-label">وضعیت تطابق</span>
                                <span v-if="statistics.is_matched === null" class="badge bg-secondary">نامشخص</span>
                                <span v-else-if="statistics.is_matched === true" class="badge bg-success">✓ مطابق</span>
                                <span v-else class="badge bg-danger">✗ مغایرت</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- تفکیک روش‌های پرداخت -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5><i class="bi bi-pie-chart"></i> تفکیک روش‌های پرداخت</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="payment-box cash">
                                <span class="payment-label">نقدی</span>
                                <span class="payment-value">{{ formatPrice(statistics.cash_sales) }}</span>
                                <span class="payment-percent">{{ calculatePercent(statistics.cash_sales, statistics.total_sales) }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="payment-box card">
                                <span class="payment-label">کارت</span>
                                <span class="payment-value">{{ formatPrice(statistics.card_sales) }}</span>
                                <span class="payment-percent">{{ calculatePercent(statistics.card_sales, statistics.total_sales) }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="payment-box transfer">
                                <span class="payment-label">انتقال</span>
                                <span class="payment-value">{{ formatPrice(statistics.transfer_sales) }}</span>
                                <span class="payment-percent">{{ calculatePercent(statistics.transfer_sales, statistics.total_sales) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- تراکنش‌ها -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5><i class="bi bi-list-ul"></i> تراکنش‌های نقدی</h5>
                    <span class="badge bg-secondary">{{ session.cash_movements?.length || 0 }}</span>
                </div>
                <div class="card-body">
                    <div v-if="!session.cash_movements?.length" class="text-center text-muted py-3">
                        هیچ تراکنشی ثبت نشده است
                    </div>
                    <table v-else class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>نوع</th>
                                <th>مبلغ</th>
                                <th>روش</th>
                                <th>توضیحات</th>
                                <th>ایجادکننده</th>
                                <th>تاریخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="movement in session.cash_movements" :key="movement.id">
                                <td>#{{ movement.id }}</td>
                                <td>
                                    <span :class="movement.type === 'deposit' ? 'badge bg-success' : 'badge bg-danger'">
                                        {{ movement.type === 'deposit' ? 'ورودی' : 'خروجی' }}
                                    </span>
                                </td>
                                <td>{{ formatPrice(movement.amount) }}</td>
                                <td>{{ getPaymentMethodLabel(movement.payment_method) }}</td>
                                <td>{{ movement.reason || '—' }}</td>
                                <td>{{ movement.creator?.full_name || 'نامشخص' }}</td>
                                <td>{{ formatDateTime(movement.created_at) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- سفارشات -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5><i class="bi bi-cart-check"></i> سفارشات این شیفت</h5>
                    <span class="badge bg-secondary">{{ session.orders?.length || 0 }}</span>
                </div>
                <div class="card-body">
                    <div v-if="!session.orders?.length" class="text-center text-muted py-3">
                        هیچ سفارشی ثبت نشده است
                    </div>
                    <table v-else class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>مشتری</th>
                                <th>مبلغ</th>
                                <th>تخفیف</th>
                                <th>وضعیت</th>
                                <th>تاریخ</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in session.orders" :key="order.id">
                                <td>#{{ order.id }}</td>
                                <td>{{ order.user?.full_name || 'مشتری' }}</td>
                                <td>{{ formatPrice(order.total_amount) }}</td>
                                <td>{{ formatPrice(order.discount_amount) }}</td>
                                <td>
                                    <span :class="{
                                        'badge bg-success': order.status === 'paid',
                                        'badge bg-danger': order.status === 'cancelled',
                                        'badge bg-warning': order.status === 'returned',
                                        'badge bg-secondary': order.status === 'pending'
                                    }">
                                        {{ getStatusLabel(order.status) }}
                                    </span>
                                </td>
                                <td>{{ formatDateTime(order.created_at) }}</td>
                                <td>
                                    <router-link :to="`/pos/order/${order.id}`" class="btn btn-sm btn-info" target="_blank">
                                        <i class="bi bi-eye"></i>
                                    </router-link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import axios from "axios";
import Swal from "sweetalert2";

const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();
const router = useRouter();

// State
const loading = ref(false);
const session = ref({
    id: null,
    cashier: null,
    orders: [],
    cash_movements: [],
    status: 'open'
});
const statistics = ref({
    total_sales: 0,
    total_refunds: 0,
    net_sales: 0,
    orders_count: 0,
    current_balance: 0,
    calculated_balance: 0,
    cash_sales: 0,
    card_sales: 0,
    transfer_sales: 0,
    total_withdraws: 0,
    opening_balance: 0,
    closing_balance: null,
    duration: 'در حال انجام',
    is_matched: null
});

async function getSessionDetails() {
    const sessionId = route.params.id;
    if (!sessionId) {
        Swal.fire('خطا', 'شناسه شیفت نامعتبر است', 'error');
        router.push('/pos/cashier/sessions');
        return;
    }

    loading.value = true;
    try {
        const { data } = await axios.get(`/pos/cashier/sessions/${sessionId}/details`);
        session.value = data.data.session;
        statistics.value = data.data.statistics;
    } catch (err) {
        console.error('Error loading session details:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری جزئیات شیفت پیش آمد', 'error');
        router.push('/pos/cashier/sessions');
    } finally {
        loading.value = false;
    }
}

async function closeSession() {
    const result = await Swal.fire({
        title: 'بستن شیفت',
        html: `
            <div class="text-end">
                <label class="form-label">موجودی نهایی صندوق (تومان)</label>
                <input id="closingBalance" class="form-control" type="number" placeholder="موجودی نهایی را وارد کنید">
                <label class="form-label mt-2">توضیحات (اختیاری)</label>
                <input id="notes" class="form-control" type="text" placeholder="توضیحات...">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'بستن شیفت',
        cancelButtonText: 'انصراف',
        preConfirm: () => {
            const closingBalance = document.getElementById('closingBalance').value;
            if (!closingBalance) {
                Swal.showValidationMessage('لطفاً موجودی نهایی را وارد کنید');
                return false;
            }
            return {
                closing_balance: parseInt(closingBalance),
                notes: document.getElementById('notes').value
            };
        }
    });

    if (result.isConfirmed) {
        try {
            const sessionId = session.value.id;
            await axios.post(`/pos/cashier/close/${sessionId}`, result.value);
            Swal.fire('موفق', 'شیفت با موفقیت بسته شد', 'success');
            await getSessionDetails();
        } catch (err) {
            Swal.fire('خطا', err.response?.data?.message || 'مشکلی در بستن شیفت پیش آمد', 'error');
        }
    }
}

function printReport() {
    const printContents = document.getElementById('printableArea')?.innerHTML || '';
    const win = window.open('', '_blank', 'width=600,height=800');
    if (!win) {
        Swal.fire('خطا', 'لطفاً باز شدن پنجره جدید را مجاز کنید', 'error');
        return;
    }
    win.document.write(`
        <html>
            <head>
                <title>گزارش شیفت #${session.value.id}</title>
                <style>
                    body { font-family: 'Tahoma', sans-serif; direction: rtl; padding: 20px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    .table th, .table td { border: 1px solid #ddd; padding: 6px 10px; text-align: center; }
                    .table th { background: #f8f9fa; }
                    .badge { padding: 2px 10px; border-radius: 4px; color: white; }
                    .bg-success { background: #28a745; }
                    .bg-danger { background: #dc3545; }
                    .bg-warning { background: #ffc107; color: #212529; }
                    .bg-secondary { background: #6c757d; }
                    .text-center { text-align: center; }
                    .mt-3 { margin-top: 15px; }
                    .mb-3 { margin-bottom: 15px; }
                    .divider { border-top: 1px solid #ddd; margin: 15px 0; }
                    .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>گزارش شیفت #${session.value.id}</h2>
                        <p>فروشنده: ${session.value.cashier?.full_name || 'نامشخص'}</p>
                        <p>تاریخ: ${formatDateTime(session.value.opened_at)}</p>
                    </div>
                    <div class="divider"></div>
                    <h5>آمار کلی</h5>
                    <div class="total-row"><span>تعداد سفارشات:</span><span>${statistics.value.orders_count}</span></div>
                    <div class="total-row"><span>فروش ناخالص:</span><span>${formatPrice(statistics.value.total_sales)}</span></div>
                    <div class="total-row"><span>برگشتی:</span><span>${formatPrice(statistics.value.total_refunds)}</span></div>
                    <div class="total-row"><span>خالص فروش:</span><span>${formatPrice(statistics.value.net_sales)}</span></div>
                    <div class="divider"></div>
                    <h5>تراکنش‌ها</h5>
                    <table class="table">
                        <thead>
                            <tr><th>نوع</th><th>مبلغ</th><th>روش</th><th>توضیحات</th></tr>
                        </thead>
                        <tbody>
                            ${session.value.cash_movements?.map(m => `
                                <tr>
                                    <td><span class="badge ${m.type === 'deposit' ? 'bg-success' : 'bg-danger'}">${m.type === 'deposit' ? 'ورودی' : 'خروجی'}</span></td>
                                    <td>${formatPrice(m.amount)}</td>
                                    <td>${getPaymentMethodLabel(m.payment_method)}</td>
                                    <td>${m.reason || '—'}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" class="text-center">هیچ تراکنشی ثبت نشده است</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fa-IR');
}

function getPaymentMethodLabel(method) {
    const labels = { cash: 'نقدی', card: 'کارت', transfer: 'انتقال' };
    return labels[method] || method;
}

function getStatusLabel(status) {
    const labels = {
        paid: 'پرداخت شده',
        pending: 'در انتظار',
        cancelled: 'لغو شده',
        returned: 'برگشت خورده'
    };
    return labels[status] || status;
}

function calculatePercent(amount, total) {
    if (!total || total === 0) return '۰٪';
    return Math.round((amount / total) * 100) + '٪';
}

onMounted(() => {
    getSessionDetails();
});
</script>

<style scoped>
/* ===== Page Header ===== */
.page-header {
    background: #fff;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ===== Info Cards ===== */
.info-card {
    background: #fff;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
}

.info-label {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 4px;
}

.info-value {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
}

/* ===== Stats Cards ===== */
.stats-card {
    padding: 16px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.stats-icon {
    font-size: 28px;
    opacity: 0.8;
}

.stats-content {
    display: flex;
    flex-direction: column;
}

.stats-label {
    font-size: 12px;
    opacity: 0.8;
}

.stats-value {
    font-size: 22px;
    font-weight: 700;
}

/* ===== Balance Box ===== */
.balance-box {
    background: #f8f9fa;
    padding: 12px 16px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #e9ecef;
}

.balance-box.matched {
    border-color: #28a745;
    background: #d4edda;
}

.balance-box.unmatched {
    border-color: #dc3545;
    background: #f8d7da;
}

.balance-label {
    display: block;
    font-size: 12px;
    color: #6c757d;
}

.balance-value {
    display: block;
    font-size: 18px;
    font-weight: 700;
}

/* ===== Payment Box ===== */
.payment-box {
    padding: 16px 20px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid #e9ecef;
}

.payment-box.cash {
    border-color: #28a745;
    background: #d4edda;
}

.payment-box.card {
    border-color: #17a2b8;
    background: #d1ecf1;
}

.payment-box.transfer {
    border-color: #ffc107;
    background: #fff3cd;
}

.payment-label {
    display: block;
    font-size: 13px;
    color: #6c757d;
}

.payment-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
}

.payment-percent {
    font-size: 12px;
    color: #6c757d;
}

/* ===== Card ===== */
.card {
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card-header {
    background: #f8f9fa;
    border-bottom: 2px solid #e9ecef;
}

.card-header h5 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.table th {
    background: #f8f9fa;
}
</style>