<template>
    <div class="container-fluid mt-4" v-if="checkPermission(['pos_view'])">
        <!-- هدر -->
        <div class="page-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h3>
                    <i class="bi bi-arrow-return-left"></i>
                    مدیریت برگشتی‌ها
                </h3>
                <div>
                    <span class="badge bg-primary fs-6 me-2">
                        مجموع برگشتی: {{ formatPrice(totalRefunds) }}
                    </span>
                    <span class="badge bg-secondary fs-6">
                        تعداد: {{ refunds.total }}
                    </span>
                </div>
            </div>
        </div>

        <!-- فیلترها -->
        <div class="card mb-3">
            <div class="card-body">
                <form @submit.prevent="getRefunds()">
                    <div class="row g-2">
                        <div class="col-md-2">
                            <input 
                                v-model="filters.order_id" 
                                type="text" 
                                class="form-control" 
                                placeholder="شماره سفارش"
                            />
                        </div>
                        <div class="col-md-2">
                            <select v-model="filters.refund_method" class="form-select">
                                <option value="">همه روش‌ها</option>
                                <option value="cash">نقدی</option>
                                <option value="card">کارت</option>
                                <option value="store_credit">اعتبار فروشگاه</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input 
                                v-model="filters.date_from" 
                                type="date" 
                                class="form-control" 
                                placeholder="از تاریخ"
                            />
                        </div>
                        <div class="col-md-2">
                            <input 
                                v-model="filters.date_to" 
                                type="date" 
                                class="form-control" 
                                placeholder="تا تاریخ"
                            />
                        </div>
                        <div class="col-md-2">
                            <input 
                                v-model="filters.search" 
                                type="text" 
                                class="form-control" 
                                placeholder="جستجو..."
                            />
                        </div>
                        <div class="col-md-2">
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary w-100" type="submit">
                                    <i class="bi bi-search"></i>
                                    جستجو
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- جدول برگشتی‌ها -->
        <div class="card">
            <div class="card-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else>
                    <table class="table table-bordered table-striped table-hover">
                        <thead>
                            <tr>
                                <th style="width: 8%;">#</th>
                                <th style="width: 15%;">سفارش</th>
                                <th style="width: 15%;">مشتری</th>
                                <th style="width: 12%;">مبلغ</th>
                                <th style="width: 12%;">روش برگشت</th>
                                <th style="width: 10%;">آیتم</th>
                                <th style="width: 12%;">تاریخ</th>
                                <th style="width: 10%;">وضعیت</th>
                                <th style="width: 10%;">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="refund in refunds.data" :key="refund.id">
                                <td>
                                    <strong>#{{ refund.id }}</strong>
                                </td>
                                <td>
                                    <router-link :to="`/pos/orders/${refund.pos_order_id}`" class="order-link">
                                        سفارش #{{ refund.pos_order_id }}
                                    </router-link>
                                    <span class="d-block small text-muted">
                                        {{ refund.order?.cashier?.full_name || 'نامشخص' }}
                                    </span>
                                </td>
                                <td>
                                    <div class="customer-cell">
                                        <span class="customer-name">{{ refund.order?.user?.full_name || 'مشتری' }}</span>
                                        <span class="customer-phone" v-if="refund.order?.user?.mobile">
                                            {{ refund.order.user.mobile }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span class="fw-bold text-danger">
                                        {{ formatPrice(refund.refund_amount) }}
                                    </span>
                                </td>
                                <td>
                                    <span class="refund-badge" :class="{
                                        'badge-cash': refund.refund_method === 'cash',
                                        'badge-card': refund.refund_method === 'card',
                                        'badge-store': refund.refund_method === 'store_credit'
                                    }">
                                        {{ getRefundMethodLabel(refund.refund_method) }}
                                    </span>
                                </td>
                                <td>
                                    <span class="item-info" v-if="refund.order_item">
                                        {{ refund.order_item.product_name }}
                                        <span class="d-block small text-muted">
                                            تعداد: {{ refund.quantity }}
                                        </span>
                                    </span>
                                    <span v-else class="text-muted">—</span>
                                </td>
                                <td>{{ formatDateTime(refund.refunded_at) }}</td>
                                <td>
                                    <span class="status-badge status-approved">
                                        تأیید شده
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <router-link 
                                            :to="`/pos/order/${refund.pos_order_id}`" 
                                            class="btn btn-info"
                                            target="_blank"
                                        >
                                            <i class="bi bi-eye"></i>
                                        </router-link>
                                        
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!refunds.data?.length">
                                <td colspan="9" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox fs-2 d-block"></i>
                                    هیچ برگشتی یافت نشد
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <b-pagination
                        v-model="currentPage"
                        :total-rows="refunds.total"
                        v-if="refunds.last_page != 1"
                        :per-page="refunds.per_page"
                        @Update:modelValue="changePage"
                        align="center"
                        class="mt-3"
                    />
                </div>
            </div>
        </div>

        <!-- مودال جزئیات برگشت -->
        <b-modal v-model="showDetailsModal" :title="'جزئیات برگشت #' + (selectedRefund?.id || '')" size="lg" hide-footer>
            <div v-if="selectedRefund">
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <div class="info-item">
                            <span class="label">سفارش:</span>
                            <span class="value">
                                <router-link :to="`/pos/orders/${selectedRefund.pos_order_id}`">
                                    #{{ selectedRefund.pos_order_id }}
                                </router-link>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="label">مشتری:</span>
                            <span class="value">{{ selectedRefund.order?.user?.full_name || 'مشتری' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">موبایل:</span>
                            <span class="value">{{ selectedRefund.order?.user?.mobile || '—' }}</span>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="info-item">
                            <span class="label">مبلغ برگشتی:</span>
                            <span class="value text-danger fw-bold">{{ formatPrice(selectedRefund.refund_amount) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">روش برگشت:</span>
                            <span class="value">{{ getRefundMethodLabel(selectedRefund.refund_method) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">تاریخ:</span>
                            <span class="value">{{ formatDateTime(selectedRefund.refunded_at) }}</span>
                        </div>
                    </div>
                </div>

                <hr/>

                <div class="row g-3">
                    <div class="col-md-6">
                        <h6>آیتم برگشتی</h6>
                        <div class="item-detail" v-if="selectedRefund.order_item">
                            <p><strong>محصول:</strong> {{ selectedRefund.order_item.product_name }}</p>
                            <p><strong>SKU:</strong> {{ selectedRefund.order_item.sku || '—' }}</p>
                            <p><strong>تعداد:</strong> {{ selectedRefund.quantity }}</p>
                            <p><strong>قیمت واحد:</strong> {{ formatPrice(selectedRefund.order_item.unit_price) }}</p>
                        </div>
                        <div v-else class="text-muted">اطلاعات آیتم موجود نیست</div>
                    </div>
                    <div class="col-md-6">
                        <h6>اطلاعات تکمیلی</h6>
                        <div class="info-item">
                            <span class="label">تأییدکننده:</span>
                            <span class="value">{{ selectedRefund.approver?.full_name || 'نامشخص' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">دلیل:</span>
                            <span class="value">{{ selectedRefund.reason || '—' }}</span>
                        </div>
                    </div>
                </div>

                <div class="mt-3 text-end">
                    <button class="btn btn-secondary" @click="showDetailsModal = false">بستن</button>
                </div>
            </div>
        </b-modal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
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
const currentPage = ref(1);
const showDetailsModal = ref(false);
const selectedRefund = ref(null);

const refunds = ref({ data: [], total: 0, per_page: 20, last_page: 1 });

const filters = ref({
    order_id: '',
    refund_method: '',
    date_from: '',
    date_to: '',
    search: ''
});

// Computed
const totalRefunds = computed(() => {
    return refunds.value.data?.reduce((sum, refund) => sum + refund.refund_amount, 0) || 0;
});

// Methods
async function getRefunds(url = '/pos/refunds') {
    loading.value = true;
    try {
        const params = { ...filters.value };
        // حذف فیلترهای خالی
        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });

        const { data } = await axios.get(url, { params });
        refunds.value = data.data;
        currentPage.value = data.data.current_page || 1;
    } catch (err) {
        console.error('Error loading refunds:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری برگشتی‌ها پیش آمد', 'error');
    } finally {
        loading.value = false;
    }
}

function changePage(page) {
    if (page) {
        router.replace({ name: route.name, query: { page: page } });
        getRefunds(`/pos/refunds?page=${page}`);
    }
}

function viewDetails(refund) {
    selectedRefund.value = refund;
    showDetailsModal.value = true;
}



function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fa-IR');
}

function getRefundMethodLabel(method) {
    const labels = {
        cash: 'نقدی',
        card: 'کارت',
        store_credit: 'اعتبار فروشگاه'
    };
    return labels[method] || method;
}

onMounted(() => {
    currentPage.value = route.query.page ?? 1;
    getRefunds(`/pos/refunds?page=${currentPage.value}`);
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

/* ===== Card ===== */
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

/* ===== Order Link ===== */
.order-link {
    text-decoration: none;
    font-weight: 500;
    color: #2c7be5;
}

.order-link:hover {
    text-decoration: underline;
}

/* ===== Customer Cell ===== */
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

/* ===== Refund Badge ===== */
.refund-badge {
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

.badge-store {
    background: #e8d5f5;
    color: #6f42c1;
}

/* ===== Status Badge ===== */
.status-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-approved {
    background: #d4edda;
    color: #155724;
}

/* ===== Info Item ===== */
.info-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px dashed #f1f3f5;
}

.info-item:last-child {
    border-bottom: none;
}

.info-item .label {
    color: #6c757d;
    font-weight: 500;
}

.info-item .value {
    font-weight: 500;
    color: #1a1a2e;
}

/* ===== Item Detail ===== */
.item-detail p {
    margin: 4px 0;
    font-size: 14px;
}

.item-detail p strong {
    color: #495057;
}

/* ===== Button Group ===== */
.btn-group-sm .btn {
    padding: 4px 8px;
    font-size: 12px;
}

/* ===== Hover ===== */
.table-hover tbody tr:hover {
    background: #f8f9fa;
}
</style>