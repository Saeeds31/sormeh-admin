<template>
    <div class="container-fluid mt-4" v-if="checkPermission(['pos_view'])">
        <!-- هدر -->
        <div class="page-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h3>
                    <i class="bi bi-cash-coin"></i>
                    مدیریت صندوق‌ها
                </h3>
                <div class="d-flex gap-3">
                    <span class="badge bg-success fs-6">
                        <i class="bi bi-wallet2"></i>
                        موجودی کل: {{ formatPrice(summary.total_open_balance) }}
                    </span>
                    <span class="badge bg-primary fs-6">
                        <i class="bi bi-clock"></i>
                        صندوق‌های باز: {{ summary.open_sessions_count }}
                    </span>
                </div>
            </div>
        </div>

        <!-- کارت‌های آماری امروز -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="stats-card bg-primary text-white">
                    <div class="stats-icon"><i class="bi bi-cash"></i></div>
                    <div class="stats-content">
                        <span class="stats-label">فروش نقدی امروز</span>
                        <span class="stats-value">{{ formatPrice(summary.today_cash_sales) }}</span>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stats-card bg-info text-white">
                    <div class="stats-icon"><i class="bi bi-credit-card"></i></div>
                    <div class="stats-content">
                        <span class="stats-label">فروش کارتی امروز</span>
                        <span class="stats-value">{{ formatPrice(summary.today_card_sales) }}</span>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stats-card bg-warning text-white">
                    <div class="stats-icon"><i class="bi bi-arrow-left-right"></i></div>
                    <div class="stats-content">
                        <span class="stats-label">فروش انتقالی امروز</span>
                        <span class="stats-value">{{ formatPrice(summary.today_transfer_sales) }}</span>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stats-card bg-success text-white">
                    <div class="stats-icon"><i class="bi bi-graph-up"></i></div>
                    <div class="stats-content">
                        <span class="stats-label">خالص فروش امروز</span>
                        <span class="stats-value">{{ formatPrice(summary.today_net) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- صندوق‌های باز -->
        <div class="card mb-4" v-if="openSessions.length">
            <div class="card-header">
                <h5><i class="bi bi-clock-history"></i> صندوق‌های باز</h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4" v-for="session in openSessions" :key="session.id">
                        <div class="session-card">
                            <div class="session-header">
                                <span class="session-cashier">{{ session.cashier_name }}</span>
                                <span class="session-status open">باز</span>
                            </div>
                            <div class="session-body">
                                <div class="session-info">
                                    <span>شروع:</span>
                                    <span>{{ formatDateTime(session.opened_at) }}</span>
                                </div>
                                <div class="session-info">
                                    <span>موجودی:</span>
                                    <span class="fw-bold text-success">{{ formatPrice(session.current_balance) }}</span>
                                </div>
                                <div class="session-info">
                                    <span>سفارشات:</span>
                                    <span>{{ session.orders_count }}</span>
                                </div>
                            </div>
                            <div class="session-actions">
                                <button class="btn btn-sm btn-primary" @click="viewSessionDetails(session.id)">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" @click="transferMoney(session.id)">
                                    <i class="bi bi-arrow-left-right"></i>
                                </button>
                                <button v-if="session.cashier_id === store.admin.id" class="btn btn-sm btn-danger"
                                    @click="closeSession(session.id)">
                                    <i class="bi bi-x-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- فیلترها -->
        <div class="card mb-3">
            <div class="card-body">
                <form @submit.prevent="getSessions()">
                    <div class="row g-2">
                        <div class="col-md-3">
                            <select v-model="filters.status" class="form-select">
                                <option value="">همه وضعیت‌ها</option>
                                <option value="open">باز</option>
                                <option value="closed">بسته</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select v-model="filters.cashier_id" class="form-select">
                                <option value="">همه فروشندگان</option>
                                <option v-for="cashier in cashiers" :key="cashier.id" :value="cashier.id">
                                    {{ cashier.full_name }}
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
                        <div class="col-md-2">
                            <button class="btn btn-primary w-100" type="submit">
                                <i class="bi bi-search"></i>
                                جستجو
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- جدول صندوق‌ها -->
        <div class="card">
            <div class="card-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else>
                    <table class="table table-bordered table-striped table-hover">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>فروشنده</th>
                                <th>تاریخ شروع</th>
                                <th>تاریخ پایان</th>
                                <th>موجودی اولیه</th>
                                <th>موجودی فعلی</th>
                                <th>فروش نقدی</th>
                                <th>فروش کارتی</th>
                                <th>فروش انتقالی</th>
                                <th>برداشت‌ها</th>
                                <th>تعداد سفارشات</th>
                                <th>وضعیت</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="session in sessions.data" :key="session.id">
                                <td>#{{ session.id }}</td>
                                <td>{{ session.cashier?.full_name || 'نامشخص' }}</td>
                                <td>{{ formatDateTime(session.opened_at) }}</td>
                                <td>{{ session.closed_at ? formatDateTime(session.closed_at) : '—' }}</td>
                                <td>{{ formatPrice(session.opening_balance) }}</td>
                                <td>
                                    <span :class="session.status === 'open' ? 'text-success fw-bold' : ''">
                                        {{ formatPrice(session.current_balance || session.closing_balance || 0) }}
                                    </span>
                                </td>
                                <td>{{ formatPrice(session.cash_sales || 0) }}</td>
                                <td>{{ formatPrice(session.card_sales || 0) }}</td>
                                <td>{{ formatPrice(session.transfer_sales || 0) }}</td>
                                <td class="text-danger">{{ formatPrice(session.total_withdraws || 0) }}</td>
                                <td>{{ session.orders_count || 0 }}</td>
                                <td>
                                    <span
                                        :class="session.status === 'open' ? 'badge bg-success' : 'badge bg-secondary'">
                                        {{ session.status === 'open' ? 'باز' : 'بسته' }}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <router-link :to="`/pos/cashier/sessions/${session.id}/details`"
                                            class="btn btn-info">
                                            <i class="bi bi-eye"></i>
                                        </router-link>
                                        <button v-if="session.status === 'open'" class="btn btn-warning"
                                            @click="transferMoney(session.id)">
                                            <i class="bi bi-arrow-left-right"></i>
                                        </button>
                                        <button v-if="session.status === 'open'" class="btn btn-danger"
                                            @click="closeSession(session.id)">
                                            <i class="bi bi-x-circle"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!sessions.data?.length">
                                <td colspan="13" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox fs-2 d-block"></i>
                                    هیچ صندوقی یافت نشد
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <b-pagination v-model="currentPage" :total-rows="sessions.total" v-if="sessions.last_page != 1"
                        :per-page="sessions.per_page" @Update:modelValue="changePage" align="center" class="mt-3" />
                </div>
            </div>
        </div>

        <!-- مودال انتقال وجه -->
        <b-modal v-model="showTransferModal" title="انتقال وجه بین صندوق‌ها" hide-footer>
            <form @submit.prevent="submitTransfer">
                <div class="mb-3">
                    <label class="form-label">صندوق مبدأ</label>
                    <select v-model="transferData.from_session_id" class="form-select" required>
                        <option value="">انتخاب کنید...</option>
                        <option v-for="session in openSessions" :key="session.id" :value="session.id">
                            {{ session.cashier_name }} - {{ formatPrice(session.current_balance) }}
                        </option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">صندوق مقصد</label>
                    <select v-model="transferData.to_session_id" class="form-select" required>
                        <option value="">انتخاب کنید...</option>
                        <option v-for="session in openSessions" :key="session.id" :value="session.id">
                            {{ session.cashier_name }} - {{ formatPrice(session.current_balance) }}
                        </option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">مبلغ (تومان)</label>
                    <input v-model.number="transferData.amount" type="number" class="form-control"
                        placeholder="مبلغ را وارد کنید" required min="1">
                </div>
                <div class="mb-3">
                    <label class="form-label">توضیحات (اختیاری)</label>
                    <input v-model="transferData.reason" type="text" class="form-control" placeholder="توضیحات...">
                </div>
                <div class="d-flex gap-2 justify-content-end">
                    <button type="button" class="btn btn-secondary" @click="showTransferModal = false">انصراف</button>
                    <button type="submit" class="btn btn-primary" :disabled="transferLoading">
                        <i class="bi bi-arrow-left-right"></i>
                        انتقال وجه
                    </button>
                </div>
            </form>
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
const transferLoading = ref(false);
const currentPage = ref(1);
const showTransferModal = ref(false);

const sessions = ref({ data: [], total: 0, per_page: 20, last_page: 1 });
const openSessions = ref([]);
const cashiers = ref([]);
const summary = ref({
    total_open_balance: 0,
    open_sessions_count: 0,
    today_sales: 0,
    today_withdraws: 0,
    today_net: 0,
    today_cash_sales: 0,
    today_card_sales: 0,
    today_transfer_sales: 0
});

const filters = ref({
    status: '',
    cashier_id: '',
    date_from: '',
    date_to: ''
});

const transferData = ref({
    from_session_id: '',
    to_session_id: '',
    amount: 0,
    reason: ''
});

// Methods
async function getSessions(url = '/pos/cashier/sessions') {
    loading.value = true;
    try {
        const params = { ...filters.value };
        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });

        const { data } = await axios.get(url, { params });
        sessions.value = data.data;
        summary.value = data.summary || summary.value;
        currentPage.value = data.data.current_page || 1;
    } catch (err) {
        console.error('Error loading sessions:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری صندوق‌ها پیش آمد', 'error');
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

async function getOpenSessions() {
    try {
        const { data } = await axios.get('/pos/cashier/summary');
        summary.value = data.data.summary;
        openSessions.value = data.data.open_sessions;
    } catch (err) {
        console.error('Error loading open sessions:', err);
    }
}

function changePage(page) {
    if (page) {
        router.replace({ name: route.name, query: { page: page } });
        getSessions(`/pos/cashier/sessions?page=${page}`);
    }
}

function viewSessionDetails(id) {
    router.push(`/pos/cashier/sessions/${id}/details`);
}

function closeSession(sessionId) {
    Swal.fire({
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
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await axios.post(`/pos/cashier/close/${sessionId}`, result.value);
                Swal.fire('موفق', 'شیفت با موفقیت بسته شد', 'success');
                await Promise.all([getSessions(), getOpenSessions()]);
            } catch (err) {
                Swal.fire('خطا', err.response?.data?.message || 'مشکلی در بستن شیفت پیش آمد', 'error');
            }
        }
    });
}

function transferMoney(sessionId) {
    transferData.value.from_session_id = sessionId;
    transferData.value.to_session_id = '';
    transferData.value.amount = 0;
    transferData.value.reason = '';
    showTransferModal.value = true;
}

async function submitTransfer() {
    if (!transferData.value.from_session_id || !transferData.value.to_session_id || !transferData.value.amount) {
        Swal.fire('خطا', 'لطفاً همه فیلدها را پر کنید', 'error');
        return;
    }

    if (transferData.value.from_session_id === transferData.value.to_session_id) {
        Swal.fire('خطا', 'صندوق مبدأ و مقصد نمی‌توانند یکسان باشند', 'error');
        return;
    }

    transferLoading.value = true;
    try {
        await axios.post('/pos/cashier/transfer', transferData.value);
        Swal.fire('موفق', 'انتقال وجه با موفقیت انجام شد', 'success');
        showTransferModal.value = false;
        await Promise.all([getSessions(), getOpenSessions()]);
    } catch (err) {
        Swal.fire('خطا', err.response?.data?.message || 'مشکلی در انتقال وجه پیش آمد', 'error');
    } finally {
        transferLoading.value = false;
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fa-IR');
}

onMounted(() => {
    currentPage.value = route.query.page ?? 1;
    getSessions(`/pos/cashier/sessions?page=${currentPage.value}`);
    getOpenSessions();
    getCashiers();
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
    font-size: 20px;
    font-weight: 700;
}

/* ===== Session Card ===== */
.session-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
}

.session-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.session-cashier {
    font-weight: 600;
    font-size: 16px;
}

.session-status {
    padding: 2px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.session-status.open {
    background: #d4edda;
    color: #155724;
}

.session-body {
    margin-bottom: 12px;
}

.session-info {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 14px;
}

.session-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
}

/* ===== Table ===== */
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

/* ===== Badge ===== */
.badge {
    font-size: 13px;
    padding: 6px 14px;
}

/* ===== Button Group ===== */
.btn-group-sm .btn {
    padding: 4px 8px;
    font-size: 12px;
}
</style>