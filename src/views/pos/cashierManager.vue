<template>
    <div class="container mt-4" v-if="checkPermission(['pos_view'])">
        <!-- هدر -->
        <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3>
                    <i class="bi bi-clock-history"></i>
                    <span>مدیریت شیفت‌ها</span>
                </h3>
                <button class="btn btn-success" @click="openNewSession" v-if="!hasOpenSession">
                    <i class="bi bi-play-circle"></i>
                    <span>باز کردن شیفت جدید</span>
                </button>
                <button class="btn btn-danger" @click="closeCurrentSession" v-else>
                    <i class="bi bi-x-circle"></i>
                    <span>بستن شیفت فعلی</span>
                </button>
            </div>
            <div class="card-body">
                <!-- فیلترها -->
                <form @submit.prevent="getSessions()">
                    <div class="row g-2">
                        <div class="col-md-3">
                            <input v-model="filters.search" type="text" class="form-control"
                                placeholder="جستجو بر اساس نام فروشنده" />
                        </div>
                        <div class="col-md-2">
                            <select v-model="filters.status" class="form-select">
                                <option value="">همه وضعیت‌ها</option>
                                <option value="open">باز</option>
                                <option value="closed">بسته</option>
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
                            <select v-model="filters.cashier_id" class="form-select">
                                <option value="">همه فروشندگان</option>
                                <option v-for="cashier in cashiers" :key="cashier.id" :value="cashier.id">
                                    {{ cashier.name }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-primary w-100" type="submit">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- وضعیت شیفت فعلی -->
        <div class="alert alert-info" v-if="currentSessionInfo">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>
                        <i class="bi bi-clock"></i>
                        شیفت فعال شما:
                    </strong>
                    شروع: {{ formatDate(currentSessionInfo.session.opened_at) }}
                    | موجودی: {{ formatPrice(currentSessionInfo.current_balance) }}
                    | سفارشات: {{ currentSessionInfo.orders_count }}
                </div>
                <router-link :to="`/pos/cashier/sessions/${currentSessionInfo.session.id}/details`" class="btn btn-sm btn-info">
                    <i class="bi bi-eye"></i>
                    مشاهده جزئیات
                </router-link>
            </div>
        </div>

        <!-- جدول شیفت‌ها -->
        <div class="card">
            <div class="card-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else>
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>شناسه</th>
                                <th>فروشنده</th>
                                <th>تاریخ شروع</th>
                                <th>تاریخ پایان</th>
                                <th>موجودی اولیه</th>
                                <th>موجودی فعلی</th>
                                <th>فروش نقدی</th>
                                <th>فروش کارتی</th>
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
                                <td>{{ formatPrice(session.total_cash_sales || 0) }}</td>
                                <td>{{ formatPrice(session.total_card_sales || 0) }}</td>
                                <td>{{ session.orders_count || 0 }}</td>
                                <td>
                                    <span
                                        :class="session.status === 'open' ? 'badge bg-success' : 'badge bg-secondary'">
                                        {{ session.status === 'open' ? 'باز' : 'بسته' }}
                                    </span>
                                </td>
                                <td>
                                    <router-link :to="`/pos/cashier/sessions/${session.id}/details`"
                                        class="btn btn-sm btn-info me-1">
                                        <i class="bi bi-eye"></i>
                                    </router-link>
                                    <button v-if="session.status === 'open' && session.user_id === store.admin.id"
                                        class="btn btn-sm btn-danger" @click="closeSession(session.id)">
                                        <i class="bi bi-x-circle"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <b-pagination v-model="currentPage" :total-rows="sessions.total" v-if="sessions.last_page != 1"
                        :per-page="sessions.per_page" @Update:modelValue="changePage" align="center" class="mt-3" />
                </div>
            </div>
        </div>

        <!-- مودال جزئیات شیفت -->
        <b-modal v-model="showDetailsModal" :title="'جزئیات شیفت #' + (selectedSession?.id || '')" size="lg"
            hide-footer>
            <div v-if="selectedSession">
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="border rounded p-2 text-center">
                            <small class="text-muted">فروش ناخالص</small>
                            <h5 class="text-primary">{{ formatPrice(statistics.total_sales) }}</h5>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="border rounded p-2 text-center">
                            <small class="text-muted">برگشتی</small>
                            <h5 class="text-danger">{{ formatPrice(statistics.total_refunds) }}</h5>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="border rounded p-2 text-center">
                            <small class="text-muted">خالص فروش</small>
                            <h5 class="text-success">{{ formatPrice(statistics.net_sales) }}</h5>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="border rounded p-2 text-center">
                            <small class="text-muted">تعداد سفارشات</small>
                            <h5>{{ statistics.orders_count }}</h5>
                        </div>
                    </div>
                </div>

                <!-- اطلاعات صندوق -->
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <strong>موجودی اولیه:</strong>
                        {{ formatPrice(statistics.opening_balance) }}
                    </div>
                    <div class="col-md-4">
                        <strong>موجودی فعلی:</strong>
                        <span class="text-success">{{ formatPrice(statistics.current_balance) }}</span>
                    </div>
                    <div class="col-md-4" v-if="statistics.closing_balance !== null">
                        <strong>موجودی نهایی:</strong>
                        {{ formatPrice(statistics.closing_balance) }}
                    </div>
                </div>

                <!-- تراکنش‌ها -->
                <h6 class="mt-3">تراکنش‌های نقدی</h6>
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th>نوع</th>
                            <th>مبلغ</th>
                            <th>روش</th>
                            <th>توضیحات</th>
                            <th>تاریخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="movement in selectedSession.cash_movements" :key="movement.id">
                            <td>
                                <span :class="movement.type === 'deposit' ? 'badge bg-success' : 'badge bg-danger'">
                                    {{ movement.type === 'deposit' ? 'ورودی' : 'خروجی' }}
                                </span>
                            </td>
                            <td>{{ formatPrice(movement.amount) }}</td>
                            <td>{{ getPaymentMethodLabel(movement.payment_method) }}</td>
                            <td>{{ movement.reason || '—' }}</td>
                            <td>{{ formatDateTime(movement.created_at) }}</td>
                        </tr>
                        <tr v-if="!selectedSession.cash_movements?.length">
                            <td colspan="5" class="text-center text-muted">هیچ تراکنشی ثبت نشده است</td>
                        </tr>
                    </tbody>
                </table>

                <!-- سفارشات -->
                <h6 class="mt-3">سفارشات این شیفت</h6>
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th>شناسه</th>
                            <th>مشتری</th>
                            <th>مبلغ</th>
                            <th>وضعیت</th>
                            <th>تاریخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in selectedSession.orders" :key="order.id">
                            <td>#{{ order.id }}</td>
                            <td>{{ order.user?.name || 'مشتری' }}</td>
                            <td>{{ formatPrice(order.total_amount) }}</td>
                            <td>
                                <span :class="{
                                    'badge bg-success': order.status === 'paid',
                                    'badge bg-danger': order.status === 'cancelled',
                                    'badge bg-warning': order.status === 'returned'
                                }">
                                    {{ getStatusLabel(order.status) }}
                                </span>
                            </td>
                            <td>{{ formatDateTime(order.created_at) }}</td>
                        </tr>
                        <tr v-if="!selectedSession.orders?.length">
                            <td colspan="5" class="text-center text-muted">هیچ سفارشی ثبت نشده است</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </b-modal>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import Swal from "sweetalert2";

const store = useAdmin();
const checkPermission = store.checkPermission;

const route = useRoute();
const router = useRouter();

// State
const loading = ref(false);
const currentPage = ref(1);
const showDetailsModal = ref(false);
const selectedSession = ref(null);
const statistics = ref({});
const cashiers = ref([]);

const sessions = ref({ data: [], total: 0, per_page: 20, last_page: 1 });
const currentSessionInfo = ref(null);
const hasOpenSession = ref(false);

const filters = ref({
    search: "",
    status: "",
    date_from: "",
    date_to: "",
    cashier_id: ""
});

// Methods
async function getSessions(url = '/pos/cashier/sessions') {
    loading.value = true;
    try {
        const res = await axios.get(url, { params: filters.value });
        sessions.value = res.data.data;
        currentPage.value = res.data.data.current_page || 1;
    } catch (err) {
        console.error('Error loading sessions:', err);
        Swal.fire('خطا', 'مشکلی در بارگذاری شیفت‌ها پیش آمد', 'error');
    } finally {
        loading.value = false;
    }
}

async function getCurrentSessionStatus() {
    try {
        const res = await axios.get('/pos/cashier/status');
        console.log(res);
        
        currentSessionInfo.value = res.data.data;
        hasOpenSession.value = true;
    } catch (err) {
        if (err.response?.status === 404) {
            currentSessionInfo.value = null;
            hasOpenSession.value = false;
        } else {
            console.error('Error checking session status:', err);
        }
    }
}

async function getCashiers() {
    try {
        const res = await axios.get('/users?role=cashier');
        cashiers.value = res.data.data || [];
    } catch (err) {
        console.error('Error loading cashiers:', err);
    }
}

async function openNewSession() {
    const result = await Swal.fire({
        title: 'باز کردن شیفت جدید',
        html: `
      <div class="text-end">
        <label class="form-label">موجودی اولیه صندوق (تومان)</label>
        <input id="openingBalance" class="form-control" type="text" value="0" style="text-align: left; direction: ltr;">
        <div id="openingBalancePreview" class="mt-1 text-success" style="font-size: 14px; text-align: left; direction: ltr;">
          ۰ تومان
        </div>
        <label class="form-label mt-2">توضیحات (اختیاری)</label>
        <input id="notes" class="form-control" type="text" placeholder="توضیحات...">
      </div>
    `,
        showCancelButton: true,
        confirmButtonText: 'باز کردن شیفت',
        cancelButtonText: 'انصراف',
        didOpen: () => {
            const input = document.getElementById('openingBalance');
            const preview = document.getElementById('openingBalancePreview');

            const formatAndPreview = () => {
                let value = input.value.replace(/[^0-9]/g, '');
                if (value === '') {
                    input.value = '';
                    preview.textContent = '۰ تومان';
                    return;
                }
                const number = parseInt(value);
                input.value = number;
                preview.textContent = number.toLocaleString('fa-IR') + ' تومان';
            };

            input.addEventListener('input', formatAndPreview);
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
            formatAndPreview();
        },
        preConfirm: () => {
            const input = document.getElementById('openingBalance');
            const rawValue = input.value.replace(/[^0-9]/g, '');
            const openingBalance = parseInt(rawValue) || 0;
            return {
                opening_balance: openingBalance,
                notes: document.getElementById('notes').value
            };
        }
    });

    if (result.isConfirmed) {
        try {
            await axios.post('/pos/cashier/open', result.value);
            Swal.fire('موفق', 'شیفت با موفقیت باز شد', 'success');
            await Promise.all([getSessions(), getCurrentSessionStatus()]);
        } catch (err) {
            Swal.fire('خطا', err.response?.data?.message || 'مشکلی در باز کردن شیفت پیش آمد', 'error');
        }
    }
}

async function closeSession(sessionId) {
    const result = await Swal.fire({
        title: 'بستن شیفت',
        html: `
      <div class="text-end">
        <label class="form-label">موجودی نهایی صندوق (تومان)</label>
        <input id="closingBalance" class="form-control" type="text" placeholder="موجودی نهایی را وارد کنید" style="text-align: left; direction: ltr;">
        <div id="closingBalancePreview" class="mt-1 text-success" style="font-size: 14px; text-align: left; direction: ltr;">
          ۰ تومان
        </div>
        <label class="form-label mt-2">توضیحات (اختیاری)</label>
        <input id="notes" class="form-control" type="text" placeholder="توضیحات...">
      </div>
    `,
        showCancelButton: true,
        confirmButtonText: 'بستن شیفت',
        cancelButtonText: 'انصراف',
        didOpen: () => {
            const input = document.getElementById('closingBalance');
            const preview = document.getElementById('closingBalancePreview');

            const formatAndPreview = () => {
                let value = input.value.replace(/[^0-9]/g, '');
                if (value === '') {
                    input.value = '';
                    preview.textContent = '۰ تومان';
                    return;
                }
                const number = parseInt(value);
                input.value = number;
                preview.textContent = number.toLocaleString('fa-IR') + ' تومان';
            };

            input.addEventListener('input', formatAndPreview);
            input.focus();
            formatAndPreview();
        },
        preConfirm: () => {
            const input = document.getElementById('closingBalance');
            const rawValue = input.value.replace(/[^0-9]/g, '');
            const closingBalance = parseInt(rawValue);

            if (!closingBalance || closingBalance === 0) {
                Swal.showValidationMessage('لطفاً موجودی نهایی را وارد کنید');
                return false;
            }
            return {
                closing_balance: closingBalance,
                notes: document.getElementById('notes').value
            };
        }
    });

    if (result.isConfirmed) {
        try {
            await axios.post(`/pos/cashier/close/${sessionId}`, result.value);
            Swal.fire('موفق', 'شیفت با موفقیت بسته شد', 'success');
            await Promise.all([getSessions(), getCurrentSessionStatus()]);
        } catch (err) {
            Swal.fire('خطا', err.response?.data?.message || 'مشکلی در بستن شیفت پیش آمد', 'error');
        }
    }
}

async function closeCurrentSession() {
    if (currentSessionInfo.value) {
        await closeSession(currentSessionInfo.value.session.id);
    }
}

async function viewDetails(sessionId) {
    try {
        const res = await axios.get(`/pos/cashier/sessions/${sessionId}/details`);
        selectedSession.value = res.data.data.session;
        statistics.value = res.data.data.statistics;
        showDetailsModal.value = true;
    } catch (err) {
        Swal.fire('خطا', 'مشکلی در بارگذاری جزئیات شیفت پیش آمد', 'error');
    }
}

function changePage(page) {
    if (page) {
        router.replace({ name: route.name, query: { page: page } });
        getSessions(`/pos/cashier/sessions?page=${page}`);
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fa-IR');
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

onMounted(() => {
    currentPage.value = route.query.page ?? 1;
    getSessions(`/pos/cashier/sessions?page=${currentPage.value}`);
    getCurrentSessionStatus();
    getCashiers();
});
</script>

<style scoped>
.card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
    background: #f8f9fa;
    border-bottom: 2px solid #e9ecef;
}

.table th {
    background: #f8f9fa;
}

.alert-info {
    border-right: 4px solid #0dcaf0;
}
</style>