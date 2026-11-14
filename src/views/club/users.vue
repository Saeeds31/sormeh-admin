<template>
    <div class="users-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['club_view'])">
        <!-- ===== بنر وضعیت تنظیمات ===== -->
        <div v-if="settingsStatus && !settingsStatus.is_complete" class="alert alert-warning d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
            <div>
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>تنظیمات باشگاه مشتریان کامل نیست.</strong>
                <span class="d-block d-sm-inline mt-1 mt-sm-0">
                    {{ settingsStatus.missing.length }} کلید مفقود است.
                </span>
            </div>
            <button
                class="btn btn-warning btn-sm"
                :disabled="ensuringSettings"
                @click="ensureSettings"
            >
                <span v-if="ensuringSettings" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-gear-fill me-1"></i>
                ساخت تنظیمات پیش‌فرض
            </button>
        </div>

        <!-- Header -->
        <div class="card mb-2 header-card">
            <div class="card-header">
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-award-fill"></i>
                        <span>باشگاه مشتریان</span>
                    </h3>
                    <router-link to="/club/settings"  v-if="checkPermission(['club_store'])" class="btn btn-primary add-btn">
                        <i class="bi bi-gear"></i>
                        <span>تنظیمات باشگاه</span>
                    </router-link>
                </div>
            </div>
            <div class="card-body">
                <div class="row g-2">
                    <div class="col-12 col-md-8">
                        <input
                            v-model="filters.search"
                            @input="onSearchInput"
                            type="text"
                            class="form-control search-input"
                            placeholder="جستجو بر اساس نام یا موبایل"
                        />
                    </div>
                    <div class="col-12 col-md-4">
                        <select
                            v-model="filters.level"
                            @change="onFilterChange"
                            class="form-select search-input"
                        >
                            <option value="">همه سطوح</option>
                            <option value="bronze">برنز</option>
                            <option value="gold">گلد</option>
                            <option value="platinum">پلاتینیوم</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="card">
            <div class="card-body p-2 p-md-3">
                <div v-if="loading" class="text-center my-5">
                    <div class="spinner-border" role="status"></div>
                    <p class="mt-2">در حال بارگذاری...</p>
                </div>

                <div v-else>
                    <!-- ===== دسکتاپ ===== -->
                    <div class="table-responsive d-none d-md-block">
                        <table class="table table-bordered table-striped mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th>شناسه</th>
                                    <th>نام کامل</th>
                                    <th>موبایل</th>
                                    <th>امتیاز</th>
                                    <th>سطح</th>
                                    <th>تخفیف</th>
                                    <th>ارسال رایگان باقی‌مانده</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="user in users.data" :key="user.id">
                                    <td>{{ user.id }}</td>
                                    <td>{{ user.full_name ?? '-' }}</td>
                                    <td>{{ user.mobile }}</td>
                                    <td>
                                        <span class="badge bg-primary">{{ user.total_points ?? 0 }}</span>
                                    </td>
                                    <td>
                                        <span class="level-badge" :class="levelClass(user.level)">
                                            {{ levelLabel(user.level) }}
                                        </span>
                                    </td>
                                    <td>{{ discountFor(user.level) }}٪</td>
                                    <td>
                                        <span class="badge" :class="user.free_shipping_remaining > 0 ? 'bg-success' : 'bg-secondary'">
                                            {{ user.free_shipping_remaining ?? 0 }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="d-flex flex-wrap gap-1">
                                            <router-link :to="`/club/users/${user.id}`" class="btn btn-sm btn-success">
                                                <i class="bi bi-eye"></i>
                                                <span>جزئیات</span>
                                            </router-link>
                                            <button class="btn btn-sm btn-info" @click="openPointsModal(user, 'increase')">
                                                <i class="bi bi-plus-circle"></i>
                                                <span>افزودن</span>
                                            </button>
                                            <button class="btn btn-sm btn-warning" @click="openPointsModal(user, 'decrease')">
                                                <i class="bi bi-dash-circle"></i>
                                                <span>کسر</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="!users.data || users.data.length === 0">
                                    <td colspan="8" class="text-center py-4 text-muted">
                                        کاربری یافت نشد
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- ===== موبایل ===== -->
                    <div class="d-md-none user-cards">
                        <div
                            v-for="user in users.data"
                            :key="user.id"
                            class="user-card"
                        >
                            <div class="user-card-header">
                                <div class="user-id-badge">#{{ user.id }}</div>
                                <div class="user-name">{{ user.full_name ?? '-' }}</div>
                                <span class="level-badge ms-auto" :class="levelClass(user.level)">
                                    {{ levelLabel(user.level) }}
                                </span>
                            </div>

                            <div class="user-card-body">
                                <div class="user-info-row">
                                    <i class="bi bi-phone"></i>
                                    <span class="info-label">موبایل:</span>
                                    <span class="info-value">{{ user.mobile }}</span>
                                </div>
                                <div class="user-info-row">
                                    <i class="bi bi-coin"></i>
                                    <span class="info-label">امتیاز:</span>
                                    <span class="info-value">{{ user.total_points ?? 0 }}</span>
                                </div>
                                <div class="user-info-row">
                                    <i class="bi bi-percent"></i>
                                    <span class="info-label">تخفیف:</span>
                                    <span class="info-value">{{ discountFor(user.level) }}٪</span>
                                </div>
                                <div class="user-info-row">
                                    <i class="bi bi-truck"></i>
                                    <span class="info-label">ارسال رایگان باقی‌مانده:</span>
                                    <span class="info-value">{{ user.free_shipping_remaining ?? 0 }}</span>
                                </div>
                            </div>

                            <div class="user-card-actions">
                                <router-link :to="`/club/users/${user.id}`" class="btn btn-sm btn-success flex-fill">
                                    <i class="bi bi-eye"></i>
                                    <span>جزئیات</span>
                                </router-link>
                                <button class="btn btn-sm btn-info flex-fill" @click="openPointsModal(user, 'increase')">
                                    <i class="bi bi-plus-circle"></i>
                                    <span>افزودن</span>
                                </button>
                                <button class="btn btn-sm btn-warning flex-fill" @click="openPointsModal(user, 'decrease')">
                                    <i class="bi bi-dash-circle"></i>
                                    <span>کسر</span>
                                </button>
                            </div>
                        </div>

                        <div v-if="!users.data || users.data.length === 0" class="text-center py-5 text-muted">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            <p>کاربری یافت نشد</p>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <b-pagination
                        v-model="currentPage"
                        :total-rows="users.total"
                        v-if="users.last_page != 1"
                        :per-page="users.per_page"
                        @Update:modelValue="changePage"
                        align="center"
                        class="mt-3 pagination-responsive"
                    ></b-pagination>
                </div>
            </div>
        </div>

             <!-- ===== مودال افزودن/کسر امتیاز ===== -->
        <Modal
            v-if="pointsModal.show"
            :title="pointsModal.mode === 'increase' ? 'افزودن امتیاز' : 'کسر امتیاز'"
            @closeModal="() => pointsModal.show = false"
            hide-footer
        >
            <div v-if="pointsModal.user" class="mb-3">
                <strong>{{ pointsModal.user.full_name }}</strong>
                <span class="text-muted d-block small">{{ pointsModal.user.mobile }}</span>
                <span class="text-muted d-block small">
                    امتیاز فعلی: {{ pointsModal.user.total_points ?? 0 }}
                </span>
            </div>

            <div class="mb-2">
                <label class="form-label">امتیاز <span class="text-danger">*</span></label>
                <input
                    v-model.number="pointsModal.points"
                    type="number"
                    min="1"
                    class="form-control"
                    placeholder="مثلاً 10"
                />
            </div>
            <div class="mb-2">
                <label class="form-label">عنوان <span class="text-danger">*</span></label>
                <input
                    v-model="pointsModal.title"
                    type="text"
                    class="form-control"
                    placeholder="مثلاً سفارش موفق"
                    maxlength="255"
                />
            </div>
            <div class="mb-3">
                <label class="form-label">توضیح</label>
                <textarea
                    v-model="pointsModal.description"
                    class="form-control"
                    rows="2"
                    placeholder="مثلاً تکمیل سفارش به شماره 1515"
                ></textarea>
            </div>

            <div class="d-flex gap-2 justify-content-end">
                <button class="btn btn-secondary" @click="pointsModal.show = false">انصراف</button>
                <button
                    class="btn"
                    :class="pointsModal.mode === 'increase' ? 'btn-success' : 'btn-warning'"
                    :disabled="pointsModal.submitting"
                    @click="submitPoints"
                >
                    <span v-if="pointsModal.submitting" class="spinner-border spinner-border-sm me-1"></span>
                    {{ pointsModal.mode === 'increase' ? 'افزودن' : 'کسر' }}
                </button>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import Modal from "@/components/shared/modal.vue";

const store = useAdmin();
const checkPermission = store.checkPermission;
const router = useRouter();
const route = useRoute();

const users = ref({ data: [] });
const loading = ref(false);
const filters = ref({ search: "", level: "" });
const currentPage = ref(1);

// تنظیمات باشگاه
const settingsStatus = ref(null);
const ensuringSettings = ref(false);

// سطوح و تخفیف‌ها (از تنظیمات می‌آید؛ اینجا پیش‌فرض برای نمایش)
const levelConfig = ref({
    bronze:   { label: 'برنز',      discount: 2 },
    gold:     { label: 'گلد',       discount: 3 },
    platinum: { label: 'پلاتینیوم', discount: 4 },
});

// مودال امتیاز
const pointsModal = ref({
    show: false,
    mode: 'increase', // increase | decrease
    user: null,
    points: null,
    title: '',
    description: '',
    submitting: false,
});

let abortController = null;
let searchDebounce = null;

// ===== ساخت query string =====
const buildQuery = (page = 1, search = "", level = "") => {
    const q = {};
    if (page && Number(page) > 1) q.page = String(page);
    if (search && search.trim() !== "") q.search = search.trim();
    if (level && level.trim() !== "") q.level = level.trim();
    return q;
};

// ===== sync URL =====
const syncUrl = (page, search, level) => {
    const query = buildQuery(page, search, level);
    if (JSON.stringify(route.query) !== JSON.stringify(query)) {
        router.replace({ name: route.name, query });
    }
};

// ===== دریافت لیست کاربران =====
const getUsers = async (page = 1) => {
    loading.value = true;

    if (abortController) abortController.abort();
    abortController = new AbortController();

    try {
        const response = await axios.get("/club/users", {
            params: {
                page,
                search: filters.value.search,
                level: filters.value.level,
            },
            signal: abortController.signal,
        });

        users.value = response.data;
        currentPage.value = response.data.current_page;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('درخواست قبلی کنسل شد:', error.message);
        } else {
            console.error('خطا در دریافت کاربران باشگاه:', error);
        }
    } finally {
        loading.value = false;
    }
};

// ===== دریافت وضعیت تنظیمات =====
const getSettingsStatus = async () => {
    try {
        const { data } = await axios.get("/club/settings/status");
        settingsStatus.value = data;
    } catch (error) {
        console.error('خطا در دریافت وضعیت تنظیمات:', error);
    }
};

// ===== ساخت تنظیمات =====
const ensureSettings = async () => {
    ensuringSettings.value = true;
    try {
        const { data } = await axios.post("/club/settings/ensure", { force: false });
        settingsStatus.value = data.status;
        Swal.fire({
            icon: 'success',
            title: 'انجام شد',
            text: data.message,
            timer: 1800,
            showConfirmButton: false,
        });
        // اگر تنظیمات تازه ساخته شد، برای نمایش تخفیف‌ها دوباره لود کن
        await getSettingsStatus();
    } catch (error) {
        console.error('خطا در ساخت تنظیمات:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطا',
            text: 'ساخت تنظیمات با مشکل مواجه شد.',
        });
    } finally {
        ensuringSettings.value = false;
    }
};

// ===== debounce سرچ =====
const onSearchInput = () => {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        currentPage.value = 1;
        syncUrl(1, filters.value.search, filters.value.level);
        getUsers(1);
    }, 400);
};

const onFilterChange = () => {
    currentPage.value = 1;
    syncUrl(1, filters.value.search, filters.value.level);
    getUsers(1);
};

const changePage = (page) => {
    if (page) {
        currentPage.value = page;
        syncUrl(page, filters.value.search, filters.value.level);
        getUsers(page);
    }
};

// ===== باز کردن مودال امتیاز =====
const openPointsModal = (user, mode) => {
    pointsModal.value = {
        show: true,
        mode,
        user,
        points: null,
        title: mode === 'increase' ? 'سفارش موفق' : 'کسر دستی',
        description: '',
        submitting: false,
    };
};

// ===== ارسال امتیاز =====
const submitPoints = async () => {
    const { user, mode, points, title, description } = pointsModal.value;

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
            ? `/club/users/${user.id}/points/add`
            : `/club/users/${user.id}/points/deduct`;

        await axios.post(url, {
            points,
            title: title.trim(),
            description: description?.trim() || null,
        });

        pointsModal.value.show = false;
        Swal.fire({
            icon: 'success',
            title: 'انجام شد',
            text: mode === 'increase' ? 'امتیاز افزوده شد.' : 'امتیاز کسر شد.',
            timer: 1500,
            showConfirmButton: false,
        });

        getUsers(currentPage.value);
    } catch (error) {
        console.error('خطا در ثبت امتیاز:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطا',
            text: error?.response?.data?.message || 'عملیات با مشکل مواجه شد.',
        });
    } finally {
        pointsModal.value.submitting = false;
    }
};

// ===== کمک‌کننده‌های نمایش =====
const levelLabel = (level) => levelConfig.value[level]?.label ?? level ?? '-';
const discountFor = (level) => levelConfig.value[level]?.discount ?? 0;
const levelClass = (level) => {
    return {
        bronze: 'level-bronze',
        gold: 'level-gold',
        platinum: 'level-platinum',
    }[level] ?? '';
};

// ===== واکنش به تغییر URL =====
watch(
    () => route.query,
    (newQuery) => {
        const page = Number(newQuery.page) || 1;
        const search = newQuery.search || "";
        const level = newQuery.level || "";

        if (
            String(page) !== String(currentPage.value) ||
            search !== filters.value.search ||
            level !== filters.value.level
        ) {
            filters.value.search = search;
            filters.value.level = level;
            currentPage.value = page;
            getUsers(page);
        }
    }
);

onMounted(() => {
    const page = Number(route.query.page) || 1;
    const search = route.query.search || "";
    const level = route.query.level || "";

    filters.value.search = search;
    filters.value.level = level;
    currentPage.value = page;

    getSettingsStatus();
    getUsers(page);
});
</script>

<style scoped>
/* ===== هدر صفحه ===== */
.header-card .card-header {
    padding: 16px 20px;
    background: transparent;
    border-bottom: 2px solid #f8f9fa;
}

.page-title {
    font-weight: 700;
    color: #2d3436;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.add-btn {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
}

.search-input {
    border-radius: 10px;
    padding: 10px 14px;
    border: 1px solid #e0e0e0;
    transition: all 0.2s ease;
}

.search-input:focus {
    border-color: #6c5ce7;
    box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
}

/* ===== جدول ===== */
.table {
    margin-bottom: 0;
}

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

/* ===== نشان سطح ===== */
.level-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    color: #fff;
}

.level-bronze   { background: linear-gradient(135deg, #cd7f32, #e0a96d); }
.level-gold     { background: linear-gradient(135deg, #d4a017, #f5c542); }
.level-platinum { background: linear-gradient(135deg, #6c5ce7, #a29bfe); }

/* ===== کارت‌های موبایل ===== */
.user-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.user-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

.user-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.user-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 10px;
}

.user-id-badge {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    flex-shrink: 0;
}

.user-name {
    font-weight: 700;
    color: #2d3436;
    font-size: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.user-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
}

.user-info-row i {
    color: #6c5ce7;
    font-size: 0.95rem;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
}

.info-label {
    color: #6c757d;
    flex-shrink: 0;
}

.info-value {
    color: #2d3436;
    font-weight: 600;
    margin-right: auto;
    word-break: break-word;
    text-align: left;
    direction: ltr;
}

.user-card-actions {
    display: flex;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
}

.user-card-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.75rem;
    padding: 6px 8px;
    white-space: nowrap;
}

.user-card-actions .btn span {
    display: none;
}

/* ===== Pagination ===== */
.pagination-responsive {
    flex-wrap: wrap;
    justify-content: center;
}

/* ========================================= */
/* ===== موبایل ===== */
/* ========================================= */
@media (max-width: 767.98px) {
    .header-card .card-header {
        padding: 12px 14px;
    }

    .header-card .card-body {
        padding: 12px 14px;
    }

    .page-title {
        font-size: 1.15rem;
        justify-content: center;
        text-align: center;
        width: 100%;
    }

    .add-btn {
        width: 100%;
    }

    .search-input {
        padding: 9px 12px;
        font-size: 0.9rem;
    }

    .user-card-actions .btn span {
        display: inline;
    }
}

@media (max-width: 399.98px) {
    .page-title {
        font-size: 1rem;
    }

    .user-card {
        padding: 12px;
    }

    .user-name {
        font-size: 0.9rem;
    }

    .user-info-row {
        font-size: 0.78rem;
    }

    .user-card-actions .btn {
        font-size: 0.7rem;
        padding: 5px 6px;
    }
}

@media (min-width: 768px) {
    .user-cards {
        display: none;
    }
}
</style>