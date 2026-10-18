<template>
    <div class="container-fluid mt-4" v-if="checkPermission(['pos_view'])">
        <!-- هدر -->
        <div class="page-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h3>
                    <i class="bi bi-graph-up"></i>
                    گزارش‌های فروش
                </h3>
            </div>
        </div>

        <!-- فیلترها -->
        <div class="card mb-3">
            <div class="card-body">
                <form @submit.prevent="loadReports">
                    <div class="row g-2">
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
                            <select v-model="filters.cashier_id" class="form-select">
                                <option value="">همه فروشندگان</option>
                                <option v-for="cashier in cashiers" :key="cashier.id" :value="cashier.id">
                                    {{ cashier.name }}
                                </option>
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
                            <select v-model="filters.group_by" class="form-select">
                                <option value="">خلاصه کلی</option>
                                <option value="day">روزانه</option>
                                <option value="month">ماهانه</option>
                                <option value="year">سالانه</option>
                                <option value="product">محصولات</option>
                                <option value="cashier">فروشندگان</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary w-100" type="submit">
                                <i class="bi bi-search"></i>
                                نمایش
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- لودینگ -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
        </div>

        <div v-else-if="reportData">
            <!-- خلاصه کلی -->
            <div v-if="!filters.group_by || filters.group_by === ''">
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="stats-card bg-primary text-white">
                            <div class="stats-content">
                                <span class="stats-label">تعداد سفارشات</span>
                                <span class="stats-value">{{ reportData.summary?.orders_count || 0 }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stats-card bg-success text-white">
                            <div class="stats-content">
                                <span class="stats-label">کل فروش</span>
                                <span class="stats-value">{{ formatPrice(reportData.summary?.total_sales || 0) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stats-card bg-danger text-white">
                            <div class="stats-content">
                                <span class="stats-label">برگشتی</span>
                                <span class="stats-value">{{ formatPrice(reportData.refunds || 0) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stats-card bg-info text-white">
                            <div class="stats-content">
                                <span class="stats-label">خالص فروش</span>
                                <span class="stats-value">{{ formatPrice(reportData.net_sales || 0) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- تفکیک روش پرداخت -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5>تفکیک روش‌های پرداخت</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div v-for="(amount, method) in reportData.payment_breakdown" :key="method" class="col-md-4">
                                <div class="payment-box" :class="method">
                                    <span class="payment-label">{{ getPaymentLabel(method) }}</span>
                                    <span class="payment-value">{{ formatPrice(amount) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- جدول گزارش گروه‌بندی‌شده -->
            <div v-else-if="reportData.length">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5>
                            گزارش {{ getGroupLabel(filters.group_by) }}
                            <span class="badge bg-secondary ms-2">{{ reportData.length }}</span>
                        </h5>
                        
                    </div>
                    <div class="card-body">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>ردیف</th>
                                    <th>{{ getGroupHeader(filters.group_by) }}</th>
                                    <th>تعداد سفارشات</th>
                                    <th>تعداد فروش</th>
                                    <th>تخفیف</th>
                                    <th>میانگین</th>
                                    <th v-if="filters.group_by === 'product'">قیمت میانگین</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in reportData" :key="index">
                                    <td>{{ index + 1 }}</td>
                                    <td>
                                        <strong v-if="filters.group_by === 'cashier'">
                                            {{ item.cashier_name }}
                                        </strong>
                                        <strong v-else-if="filters.group_by === 'product'">
                                            {{ item.product_name }}
                                        </strong>
                                        <strong v-else>
                                            {{ item.label }}
                                        </strong>
                                    </td>
                                    <td>{{ item.orders_count || 0 }}</td>
                                    <td>{{ formatPrice(item.total_sales || 0) }}</td>
                                    <td>{{ formatPrice(item.total_discounts || 0) }}</td>
                                    <td>{{ formatPrice(item.average_order || 0) }}</td>
                                    <td v-if="filters.group_by === 'product'">
                                        {{ formatPrice(item.average_price || 0) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- پیام خالی -->
            <div v-else class="text-center py-5 text-muted">
                <i class="bi bi-inbox fs-2 d-block"></i>
                <p>هیچ داده‌ای برای نمایش وجود ندارد</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAdmin } from '@/stores/modules/admin';
import axios from "axios";
import Swal from "sweetalert2";

const store = useAdmin();
const checkPermission = store.checkPermission;

// State
const loading = ref(false);
const reportData = ref(null);
const cashiers = ref([]);

const filters = ref({
    date_from: '',
    date_to: '',
    cashier_id: '',
    payment_method: '',
    group_by: ''
});

// Methods
async function loadReports() {
    loading.value = true;
    try {
        // حذف فیلترهای خالی
        const params = { ...filters.value };
        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });

        const { data } = await axios.get('/pos/reports/sales', { params });
        reportData.value = data.data;
    } catch (err) {
        console.error('Error loading reports:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری گزارش‌ها پیش آمد', 'error');
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

function exportExcel() {
    Swal.fire('اطلاع', 'در حال ساخت...', 'info');
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function getPaymentLabel(method) {
    const labels = {
        cash: 'نقدی',
        card: 'کارت',
        transfer: 'انتقال'
    };
    return labels[method] || method;
}

function getGroupLabel(group) {
    const labels = {
        day: 'روزانه',
        month: 'ماهانه',
        year: 'سالانه',
        product: 'محصولات',
        cashier: 'فروشندگان'
    };
    return labels[group] || group;
}

function getGroupHeader(group) {
    const labels = {
        day: 'تاریخ',
        month: 'ماه',
        year: 'سال',
        product: 'نام محصول',
        cashier: 'نام فروشنده'
    };
    return labels[group] || group;
}

onMounted(() => {
    // تنظیم تاریخ پیش‌فرض (ماه جاری)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    filters.value.date_from = firstDay.toISOString().split('T')[0];
    filters.value.date_to = now.toISOString().split('T')[0];
    
    loadReports();
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

.card-header h5 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.table th {
    background: #f8f9fa;
}

.stats-card {
    padding: 16px 20px;
    border-radius: 12px;
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
</style>