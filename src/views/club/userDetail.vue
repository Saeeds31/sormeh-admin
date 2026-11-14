<template>
    <div class="user-detail-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['user_view'])">
        <!-- دکمه بازگشت -->
        <div class="mb-2">
            <router-link to="/club/users" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-right"></i>
                <span>بازگشت به لیست</span>
            </router-link>
        </div>

        <div v-if="loading" class="text-center my-5">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">در حال بارگذاری...</p>
        </div>

        <div v-else-if="user">
            <!-- ===== کارت خلاصه ===== -->
            <div class="card mb-3 summary-card">
                <div class="card-body">
                    <div class="row g-3 align-items-center">
                        <div class="col-12 col-md-6">
                            <div class="d-flex align-items-center gap-3">
                                <div class="avatar-circle">
                                    <i class="bi bi-person-fill"></i>
                                </div>
                                <div>
                                    <h4 class="mb-1">{{ user.full_name ?? 'بدون نام' }}</h4>
                                    <div class="text-muted small">
                                        <i class="bi bi-phone me-1"></i>{{ user.mobile }}
                                    </div>
                                    <div class="text-muted small">
                                        شناسه: #{{ user.id }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="row g-2">
                                <div class="col-6">
                                    <div class="stat-box">
                                        <div class="stat-label">امتیاز کل</div>
                                        <div class="stat-value text-primary">{{ summary.total_points }}</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="stat-box">
                                        <div class="stat-label">سطح</div>
                                        <div class="stat-value">
                                            <span class="level-badge" :class="levelClass(summary.level)">
                                                {{ levelLabel(summary.level) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="stat-box">
                                        <div class="stat-label">تخفیف فعال</div>
                                        <div class="stat-value text-success">{{ summary.discount_percent }}٪</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="stat-box">
                                        <div class="stat-label">ارسال رایگان باقی‌مانده</div>
                                        <div class="stat-value text-info">{{ summary.free_shipping_remaining }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr class="my-3" />

                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-info" @click="openPointsModal('increase')">
                            <i class="bi bi-plus-circle"></i>
                            <span>افزودن امتیاز</span>
                        </button>
                        <button class="btn btn-sm btn-warning" @click="openPointsModal('decrease')">
                            <i class="bi bi-dash-circle"></i>
                            <span>کسر امتیاز</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- ===== تب‌ها ===== -->
            <div class="card">
                <div class="card-header p-0">
                    <ul class="nav nav-tabs nav-fill">
                        <li class="nav-item">
                            <button class="nav-link" :class="{ active: activeTab === 'transactions' }"
                                @click="activeTab = 'transactions'">
                                <i class="bi bi-list-check me-1"></i>
                                تراکنش‌های امتیاز
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" :class="{ active: activeTab === 'usages' }"
                                @click="activeTab = 'usages'">
                                <i class="bi bi-gift me-1"></i>
                                مزایای استفاده‌شده
                            </button>
                        </li>
                    </ul>
                </div>

                <div class="card-body p-2 p-md-3">
                    <!-- ===== تب تراکنش‌ها ===== -->
                    <div v-if="activeTab === 'transactions'">
                        <div v-if="transactionsLoading" class="text-center my-4">
                            <div class="spinner-border spinner-border-sm"></div>
                        </div>

                        <div v-else>
                            <!-- دسکتاپ -->
                            <div class="table-responsive d-none d-md-block">
                                <table class="table table-bordered table-striped mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>امتیاز</th>
                                            <th>نوع</th>
                                            <th>عنوان</th>
                                            <th>توضیح</th>
                                            <th>منبع</th>
                                            <th>تاریخ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="tx in transactions.data" :key="tx.id">
                                            <td>{{ tx.id }}</td>
                                            <td>
                                                <span :class="tx.type === 'increase' ? 'text-success' : 'text-danger'"
                                                    class="fw-bold">
                                                    {{ tx.type === 'increase' ? '+' : '' }}{{ tx.points }}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge"
                                                    :class="tx.type === 'increase' ? 'bg-success' : 'bg-danger'">
                                                    {{ tx.type === 'increase' ? 'افزایش' : 'کاهش' }}
                                                </span>
                                            </td>
                                            <td>{{ tx.title }}</td>
                                            <td>{{ tx.description ?? '-' }}</td>
                                            <td>
                                                <span class="badge bg-light text-dark">{{ sourceLabel(tx.source)
                                                    }}</span>
                                            </td>
                                            <td>{{ formatDate(tx.created_at) }}</td>
                                        </tr>
                                        <tr v-if="!transactions.data || transactions.data.length === 0">
                                            <td colspan="7" class="text-center py-4 text-muted">تراکنشی ثبت نشده است
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- موبایل -->
                            <div class="d-md-none tx-cards">
                                <div v-for="tx in transactions.data" :key="tx.id" class="tx-card">
                                    <div class="tx-card-header">
                                        <span class="badge"
                                            :class="tx.type === 'increase' ? 'bg-success' : 'bg-danger'">
                                            {{ tx.type === 'increase' ? 'افزایش' : 'کاهش' }}
                                        </span>
                                        <span class="fw-bold"
                                            :class="tx.type === 'increase' ? 'text-success' : 'text-danger'">
                                            {{ tx.type === 'increase' ? '+' : '' }}{{ tx.points }}
                                        </span>
                                        <span class="ms-auto text-muted small">{{ formatDate(tx.created_at) }}</span>
                                    </div>
                                    <div class="mt-2">
                                        <strong>{{ tx.title }}</strong>
                                        <div v-if="tx.description" class="text-muted small mt-1">{{ tx.description }}
                                        </div>
                                        <div class="mt-1">
                                            <span class="badge bg-light text-dark">{{ sourceLabel(tx.source) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="!transactions.data || transactions.data.length === 0"
                                    class="text-center py-4 text-muted">
                                    تراکنشی ثبت نشده است
                                </div>
                            </div>

                            <b-pagination v-if="transactions.last_page != 1" v-model="transactionsPage"
                                :total-rows="transactions.total" :per-page="transactions.per_page"
                                @Update:modelValue="loadTransactions" align="center"
                                class="mt-3 pagination-responsive"></b-pagination>
                        </div>
                    </div>

                    <!-- ===== تب مزایا ===== -->
                    <div v-if="activeTab === 'usages'">
                        <div v-if="usagesLoading" class="text-center my-4">
                            <div class="spinner-border spinner-border-sm"></div>
                        </div>

                        <div v-else>
                            <!-- دسکتاپ -->
                            <div class="table-responsive d-none d-md-block">
                                <table class="table table-bordered table-striped mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>نوع مزیت</th>
                                            <th>سطح</th>
                                            <th>مبلغ تخفیف</th>
                                            <th>سفارش</th>
                                            <th>دوره</th>
                                            <th>تاریخ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="u in usages.data" :key="u.id">
                                            <td>{{ u.id }}</td>
                                            <td>
                                                <span class="badge"
                                                    :class="u.benefit_type === 'free_shipping' ? 'bg-info' : 'bg-success'">
                                                    {{ benefitLabel(u.benefit_type) }}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="level-badge" :class="levelClass(u.level)">
                                                    {{ levelLabel(u.level) }}
                                                </span>
                                            </td>
                                            <td>
                                                <span v-if="u.benefit_type === 'discount'" class="fw-bold text-success">
                                                    {{ formatMoney(u.amount) }}
                                                </span>
                                                <span v-else class="text-muted">-</span>
                                            </td>
                                            <td>
                                                <router-link v-if="u.order_id" :to="`/orders/${u.order_id}`"
                                                    class="text-decoration-none">
                                                    #{{ u.order_id }}
                                                </router-link>
                                                <span v-else class="text-muted">-</span>
                                            </td>
                                            <td>{{ u.period ?? '-' }}</td>
                                            <td>{{ formatDate(u.created_at) }}</td>
                                        </tr>
                                        <tr v-if="!usages.data || usages.data.length === 0">
                                            <td colspan="7" class="text-center py-4 text-muted">مزیتی استفاده نشده است
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- موبایل -->
                            <div class="d-md-none tx-cards">
                                <div v-for="u in usages.data" :key="u.id" class="tx-card">
                                    <div class="tx-card-header">
                                        <span class="badge"
                                            :class="u.benefit_type === 'free_shipping' ? 'bg-info' : 'bg-success'">
                                            {{ benefitLabel(u.benefit_type) }}
                                        </span>
                                        <span class="level-badge" :class="levelClass(u.level)">
                                            {{ levelLabel(u.level) }}
                                        </span>
                                        <span class="ms-auto text-muted small">{{ formatDate(u.created_at) }}</span>
                                    </div>
                                    <div class="mt-2">
                                        <div v-if="u.benefit_type === 'discount'" class="text-success fw-bold">
                                            تخفیف: {{ formatMoney(u.amount) }}
                                        </div>
                                        <div v-if="u.order_id">
                                            سفارش:
                                            <router-link :to="`/orders/${u.order_id}`" class="text-decoration-none">
                                                #{{ u.order_id }}
                                            </router-link>
                                        </div>
                                        <div v-if="u.period" class="text-muted small">دوره: {{ u.period }}</div>
                                    </div>
                                </div>
                                <div v-if="!usages.data || usages.data.length === 0"
                                    class="text-center py-4 text-muted">
                                    مزیتی استفاده نشده است
                                </div>
                            </div>

                            <b-pagination v-if="usages.last_page != 1" v-model="usagesPage" :total-rows="usages.total"
                                :per-page="usages.per_page" @Update:modelValue="loadUsages" align="center"
                                class="mt-3 pagination-responsive"></b-pagination>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ===== مودال افزودن/کسر امتیاز ===== -->
        <Modal v-if="pointsModal.show" :title="pointsModal.mode === 'increase' ? 'افزودن امتیاز' : 'کسر امتیاز'"
            @closeModal="() => pointsModal.show = false" hide-footer>
            <div v-if="user" class="mb-3">
                <strong>{{ user.full_name }}</strong>
                <span class="text-muted d-block small">{{ user.mobile }}</span>
                <span class="text-muted d-block small">امتیاز فعلی: {{ summary.total_points }}</span>
            </div>

            <div class="mb-2">
                <label class="form-label">امتیاز <span class="text-danger">*</span></label>
                <input v-model.number="pointsModal.points" type="number" min="1" class="form-control" />
            </div>
            <div class="mb-2">
                <label class="form-label">عنوان <span class="text-danger">*</span></label>
                <input v-model="pointsModal.title" type="text" class="form-control" maxlength="255" />
            </div>
            <div class="mb-3">
                <label class="form-label">توضیح</label>
                <textarea v-model="pointsModal.description" class="form-control" rows="2"></textarea>
            </div>

            <div class="d-flex gap-2 justify-content-end">
                <button class="btn btn-secondary" @click="pointsModal.show = false">انصراف</button>
                <button class="btn" :class="pointsModal.mode === 'increase' ? 'btn-success' : 'btn-warning'"
                    :disabled="pointsModal.submitting" @click="submitPoints">
                    <span v-if="pointsModal.submitting" class="spinner-border spinner-border-sm me-1"></span>
                    {{ pointsModal.mode === 'increase' ? 'افزودن' : 'کسر' }}
                </button>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useRoute } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import Modal from "@/components/shared/modal.vue";

const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();
const userId = route.params.id;

const user = ref(null);
const summary = ref({
    total_points: 0,
    level: 'bronze',
    discount_percent: 0,
    free_shipping_remaining: 0,
});
const loading = ref(false);

const activeTab = ref('transactions');

const transactions = ref({ data: [] });
const transactionsPage = ref(1);
const transactionsLoading = ref(false);

const usages = ref({ data: [] });
const usagesPage = ref(1);
const usagesLoading = ref(false);

const levelConfig = ref({
    bronze: { label: 'برنز', discount: 2 },
    gold: { label: 'گلد', discount: 3 },
    platinum: { label: 'پلاتینیوم', discount: 4 },
});

const pointsModal = ref({
    show: false,
    mode: 'increase',
    points: null,
    title: '',
    description: '',
    submitting: false,
});

// ===== helpers =====
const levelLabel = (level) => levelConfig.value[level]?.label ?? level ?? '-';
const levelClass = (level) => ({
    bronze: 'level-bronze',
    gold: 'level-gold',
    platinum: 'level-platinum',
}[level] ?? '');
const benefitLabel = (type) => ({
    discount: 'تخفیف',
    free_shipping: 'ارسال رایگان',
}[type] ?? type);
const sourceLabel = (source) => ({
    order: 'سفارش',
    profile: 'پروفایل',
    manual: 'دستی',
    mission: 'ماموریت',
}[source] ?? (source ?? '-'));
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : '-';
const formatMoney = (v) => Number(v ?? 0).toLocaleString('fa-IR') + ' تومان';

// ===== دریافت خلاصه =====
const loadSummary = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get(`/club/users/${userId}`);
        user.value = data.user;
        summary.value = {
            total_points: data.total_points ?? 0,
            level: data.level ?? 'bronze',
            discount_percent: levelConfig.value[data.level]?.discount ?? 0,
            free_shipping_remaining: data.free_shipping_remaining ?? 0,
        };
    } catch (e) {
        console.error(e);
        Swal.fire('خطا', 'دریافت اطلاعات کاربر با مشکل مواجه شد.', 'error');
    } finally {
        loading.value = false;
    }
};

// ===== دریافت تراکنش‌ها =====
const loadTransactions = async (page = 1) => {
    transactionsLoading.value = true;
    try {
        const { data } = await axios.get(`/club/users/${userId}/transactions`, {
            params: { page },
        });
        transactions.value = data;
        transactionsPage.value = data.current_page;
    } catch (e) {
        console.error(e);
    } finally {
        transactionsLoading.value = false;
    }
};

// ===== دریافت مزایا =====
const loadUsages = async (page = 1) => {
    usagesLoading.value = true;
    try {
        const { data } = await axios.get(`/club/users/${userId}/usages`, {
            params: { page },
        });
        usages.value = data;
        usagesPage.value = data.current_page;
    } catch (e) {
        console.error(e);
    } finally {
        usagesLoading.value = false;
    }
};

// ===== مودال امتیاز =====
const openPointsModal = (mode) => {
    pointsModal.value = {
        show: true,
        mode,
        points: null,
        title: mode === 'increase' ? 'سفارش موفق' : 'کسر دستی',
        description: '',
        submitting: false,
    };
};

const submitPoints = async () => {
    const { mode, points, title, description } = pointsModal.value;

    if (!points || points < 1) {
        Swal.fire('خطا', 'امتیاز باید عددی بزرگ‌تر از صفر باشد.', 'error');
        return;
    }
    if (!title || !title.trim()) {
        Swal.fire('خطا', 'عنوان الزامی است.', 'error');
        return;
    }

    pointsModal.value.submitting = true;
    try {
        const url = mode === 'increase'
            ? `/club/users/${userId}/points/add`
            : `/club/users/${userId}/points/deduct`;

        await axios.post(url, {
            points,
            title: title.trim(),
            description: description?.trim() || null,
        });

        pointsModal.value.show = false;
        Swal.fire({
            icon: 'success',
            title: 'انجام شد',
            timer: 1500,
            showConfirmButton: false,
        });

        await Promise.all([loadSummary(), loadTransactions(1)]);
    } catch (e) {
        console.error(e);
        Swal.fire('خطا', e?.response?.data?.message || 'عملیات با مشکل مواجه شد.', 'error');
    } finally {
        pointsModal.value.submitting = false;
    }
};

onMounted(async () => {
    await loadSummary();
    await loadTransactions(1);
    await loadUsages(1);
});
</script>

<style scoped>
/* ===== کارت خلاصه ===== */
.summary-card {
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.avatar-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    flex-shrink: 0;
}

.stat-box {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 10px 12px;
    text-align: center;
}

.stat-label {
    font-size: 0.75rem;
    color: #6c757d;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 1.15rem;
    font-weight: 700;
}

/* ===== نشان سطح ===== */
.level-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    color: #fff;
}

.level-bronze {
    background: linear-gradient(135deg, #cd7f32, #e0a96d);
}

.level-gold {
    background: linear-gradient(135deg, #d4a017, #f5c542);
}

.level-platinum {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
}

/* ===== تب ===== */
.nav-tabs .nav-link {
    border: none;
    color: #6c757d;
    font-weight: 600;
    padding: 12px 8px;
}

.nav-tabs .nav-link.active {
    color: #6c5ce7;
    border-bottom: 3px solid #6c5ce7;
    background: transparent;
}

/* ===== جدول ===== */
.table thead th {
    background: #f8f9fa;
    font-weight: 600;
    color: #2d3436;
    white-space: nowrap;
    font-size: 0.9rem;
}

.table tbody td {
    vertical-align: middle;
    font-size: 0.9rem;
}

/* ===== کارت‌های موبایل ===== */
.tx-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tx-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.tx-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
}

.pagination-responsive {
    flex-wrap: wrap;
    justify-content: center;
}

/* ===== موبایل ===== */
@media (max-width: 767.98px) {
    .stat-value {
        font-size: 1rem;
    }

    .avatar-circle {
        width: 52px;
        height: 52px;
        font-size: 1.5rem;
    }
}
</style>