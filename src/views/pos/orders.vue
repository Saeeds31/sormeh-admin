<template>
    <div class="container-fluid mt-4" v-if="checkPermission(['pos_view'])">
        <!-- هدر -->
        <div class="page-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h3>
                    <i class="bi bi-list-ul"></i>
                    لیست سفارشات حضوری
                </h3>
                <router-link to="/pos/create" class="btn btn-success">
                    <i class="bi bi-plus-circle"></i>
                    ثبت سفارش جدید
                </router-link>
            </div>
        </div>

        <!-- فیلترها -->
        <div class="card mb-3">
            <div class="card-body">
                <form @submit.prevent="getOrders()">
                    <div class="row g-2">
                        <div class="col-md-2">
                            <input v-model="filters.order_id" type="text" class="form-control"
                                placeholder="شماره سفارش" />
                        </div>
                        <div class="col-md-2">
                            <select v-model="filters.status" class="form-select">
                                <option value="">همه وضعیت‌ها</option>
                                <option value="paid">پرداخت شده</option>
                                <option value="pending">در انتظار</option>
                                <option value="cancelled">لغو شده</option>
                                <option value="returned">برگشت خورده</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select v-model="filters.payment_method" class="form-select">
                                <option value="">همه روش‌ها</option>
                                <option value="cash">نقدی</option>
                                <option value="card">کارت</option>
                                <option value="transfer">انتقال</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select v-model="filters.cashier_id" class="form-select">
                                <option value="">همه فروشندگان</option>
                                <option v-for="cashier in cashiers" :key="cashier.id" :value="cashier.id">
                                    {{ cashier.name }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input v-model="filters.date_from" type="date" class="form-control"
                                placeholder="از تاریخ" />
                        </div>
                        <div class="col-md-2">
                            <input v-model="filters.date_to" type="date" class="form-control" placeholder="تا تاریخ" />
                        </div>
                    </div>
                    <div class="row g-2 mt-2">
                        <div class="col-md-12">
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary" type="submit">
                                    <i class="bi bi-search"></i>
                                    جستجو
                                </button>
                                <button class="btn btn-secondary" type="button" @click="resetFilters">
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                    reset
                                </button>

                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- جدول سفارشات -->
        <div class="card">
            <div class="card-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else>
                    <!-- خلاصه آمار -->
                    <div class="stats-row mb-3" v-if="orders.data?.length">

                        <span class="stat-item">
                            <strong>مجموع فروش:</strong> {{ formatPrice(calculateTotal) }}
                        </span>

                    </div>

                    <table class="table table-bordered table-striped table-hover">
                        <thead>
                            <tr>
                                <th style="width: 8%;">#</th>
                                <th style="width: 15%;">مشتری</th>
                                <th style="width: 12%;">مبلغ</th>
                                <th style="width: 10%;">روش پرداخت</th>
                                <th style="width: 12%;">فروشنده</th>
                                <th style="width: 10%;">تاریخ</th>
                                <th style="width: 10%;">وضعیت</th>
                                <th style="width: 15%;">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in orders.data" :key="order.id">
                                <td>
                                    <strong>#{{ order.id }}</strong>
                                </td>
                                <td>
                                    <div class="customer-cell">
                                        <span class="customer-name">{{ order.user?.full_name || 'مشتری' }}</span>
                                        <span class="customer-phone" v-if="order.user?.mobile">
                                            {{ order.user.mobile }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span class="fw-bold text-primary">
                                        {{ formatPrice(order.total_amount) }}
                                    </span>
                                    <span class="discount-badge" v-if="order.discount_amount > 0">
                                        تخفیف: {{ formatPrice(order.discount_amount) }}
                                    </span>
                                </td>
                                <td>
                                    <span class="payment-badge" :class="{
                                        'badge-cash': order.payment_methods === 'cash',
                                        'badge-card': order.payment_methods === 'card',
                                        'badge-transfer': order.payment_methods === 'transfer',
                                        'badge-mixed': order.payment_methods.includes(' + ')
                                    }">
                                        {{ getPaymentLabel(order.payment_methods) }}
                                    </span>
                                </td>
                                <td>{{ order.cashier?.full_name || 'نامشخص' }}</td>
                                <td>{{ formatDate(order.created_at) }}</td>
                                <td>
                                    <span class="status-badge" :class="{
                                        'status-paid': order.status === 'paid',
                                        'status-pending': order.status === 'pending',
                                        'status-cancelled': order.status === 'cancelled',
                                        'status-returned': order.status === 'returned'
                                    }">
                                        {{ getStatusLabel(order.status) }}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <router-link :to="`/pos/order/${order.id}`" class="btn btn-info"
                                            target="_blank">
                                            <i class="bi bi-eye"></i>
                                        </router-link>
                                        <button v-if="order.status === 'paid'" class="btn btn-warning"
                                            @click="cancelOrder(order.id)">
                                            <i class="bi bi-x-circle"></i>
                                        </button>
                                        <button v-if="order.status === 'paid'" class="btn btn-danger"
                                            @click="refundOrder(order.id)">
                                            <i class="bi bi-arrow-return-left"></i>
                                        </button>
                                        <button class="btn btn-secondary" @click="printReceipt(order.id)">
                                            <i class="bi bi-printer"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!orders.data?.length">
                                <td colspan="8" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox fs-2 d-block"></i>
                                    هیچ سفارشی یافت نشد
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <b-pagination v-model="currentPage" :total-rows="orders.total" v-if="orders.last_page != 1"
                        :per-page="orders.per_page" @Update:modelValue="changePage" align="center" class="mt-3" />
                </div>
            </div>
        </div>

        <!-- مودال تایید لغو/برگشت -->
        <Modal @closeModal="() => showConfirmModal = false" v-if="showConfirmModal" :title="confirmModalTitle"
            hide-footer>
            <p>{{ confirmModalMessage }}</p>
            <div class="d-flex gap-2 justify-content-end">
                <button class="btn btn-secondary" @click="showConfirmModal = false">انصراف</button>
                <button class="btn" :class="confirmModalType === 'cancel' ? 'btn-warning' : 'btn-danger'"
                    @click="confirmAction">
                    {{ confirmModalType === 'cancel' ? 'لغو سفارش' : 'برگشت وجه' }}
                </button>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "@/components/shared/modal.vue";

const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();
const router = useRouter();

// State
const loading = ref(false);
const currentPage = ref(1);
const showConfirmModal = ref(false);
const confirmModalTitle = ref('');
const confirmModalMessage = ref('');
const confirmModalType = ref('cancel'); // cancel | refund
const selectedOrderId = ref(null);

const orders = ref({ data: [], total: 0, per_page: 20, last_page: 1 });
const cashiers = ref([]);

const filters = ref({
    order_id: '',
    status: '',
    payment_method: '',
    cashier_id: '',
    date_from: '',
    date_to: ''
});

// Computed
const calculateTotal = computed(() => {
    return orders.value.data?.reduce((sum, order) => {
        if (order.status == 'paid') {
            return sum + order.total_amount
        } else {
            return sum + 0

        }
    }, 0) || 0;
});



// Methods
async function getOrders(url = '/pos/orders') {
    loading.value = true;
    try {
        const params = { ...filters.value };
        // حذف فیلترهای خالی
        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });

        const { data } = await axios.get(url, { params });
        orders.value = data.data;
        currentPage.value = data.data.current_page || 1;
    } catch (err) {
        console.error('Error loading orders:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری سفارشات پیش آمد', 'error');
    } finally {
        loading.value = false;
    }
}

async function getCashiers() {
    try {
        const { data } = await axios.get('/pos/cashiers/list');
        cashiers.value = data.data || [];
    } catch (err) {
        console.error('Error loading cashiers:', err);
    }
}

function resetFilters() {
    filters.value = {
        order_id: '',
        status: '',
        payment_method: '',
        cashier_id: '',
        date_from: '',
        date_to: ''
    };
    getOrders();
}

function changePage(page) {
    if (page) {
        router.replace({ name: route.name, query: { page: page } });
        getOrders(`/pos/orders?page=${page}`);
    }
}

function cancelOrder(orderId) {
    selectedOrderId.value = orderId;
    confirmModalTitle.value = 'لغو سفارش';
    confirmModalMessage.value = 'آیا از لغو این سفارش مطمئن هستید؟ موجودی به انبار بازگردانده می‌شود.';
    confirmModalType.value = 'cancel';
    showConfirmModal.value = true;
}

function refundOrder(orderId) {
    selectedOrderId.value = orderId;
    confirmModalTitle.value = 'برگشت وجه';
    confirmModalMessage.value = 'آیا از برگشت وجه این سفارش مطمئن هستید؟ موجودی به انبار بازگردانده می‌شود.';
    confirmModalType.value = 'refund';
    showConfirmModal.value = true;
}

async function confirmAction() {
    showConfirmModal.value = false;

    try {
        if (confirmModalType.value === 'cancel') {
            await axios.post(`/pos/orders/${selectedOrderId.value}/cancel`);
            Swal.fire('موفق', 'سفارش با موفقیت لغو شد', 'success');
        } else {
            // برای برگشت، یک مودال جدید باز کن
            const { value: refundAmount } = await Swal.fire({
                title: 'مبلغ برگشت',
                input: 'number',
                inputLabel: 'مبلغ برگشتی به مشتری (تومان)',
                inputPlaceholder: 'مبلغ را وارد کنید',
                showCancelButton: true,
                confirmButtonText: 'ثبت برگشت',
                cancelButtonText: 'انصراف',
                inputValidator: (value) => {
                    if (!value || value <= 0) {
                        return 'لطفاً مبلغ معتبر وارد کنید';
                    }
                    return null;
                }
            });

            if (refundAmount) {
                // TODO: API برگشت وجه
                // await axios.post(`/pos/refunds`, {
                //     order_id: selectedOrderId.value,
                //     refund_amount: refundAmount,
                //     refund_method: 'cash'
                // });
                Swal.fire('موفق', 'برگشت وجه با موفقیت ثبت شد', 'success');
            }
        }
        await getOrders(`/pos/orders?page=${currentPage.value}`);
    } catch (err) {
        console.error('Action error:', err);
        Swal.fire('خطا', err.response?.data?.message || 'مشکلی پیش آمد', 'error');
    }
}

function printReceipt(orderId) {
    window.open(`/pos/order/print/${orderId}`, '_blank');
}



function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fa-IR');
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

function getPaymentLabel(methods) {
    if (!methods) return '-';
    if (methods === 'cash') return 'نقدی';
    if (methods === 'card') return 'کارت';
    if (methods === 'transfer') return 'انتقال';
    if (methods.includes(' + ')) {
        return methods.split(' + ').map(m => {
            const labels = { cash: 'نقدی', card: 'کارت', transfer: 'انتقال' };
            return labels[m] || m;
        }).join(' + ');
    }
    return methods;
}

onMounted(() => {
    currentPage.value = route.query.page ?? 1;
    getOrders(`/pos/orders?page=${currentPage.value}`);
    getCashiers();
});
</script>

<style scoped>
.page-header {
    background: #fff;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card {
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card-header {
    background: #f8f9fa;
    border-bottom: 2px solid #e9ecef;
}

.table th {
    background: #f8f9fa;
    font-weight: 600;
}

.table-hover tbody tr:hover {
    background: #f8f9fa;
}

/* Customer Cell */
.customer-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.customer-name {
    font-weight: 500;
}

.customer-phone {
    font-size: 11px;
    color: #6c757d;
}

/* Payment Badge */
.payment-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.badge-cash {
    background: #d4edda;
    color: #155724;
}

.badge-card {
    background: #d1ecf1;
    color: #0c5460;
}

.badge-transfer {
    background: #fff3cd;
    color: #856404;
}

.badge-mixed {
    background: #e8d5f5;
    color: #6f42c1;
}

/* Status Badge */
.status-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
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

/* Stats */
.stats-row {
    display: flex;
    gap: 24px;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 12px;
}

.stat-item {
    font-size: 14px;
}

.stat-item strong {
    color: #495057;
}

/* Discount Badge */
.discount-badge {
    display: block;
    font-size: 10px;
    color: #dc3545;
}

/* Button Group */
.btn-group-sm .btn {
    padding: 4px 8px;
    font-size: 12px;
}

.btn-group .btn-info {
    color: #fff;
}

.btn-group .btn-warning {
    color: #212529;
}

.btn-group .btn-danger {
    color: #fff;
}

.btn-group .btn-secondary {
    color: #fff;
}
</style>