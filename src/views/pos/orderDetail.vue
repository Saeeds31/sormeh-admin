<template>
    <div class="container-fluid mt-4" v-if="checkPermission(['pos_view'])">
        <!-- هدر -->
        <div class="page-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                    <router-link to="/pos/orders" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-right"></i>
                        بازگشت
                    </router-link>
                    <h3 class="mb-0">
                        <i class="bi bi-receipt"></i>
                        جزئیات سفارش #{{ order.id }}
                    </h3>
                    <span class="status-badge" :class="{
                        'status-paid': order.status === 'paid',
                        'status-pending': order.status === 'pending',
                        'status-cancelled': order.status === 'cancelled',
                        'status-returned': order.status === 'returned'
                    }">
                        {{ getStatusLabel(order.status) }}
                    </span>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" @click="printReceipt">
                        <i class="bi bi-printer"></i>
                        چاپ فاکتور
                    </button>
                    <button v-if="order.status === 'paid'" class="btn btn-warning" @click="cancelOrder">
                        <i class="bi bi-x-circle"></i>
                        لغو سفارش
                    </button>
                    <button v-if="order.status === 'paid'" class="btn btn-danger" @click="refundOrder">
                        <i class="bi bi-arrow-return-left"></i>
                        برگشت وجه
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
                        <span class="info-label">مشتری</span>
                        <span class="info-value">{{ order.user?.full_name || 'مشتری' }}</span>
                        <span class="info-sub">{{ order.user?.mobile || '—' }}</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <span class="info-label">تاریخ ثبت</span>
                        <span class="info-value">{{ formatDateTime(order.created_at) }}</span>
                        <span class="info-sub">{{ timeAgo(order.created_at) }}</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <span class="info-label">فروشنده</span>
                        <span class="info-value">{{ order.cashier?.full_name || 'نامشخص' }}</span>
                        <span class="info-sub">شیفت #{{ order.cashier_session_id }}</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <span class="info-label">وضعیت پرداخت</span>
                        <span class="info-value text-success">{{ formatPrice(order.paid_amount) }}</span>
                        <span class="info-sub" v-if="statistics.change_amount > 0">
                            بازگشت: {{ formatPrice(statistics.change_amount) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- کارت‌های آماری -->
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="stats-card bg-primary text-white">
                        <div class="stats-icon">
                            <i class="bi bi-cart"></i>
                        </div>
                        <div class="stats-content">
                            <span class="stats-label">تعداد اقلام</span>
                            <span class="stats-value">{{ statistics.items_count }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-success text-white">
                        <div class="stats-icon">
                            <i class="bi bi-box-seam"></i>
                        </div>
                        <div class="stats-content">
                            <span class="stats-label">تعداد کل</span>
                            <span class="stats-value">{{ statistics.total_quantity }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-warning text-white">
                        <div class="stats-icon">
                            <i class="bi bi-tag"></i>
                        </div>
                        <div class="stats-content">
                            <span class="stats-label">تخفیف</span>
                            <span class="stats-value">{{ formatPrice(order.discount_amount) }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card bg-info text-white">
                        <div class="stats-icon">
                            <i class="bi bi-arrow-return-left"></i>
                        </div>
                        <div class="stats-content">
                            <span class="stats-label">برگشتی</span>
                            <span class="stats-value">{{ formatPrice(statistics.total_refunded) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- جدول اقلام -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5><i class="bi bi-list-ul"></i> اقلام سفارش</h5>
                </div>
                <div class="card-body">
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th style="width: 35%;">محصول</th>
                                <th style="width: 15%;">قیمت واحد</th>
                                <th style="width: 10%;">تعداد</th>
                                <th style="width: 15%;">تخفیف</th>
                                <th style="width: 15%;">جمع</th>
                                <th style="width: 10%;">وضعیت</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in order.items" :key="item.id">
                                <td>
                                    <div class="product-cell">
                                        <span class="product-title">{{ item.product_name || item.product?.title
                                        }}</span>
                                        <span class="product-sku" v-if="item.sku">SKU: {{ item.sku }}</span>
                                        <span class="product-variant" v-if="item.variant?.values">
                                            <span v-for="(val, idx) in item.variant.values" :key="idx"
                                                class="variant-tag">
                                                {{ val.attribute?.name }}: {{ val.value }}
                                            </span>
                                        </span>
                                    </div>
                                </td>
                                <td>{{ formatPrice(item.unit_price) }}</td>
                                <td>{{ item.quantity }}</td>
                                <td>
                                    <span v-if="item.discount_amount > 0" class="text-danger">
                                        {{ formatPrice(item.discount_amount) }}
                                    </span>
                                    <span v-else class="text-muted">—</span>
                                </td>
                                <td class="fw-bold">{{ formatPrice(item.total_price) }}</td>
                                <td>
                                    <span v-if="item.is_refunded" class="badge bg-danger">برگشت خورده</span>
                                    <span v-else class="badge bg-success">فروخته شده</span>
                                </td>
                            </tr>
                            <tr v-if="!order.items?.length">
                                <td colspan="6" class="text-center text-muted">هیچ آیتمی در این سفارش وجود ندارد</td>
                            </tr>
                        </tbody>
                        <tfoot v-if="order.items?.length">
                            <tr class="table-active fw-bold">
                                <td colspan="3" class="text-end">جمع کل:</td>
                                <td>{{ formatPrice(order.subtotal) }}</td>
                                <td colspan="2"></td>
                            </tr>
                            <tr class="table-active fw-bold" v-if="order.discount_amount > 0">
                                <td colspan="3" class="text-end text-danger">تخفیف:</td>
                                <td class="text-danger">-{{ formatPrice(order.discount_amount) }}</td>
                                <td colspan="2"></td>
                            </tr>
                            <tr class="table-active fw-bold">
                                <td colspan="3" class="text-end">مبلغ قابل پرداخت:</td>
                                <td class="text-primary">{{ formatPrice(order.total_amount) }}</td>
                                <td colspan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- اطلاعات پرداخت -->
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-credit-card"></i> روش‌های پرداخت</h5>
                        </div>
                        <div class="card-body">
                            <div v-for="payment in statistics.payments_summary" :key="payment.method"
                                class="payment-row">
                                <span class="payment-method">{{ getPaymentLabel(payment.method) }}</span>
                                <span class="payment-amount">{{ formatPrice(payment.total) }}</span>
                            </div>
                            <div class="payment-total">
                                <span>جمع پرداختی</span>
                                <span class="fw-bold">{{ formatPrice(order.paid_amount) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-clock-history"></i> تاریخچه</h5>
                        </div>
                        <div class="card-body">
                            <div class="history-item">
                                <span>ثبت سفارش</span>
                                <span>{{ formatDateTime(order.created_at) }}</span>
                            </div>
                            <div class="history-item" v-if="order.paid_at">
                                <span>پرداخت</span>
                                <span>{{ formatDateTime(order.paid_at) }}</span>
                            </div>
                            <div class="history-item" v-if="order.refunds?.length">
                                <span>برگشت وجه</span>
                                <span>{{ formatDateTime(order.refunds[0]?.refunded_at) }}</span>
                            </div>
                            <div class="history-item" v-if="order.deleted_at">
                                <span class="text-danger">لغو شده</span>
                                <span class="text-danger">{{ formatDateTime(order.deleted_at) }}</span>
                            </div>
                            <div class="history-item text-muted" v-if="order.notes">
                                <span>توضیحات</span>
                                <span>{{ order.notes }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- برگشتی‌ها -->
            <div class="card" v-if="order.refunds?.length">
                <div class="card-header">
                    <h5><i class="bi bi-arrow-return-left"></i> تاریخچه برگشتی‌ها</h5>
                </div>
                <div class="card-body">
                    <table class="table table-sm table-bordered">
                        <thead>
                            <tr>
                                <th>شناسه</th>
                                <th>عنوان</th>
                                <th>مبلغ</th>
                                <th>تعداد</th>
                                <th>روش</th>
                                <th>تاریخ</th>
                                <th>تأییدکننده</th>
                                <th>دلیل</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="refund in order.refunds" :key="refund.id">
                                <td>#{{ refund.id }}</td>
                                <td>{{ refund.order_item.product_name }}</td>
                                <td>{{ formatPrice(refund.refund_amount) }}</td>
                                <td>{{ refund.quantity }}</td>
                                <td>{{ getPaymentLabel(refund.refund_method) }}</td>
                                <td>{{ formatDateTime(refund.refunded_at) }}</td>
                                <td>{{ refund.approver?.full_name || 'نامشخص' }}</td>
                                <td>{{ refund.reason || '—' }}</td>
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
const order = ref({
    id: null,
    user: null,
    cashier: null,
    cashier_session_id: null,
    items: [],
    refunds: [],
    cashMovements: [],
    subtotal: 0,
    discount_amount: 0,
    total_amount: 0,
    paid_amount: 0,
    status: 'pending',
    notes: null,
    created_at: null,
    paid_at: null,
    deleted_at: null
});

const statistics = ref({
    change_amount: 0,
    total_refunded: 0,
    payments_summary: [],
    items_count: 0,
    total_quantity: 0
});

// Methods
async function getOrderDetails() {
    const orderId = route.params.id;
    if (!orderId) {
        Swal.fire('خطا', 'شناسه سفارش نامعتبر است', 'error');
        router.push('/pos/orders');
        return;
    }

    loading.value = true;
    try {
        const { data } = await axios.get(`/pos/orders/${orderId}`);
        order.value = data.data.order;
        statistics.value = data.data.statistics;
    } catch (err) {
        console.error('Error loading order:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری سفارش پیش آمد', 'error');
        router.push('/pos/orders');
    } finally {
        loading.value = false;
    }
}

async function cancelOrder() {
    const result = await Swal.fire({
        title: 'لغو سفارش',
        text: 'آیا از لغو این سفارش مطمئن هستید؟ موجودی به انبار بازگردانده می‌شود.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'بله، لغو شود',
        cancelButtonText: 'انصراف'
    });

    if (result.isConfirmed) {
        loading.value = true;
        try {
            await axios.post(`/pos/orders/${order.value.id}/cancel`);
            Swal.fire('موفق', 'سفارش با موفقیت لغو شد', 'success');
            await getOrderDetails();
        } catch (err) {
            console.error('Cancel error:', err);
            Swal.fire('خطا', err.response?.data?.message || 'مشکلی در لغو سفارش پیش آمد', 'error');
        } finally {
            loading.value = false;
        }
    }
}


async function refundOrder() {
    // ساخت لیست آیتم‌ها با قابلیت انتخاب و محاسبه خودکار
    let itemsHtml = `
        <div class="text-end">
            <p><strong>مبلغ کل سفارش:</strong> ${formatPrice(order.value.total_amount)}</p>
            <hr/>
            <p><strong>انتخاب آیتم‌های برگشتی:</strong></p>
            <div style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd; padding: 8px; border-radius: 6px; background: #f8f9fa;">
    `;

    order.value.items.forEach((item, index) => {
        const maxQuantity = item.quantity;
        itemsHtml += `
            <div class="refund-item-row" style="border-bottom: 1px dashed #dee2e6; padding: 8px 0;" data-item-id="${item.id}" data-max-qty="${maxQuantity}" data-unit-price="${item.unit_price}">
                <div class="d-flex align-items-center gap-2">
                    <input class="form-check-input refund-checkbox" type="checkbox" id="item_${index}" 
                           style="margin-left: 8px; width: 18px; height: 18px; cursor: pointer;">
                    <label class="form-check-label" for="item_${index}" style="flex: 1; cursor: pointer;">
                        <strong>${item.product_name}</strong>
                        <span class="text-muted">(${item.sku})</span>
                        <br/>
                        <span style="font-size: 13px;">
                            تعداد: ${item.quantity} | 
                            قیمت: ${formatPrice(item.unit_price)} | 
                            جمع: ${formatPrice(item.total_price)}
                        </span>
                    </label>
                    <div style="width: 100px;">
                        <label style="font-size: 12px; color: #6c757d;">تعداد برگشت</label>
                        <input type="number" class="form-control form-control-sm refund-qty" 
                               value="${maxQuantity}" min="1" max="${maxQuantity}" 
                               style="width: 70px; text-align: center;" disabled>
                    </div>
                </div>
            </div>
        `;
    });

    itemsHtml += `
            </div>
            <hr/>
            <div class="row">
                <div class="col-6">
                    <label class="form-label">مبلغ برگشتی (تومان)</label>
                    <input id="refundAmount" class="form-control" type="text" 
                           value="0" readonly style="background: #e9ecef; font-weight: bold; font-size: 18px; color: #dc3545; text-align: center;">
                </div>
                <div class="col-6">
                    <label class="form-label">روش برگشت</label>
                    <select id="refundMethod" class="form-select">
                        <option value="cash">نقدی</option>
                        <option value="card">کارت</option>
                        <option value="store_credit">اعتبار فروشگاه</option>
                    </select>
                </div>
            </div>
            <div class="mt-2">
                <label class="form-label">دلیل برگشت (اختیاری)</label>
                <input id="refundReason" class="form-control" type="text" placeholder="دلیل برگشت...">
            </div>
        </div>
    `;

    const { value: result } = await Swal.fire({
        title: 'برگشت وجه',
        html: itemsHtml,
        width: 650,
        showCancelButton: true,
        confirmButtonText: 'ثبت برگشت',
        cancelButtonText: 'انصراف',
        didOpen: () => {
            // ===== منطق محاسبه خودکار مبلغ برگشتی =====
            const checkboxes = document.querySelectorAll('.refund-checkbox');
            const qtyInputs = document.querySelectorAll('.refund-qty');
            const refundAmountInput = document.getElementById('refundAmount');

            // تابع محاسبه مبلغ کل برگشتی
            function calculateTotalRefund() {
                let total = 0;
                checkboxes.forEach((cb, index) => {
                    if (cb.checked) {
                        const row = cb.closest('.refund-item-row');
                        const unitPrice = parseInt(row.dataset.unitPrice);
                        const qty = parseInt(qtyInputs[index].value) || 0;
                        total += unitPrice * qty;
                    }
                });
                refundAmountInput.value = total.toLocaleString();
                return total;
            }

            // فعال/غیرفعال کردن فیلد تعداد بر اساس چک‌باکس
            checkboxes.forEach((cb, index) => {
                cb.addEventListener('change', function () {
                    qtyInputs[index].disabled = !this.checked;
                    if (!this.checked) {
                        qtyInputs[index].value = 1;
                    } else {
                        const maxQty = parseInt(this.closest('.refund-item-row').dataset.maxQty);
                        qtyInputs[index].value = maxQty;
                    }
                    calculateTotalRefund();
                });
            });

            // محاسبه مجدد با تغییر تعداد
            qtyInputs.forEach((input, index) => {
                input.addEventListener('change', function () {
                    const maxQty = parseInt(this.closest('.refund-item-row').dataset.maxQty);
                    let val = parseInt(this.value) || 0;
                    if (val < 1) this.value = 1;
                    if (val > maxQty) this.value = maxQty;
                    calculateTotalRefund();
                });
            });

            // انتخاب همه آیتم‌ها به صورت پیش‌فرض
            checkboxes.forEach(cb => cb.checked = true);
            qtyInputs.forEach(input => input.disabled = false);
            calculateTotalRefund();
        },
        preConfirm: () => {
            // دریافت آیتم‌های انتخاب‌شده
            const selectedItems = [];
            const checkboxes = document.querySelectorAll('.refund-checkbox');
            const qtyInputs = document.querySelectorAll('.refund-qty');

            checkboxes.forEach((cb, index) => {
                if (cb.checked) {
                    const row = cb.closest('.refund-item-row');
                    const itemId = parseInt(row.dataset.itemId);
                    const qty = parseInt(qtyInputs[index].value) || 1;
                    selectedItems.push({
                        item_id: itemId,
                        quantity: qty
                    });
                }
            });

            if (selectedItems.length === 0) {
                Swal.showValidationMessage('حداقل یک آیتم را انتخاب کنید');
                return false;
            }

            // دریافت مبلغ برگشتی (حذف کاماها)
            const amountInput = document.getElementById('refundAmount');
            const rawAmount = amountInput.value.replace(/,/g, '');
            console.log(rawAmount, "refundAmount");
            const refundAmount = parseInt(rawAmount);

            if (!refundAmount || refundAmount <= 0) {
                Swal.showValidationMessage('مبلغ برگشتی نامعتبر است');
                return false;
            }

            return {
                items: selectedItems,
                refund_amount: refundAmount,
                refund_method: document.getElementById('refundMethod').value,
                reason: document.getElementById('refundReason').value
            };
        }
    });

    if (result) {
        loading.value = true;
        try {
            await axios.post('/pos/refunds', {
                order_id: order.value.id,
                items: result.items,
                refund_amount: result.refund_amount,
                refund_method: result.refund_method,
                reason: result.reason
            });
            Swal.fire('موفق', 'برگشت وجه با موفقیت ثبت شد', 'success');
            await getOrderDetails();
        } catch (err) {
            console.error('Refund error:', err);
            Swal.fire('خطا', err.response?.data?.message || 'مشکلی در ثبت برگشت پیش آمد', 'error');
        } finally {
            loading.value = false;
        }
    }
}

function printReceipt() {
    window.open(`/pos/order/print/${order.value.id}`, '_blank');
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fa-IR');
}

function timeAgo(date) {
    if (!date) return '-';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'لحظاتی پیش';
    if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
    return Math.floor(diff / 86400) + ' روز پیش';
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

function getPaymentLabel(method) {
    const labels = {
        cash: 'نقدی',
        card: 'کارت',
        transfer: 'انتقال',
        store_credit: 'اعتبار فروشگاه'
    };
    return labels[method] || method;
}

onMounted(() => {
    getOrderDetails();
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

/* ===== Status Badge ===== */
.status-badge {
    display: inline-block;
    padding: 4px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
}

.status-paid {
    background: #d4edda;
    color: #155724;
}

.status-pending {
    background: #fff3cd;
    color: #856404;
}

.status-cancelled {
    background: #f8d7da;
    color: #721c24;
}

.status-returned {
    background: #e2e3e5;
    color: #383d41;
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

.info-sub {
    font-size: 12px;
    color: #6c757d;
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

/* ===== Product Cell ===== */
.product-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
}

.product-title {
    font-weight: 500;
}

.product-sku {
    font-size: 11px;
    color: #6c757d;
}

.product-variant {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
}

.variant-tag {
    font-size: 10px;
    background: #f1f3f5;
    padding: 1px 8px;
    border-radius: 4px;
    color: #495057;
}

/* ===== Payment Row ===== */
.payment-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px dashed #e9ecef;
}

.payment-row:last-child {
    border-bottom: none;
}

.payment-method {
    font-weight: 500;
}

.payment-total {
    display: flex;
    justify-content: space-between;
    padding: 10px 0 0 0;
    margin-top: 8px;
    border-top: 2px solid #1a1a2e;
    font-size: 16px;
}

/* ===== History Item ===== */
.history-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px dashed #f1f3f5;
}

.history-item:last-child {
    border-bottom: none;
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

.table tfoot td {
    background: #f8f9fa;
}

/* در style بخش global یا درون کامپوننت */
.refund-item-row {
    transition: background 0.2s;
}

.refund-item-row:hover {
    background: #e9ecef;
}

.refund-checkbox {
    cursor: pointer;
}

.refund-qty:disabled {
    background: #e9ecef;
    cursor: not-allowed;
}

.refund-qty:not(:disabled) {
    background: #fff;
    border-color: #28a745;
}
</style>