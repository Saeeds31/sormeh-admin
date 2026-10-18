<template>
    <div class="users-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['user_view'])">
        <!-- Header -->
        <div class="card mb-2 header-card">
            <div class="card-header">
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-people-fill"></i>
                        <span>مدیریت کاربران</span>
                    </h3>
                    <router-link to="/users/create" class="btn btn-primary add-btn">
                        <i class="bi bi-plus"></i>
                        <span>افزودن</span>
                    </router-link>
                </div>
            </div>
            <div class="card-body">
                <input
                    v-model="filters.search"
                    @input="onSearchInput"
                    type="text"
                    class="form-control search-input"
                    placeholder="جستجو بر اساس نام یا موبایل"
                />
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
                    <!-- ===== نمایش جدول در دسکتاپ ===== -->
                    <div class="table-responsive d-none d-md-block">
                        <table class="table table-bordered table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>شناسه</th>
                                    <th>نام کامل</th>
                                    <th>موبایل</th>
                                    <th>کدملی</th>
                                    <th>تاریخ تولد</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="user in users.data" :key="user.id">
                                    <td>{{ user.id }}</td>
                                    <td>{{ user.full_name }}</td>
                                    <td>{{ user.mobile }}</td>
                                    <td>{{ user.national_code ?? '-' }}</td>
                                    <td>{{ user.birth_date ?? '-' }}</td>
                                    <td>
                                        <div class="d-flex flex-wrap gap-1">
                                            <router-link :to="`/users/${user.id}/addresses`" class="btn btn-sm btn-success">
                                                <i class="bi bi-house"></i>
                                                <span>آدرس ها</span>
                                            </router-link>
                                            <router-link :to="`/users/${user.id}/edit`" class="btn btn-sm btn-info">
                                                <i class="bi bi-pen"></i>
                                                <span>ویرایش</span>
                                            </router-link>
                                            <button class="btn btn-sm btn-danger" @click="confirmDelete(user.id)">
                                                <i class="bi bi-trash3-fill"></i>
                                                <span>حذف</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- ===== نمایش کارتی در موبایل ===== -->
                    <div class="d-md-none user-cards">
                        <div
                            v-for="user in users.data"
                            :key="user.id"
                            class="user-card"
                        >
                            <div class="user-card-header">
                                <div class="user-id-badge">#{{ user.id }}</div>
                                <div class="user-name">{{ user.full_name }}</div>
                            </div>

                            <div class="user-card-body">
                                <div class="user-info-row">
                                    <i class="bi bi-phone"></i>
                                    <span class="info-label">موبایل:</span>
                                    <span class="info-value">{{ user.mobile }}</span>
                                </div>
                                <div class="user-info-row">
                                    <i class="bi bi-person-vcard"></i>
                                    <span class="info-label">کدملی:</span>
                                    <span class="info-value">{{ user.national_code ?? '-' }}</span>
                                </div>
                                <div class="user-info-row">
                                    <i class="bi bi-calendar"></i>
                                    <span class="info-label">تاریخ تولد:</span>
                                    <span class="info-value">{{ user.birth_date ?? '-' }}</span>
                                </div>
                            </div>

                            <div class="user-card-actions">
                                <router-link :to="`/users/${user.id}/addresses`" class="btn btn-sm btn-success flex-fill">
                                    <i class="bi bi-house"></i>
                                    <span>آدرس‌ها</span>
                                </router-link>
                                <router-link :to="`/users/${user.id}/edit`" class="btn btn-sm btn-info flex-fill">
                                    <i class="bi bi-pen"></i>
                                    <span>ویرایش</span>
                                </router-link>
                                <button class="btn btn-sm btn-danger flex-fill" @click="confirmDelete(user.id)">
                                    <i class="bi bi-trash3-fill"></i>
                                    <span>حذف</span>
                                </button>
                            </div>
                        </div>

                        <!-- حالت خالی -->
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
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;
const router = useRouter();
const route = useRoute();
const users = ref({ data: [] });
const loading = ref(false);
const filters = ref({ search: "" });
const currentPage = ref(1);

let abortController = null;
let searchDebounce = null;

// ===== ساخت query string از state =====
const buildQuery = (page = 1, search = "") => {
    const q = {};
    if (page && Number(page) > 1) q.page = String(page);
    if (search && search.trim() !== "") q.search = search.trim();
    return q;
};

// ===== sync کردن URL با state =====
const syncUrl = (page, search) => {
    const query = buildQuery(page, search);
    if (JSON.stringify(route.query) !== JSON.stringify(query)) {
        router.replace({ name: route.name, query });
    }
};

const getUsers = async (page = 1) => {
    loading.value = true;

    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController();

    try {
        const response = await axios.get("/users", {
            params: {
                page,
                search: filters.value.search,
            },
            signal: abortController.signal,
        });

        users.value = response.data;
        currentPage.value = response.data.current_page;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('درخواست قبلی کنسل شد:', error.message);
        } else {
            console.error('خطا در دریافت کاربران:', error);
        }
    } finally {
        loading.value = false;
    }
};

// ===== هندل کردن سرچ با debounce =====
const onSearchInput = () => {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        currentPage.value = 1;
        syncUrl(1, filters.value.search);
        getUsers(1);
    }, 400);
};

const changePage = (page) => {
    if (page) {
        currentPage.value = page;
        syncUrl(page, filters.value.search);
        getUsers(page);
    }
};

const confirmDelete = (id) => {
    Swal.fire({
        title: "آیا مطمئن هستید؟",
        text: "این عملیات قابل بازگشت نیست!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "بله، حذف شود",
        cancelButtonText: "انصراف",
    }).then(async (result) => {
        if (result.isConfirmed) {
            await axios.delete(`/users/${id}`);
            getUsers(currentPage.value);
            Swal.fire("حذف شد!", "کاربر موردنظر با موفقیت حذف شد.", "success");
        }
    });
};

// ===== واکنش به تغییرات URL (back/forward مرورگر) =====
watch(
    () => route.query,
    (newQuery) => {
        const page = Number(newQuery.page) || 1;
        const search = newQuery.search || "";

        if (String(page) !== String(currentPage.value) || search !== filters.value.search) {
            filters.value.search = search;
            currentPage.value = page;
            getUsers(page);
        }
    }
);

onMounted(() => {
    const page = Number(route.query.page) || 1;
    const search = route.query.search || "";

    filters.value.search = search;
    currentPage.value = page;
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
/* ===== موبایل (کمتر از 768px) ===== */
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

    /* نمایش label دکمه‌ها در موبایل */
    .user-card-actions .btn span {
        display: inline;
    }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
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

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
    .user-cards {
        display: none;
    }
}
</style>