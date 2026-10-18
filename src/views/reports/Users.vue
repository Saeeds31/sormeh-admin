<template>
    <div class="container py-4" v-if="checkPermission(['report_users'])">
        <!-- Filters -->
        <div class="card mb-4">
            <div class="card-header">
                <h3>
                    <i class="bi bi-people"></i>
                    <span>گزارش خرید کاربران</span>
                </h3>
            </div>
            <div class="card-body">
                <form @submit.prevent="getReport()" class="row g-3">
                    <div class="col-md-2">
                        <date-picker display-format="jYYYY/jMM/jDD" placeholder="از تاریخ" format="YYYY-MM-DD"
                            v-model="filters.date_from"></date-picker>
                    </div>
                    <div class="col-md-2">
                        <date-picker display-format="jYYYY/jMM/jDD" placeholder="تا تاریخ" format="YYYY-MM-DD"
                            v-model="filters.date_to"></date-picker>
                    </div>
                  
                    <div class="col-md-3">
                        <input type="text" v-model="filters.mobile" class="form-control" placeholder="شماره موبایل" />
                    </div>
                    <div class="col-md-3">
                        <input type="text" v-model="filters.full_name" class="form-control"
                            placeholder="نام و نام خانوادگی" />
                    </div>
                    <div class="col-md-2">
                        <input type="text" v-model="filters.national_code" class="form-control" placeholder="کد ملی" />
                    </div>
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-search"></i>
                            <span class="mx-2">اعمال فیلتر</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="row mb-4" v-if="summary">
            <div class="col-md-6">
                <div class="card text-white bg-primary">
                    <div class="card-body text-center">
                        <h5 class="card-title">کل کاربران</h5>
                        <h2>{{ formatNumber(summary.total_users) }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card text-white bg-success">
                    <div class="card-body text-center">
                        <h5 class="card-title">کل سفارشات</h5>
                        <h2>{{ formatNumber(summary.total_orders) }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card text-white bg-warning">
                    <div class="card-body text-center">
                        <h5 class="card-title">کل خرید</h5>
                        <h2>{{ formatCurrency(summary.total_spent) }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card text-white bg-info">
                    <div class="card-body text-center">
                        <h5 class="card-title">تعداد کالا</h5>
                        <h2>{{ formatNumber(summary.total_items) }}</h2>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center my-5">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">در حال بارگذاری...</p>
        </div>

        <div v-else>
            <!-- Users Table -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped text-center align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>شناسه</th>
                                    <th>نام کاربر</th>
                                    <th>موبایل</th>
                                    <th>کیف پول</th>
                                    <th>تعداد سفارش</th>
                                    <th>تعداد کالا</th>
                                    <th>کل خرید</th>
                                    <th>میانگین خرید</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in reportData" :key="item.user.id">
                                    <td>{{ item.user.id }}</td>
                                    <td>
                                        {{ item.user.full_name || 'کاربر مهمان' }}
                                        <div class="small text-muted">
                                            <span v-for="role in item.user.roles" :key="role"
                                                class="badge bg-secondary me-1">
                                                {{ role }}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{{ item.user.mobile || '-' }}</td>
                                    <td>
                                        <span :class="item.user.has_wallet ? 'text-success' : 'text-muted'">
                                            {{ item.user.has_wallet ? formatCurrency(item.user.wallet_balance) : 'ندارد'
                                            }}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            :class="item.purchase_summary.total_orders > 0 ? 'text-success' : 'text-muted'">
                                            {{ formatNumber(item.purchase_summary.total_orders) }}
                                        </span>
                                    </td>
                                    <td>{{ formatNumber(item.purchase_summary.total_items) }}</td>
                                    <td>{{ formatCurrency(item.purchase_summary.total_spent) }}</td>
                                    <td>{{ formatCurrency(item.purchase_summary.average_order_value) }}</td>
                                    <td>
                                        <button @click="showUserDetail(item)" class="btn btn-sm btn-info">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="!reportData.length">
                                    <td colspan="9" class="text-center text-muted py-4">
                                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                                        <p class="mt-2">هیچ کاربری با این فیلترها یافت نشد</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- User Detail Modal -->
        <Modal v-if="showModal" id="productDetailModal" @closeModal="() => showModal = false"
            :title="selectedUser?.user?.full_name || 'جزئیات کاربر'">
            <div v-if="selectedUser">
                <!-- خلاصه خرید -->
                <h5 class="mb-3">خلاصه خرید</h5>
                <div class="row mb-4 g-3">
                    <div class="col-md-6">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h6>کل سفارشات</h6>
                                <h2 class="mb-0">{{ formatNumber(selectedUser.purchase_summary.total_orders) }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h6>کل کالاها</h6>
                                <h2 class="mb-0">{{ formatNumber(selectedUser.purchase_summary.total_items) }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h6>کل خرید</h6>
                                <h2 class="mb-0">{{ formatCurrency(selectedUser.purchase_summary.total_spent) }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h6>میانگین خرید</h6>
                                <h2 class="mb-0">{{ formatCurrency(selectedUser.purchase_summary.average_order_value) }}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- اطلاعات کاربر -->
                <h5 class="mb-3">اطلاعات کاربر</h5>
                <div class="row mb-4">
                    <div class="col-md-6">
                        <p><strong>نام کامل:</strong> {{ selectedUser.user.full_name || '-' }}</p>
                        <p><strong>شماره موبایل:</strong> {{ selectedUser.user.mobile || '-' }}</p>
                        <p><strong>کد ملی:</strong> {{ selectedUser.user.national_code || '-' }}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>تاریخ تولد:</strong> {{ formatDate(selectedUser.user.birth_date) }}</p>
                        <p><strong>کیف پول:</strong> {{ selectedUser.user.has_wallet ?
                            formatCurrency(selectedUser.user.wallet_balance) : 'ندارد' }}</p>
                        <p><strong>نقش‌ها:</strong>
                            <span v-for="role in selectedUser.user.roles" :key="role" class="badge bg-secondary me-1">
                                {{ role }}
                            </span>
                        </p>
                    </div>
                </div>

                <!-- محصولات پرفروش این کاربر -->
                <h5 class="mb-3">محصولات پرفروش این کاربر</h5>
                <div class="table-responsive mb-4">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>محصول</th>
                                <th>تعداد</th>
                                <th>کل مبلغ</th>
                                <th>تعداد سفارش</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(product, index) in selectedUser.top_products" :key="product.id">
                                <td>{{ index + 1 }}</td>
                                <td>{{ product.title }}</td>
                                <td>{{ formatNumber(product.total_quantity) }}</td>
                                <td>{{ formatCurrency(product.total_spent) }}</td>
                                <td>{{ formatNumber(product.order_count) }}</td>
                            </tr>
                            <tr v-if="!selectedUser.top_products.length">
                                <td colspan="5" class="text-center text-muted">هیچ خریدی برای این کاربر وجود ندارد</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- سفارشات -->
                <h5 class="mb-3">سفارشات</h5>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>شماره سفارش</th>
                                <th>تاریخ</th>
                                <th>مبلغ</th>
                                <th>وضعیت</th>
                                <th>وضعیت پرداخت</th>
                                <th>محصولات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in selectedUser.purchase_summary.orders" :key="order.order_id">
                                <td>#{{ order.order_id }}</td>
                                <td>{{ formatDate(order.created_at) }}</td>
                                <td>{{ formatCurrency(order.total) }}</td>
                                <td>
                                    <span class="badge" :class="getStatusBadgeClass(order.status)">
                                        {{ translateStatus(order.status) }}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge" :class="getPaymentStatusBadgeClass(order.payment_status)">
                                        {{ translatePaymentStatus(order.payment_status) }}
                                    </span>
                                </td>
                                <td>
                                    <span v-for="item in order.items" :key="item.product"
                                        class="badge bg-secondary me-1">
                                        {{ item.product }} ({{ formatNumber(item.quantity) }})
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="!selectedUser.purchase_summary.orders.length">
                                <td colspan="6" class="text-center text-muted">هیچ سفارشی برای این کاربر وجود ندارد</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useAdmin } from '@/stores/modules/admin';
import Modal from "@/components/shared/modal.vue";

const store = useAdmin();
const checkPermission = store.checkPermission;

// Utility functions
function formatCurrency(value) {
    if (!value && value !== 0) return "۰";
    return new Intl.NumberFormat("fa-IR").format(Math.round(value)) + " تومان";
}

function formatNumber(value) {
    if (!value && value !== 0) return "۰";
    return new Intl.NumberFormat("fa-IR").format(value);
}

function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("fa-IR");
}

function translateStatus(status) {
    const map = {
        pending: 'در انتظار',
        reserved: 'رزرو شده',
        processing: 'در حال پردازش',
        shipped: 'ارسال شده',
        completed: 'تکمیل شده',
        canceled: 'لغو شده',
        returned: 'مرجوعی',
        paid: 'پرداخت شده',
        delivered: 'تحویل داده شده',
    };
    return map[status] || status;
}

function translatePaymentStatus(status) {
    const map = {
        pending: 'در انتظار پرداخت',
        paid: 'پرداخت شده',
        failed: 'ناموفق',
        refunded: 'برگشت داده شده',
    };
    return map[status] || status;
}

function getStatusBadgeClass(status) {
    const map = {
        pending: 'bg-warning',
        processing: 'bg-info',
        shipped: 'bg-primary',
        completed: 'bg-success',
        canceled: 'bg-danger',
        returned: 'bg-secondary',
        paid: 'bg-success',
        delivered: 'bg-success',
    };
    return map[status] || 'bg-secondary';
}

function getPaymentStatusBadgeClass(status) {
    const map = {
        pending: 'bg-warning',
        paid: 'bg-success',
        failed: 'bg-danger',
        refunded: 'bg-secondary',
    };
    return map[status] || 'bg-secondary';
}

// Data
const filters = ref({
    date_from: '',
    date_to: '',
    role_id: '',
    mobile: '',
    full_name: '',
    national_code: '',
});

const loading = ref(false);
const reportData = ref([]);
const summary = ref(null);
const showModal = ref(false);
const selectedUser = ref(null);
const roles = ref([]);

// Methods
const getReport = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get('/reports/users/purchases', {
            params: { ...filters.value },
        });
        reportData.value = data.data || [];
        summary.value = data.summary || null;

        // لاگ برای دیباگ
        console.log('User Report Summary:', data.summary);
        console.log('User Report Total Spent:', data.summary?.total_spent);

    } catch (error) {
        console.error('Error fetching report:', error);
    } finally {
        loading.value = false;
    }
};

const showUserDetail = (item) => {
    selectedUser.value = item;
    showModal.value = true;
};

const loadRoles = async () => {
    try {
        const { data } = await axios.get('/roles');
        roles.value = data || [];
    } catch (error) {
        console.error('Error loading roles:', error);
    }
};

// Initialize
onMounted(() => {
    getReport();
    loadRoles();
});
</script>

<style scoped>
.card {
    margin-bottom: 1rem;
}

.container h3 {
    padding: 8px;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
}

.table td {
    vertical-align: middle;
}

.badge {
    font-size: 0.75rem;
}
</style>