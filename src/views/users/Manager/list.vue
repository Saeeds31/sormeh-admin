<template>
    <div class="managers-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['manager_view'])">
        <!-- هدر -->
        <div class="card mb-2 header-card">
            <div class="card-header">
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-person-workspace"></i>
                        <span>مدیریت مدیران</span>
                    </h3>
                    <router-link to="/users/managers/create" class="btn btn-primary add-btn">
                        <i class="bi bi-plus"></i>
                        <span>افزودن مدیر</span>
                    </router-link>
                </div>
            </div>
            <div class="card-body">
                <input
                    v-model="filters.search"
                    @input="getManagers"
                    type="text"
                    class="form-control search-input"
                    placeholder="جستجو بر اساس نام یا موبایل"
                />
            </div>
        </div>

        <!-- جدول -->
        <div class="card">
            <div class="card-body p-2 p-md-3">
                <div v-if="loading" class="text-center my-5">
                    <div class="spinner-border" role="status"></div>
                    <p class="mt-2">در حال بارگذاری...</p>
                </div>

                <div v-else>
                    <!-- ===== حالت خالی ===== -->
                    <div v-if="users.length === 0" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        <p>مدیری یافت نشد</p>
                    </div>

                    <!-- ===== نمایش جدول در دسکتاپ ===== -->
                    <div v-else class="table-responsive d-none d-md-block">
                        <table class="table table-bordered table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>شناسه</th>
                                    <th>نام کامل</th>
                                    <th>موبایل</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="user in users" :key="user.id">
                                    <td>{{ user.id }}</td>
                                    <td>{{ user.full_name }}</td>
                                    <td>{{ user.mobile }}</td>
                                    <td>
                                        <div class="d-flex flex-wrap gap-1">
                                            <router-link :to="`/users/managers/${user.id}/edit`" class="btn btn-sm btn-info">
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
                    <div v-if="users.length > 0" class="d-md-none manager-cards">
                        <div
                            v-for="user in users"
                            :key="user.id"
                            class="manager-card"
                        >
                            <div class="manager-card-header">
                                <div class="manager-avatar">
                                    <i class="bi bi-person-fill"></i>
                                </div>
                                <div class="manager-info">
                                    <div class="manager-name">{{ user.full_name }}</div>
                                    <div class="manager-id">شناسه: #{{ user.id }}</div>
                                </div>
                            </div>

                            <div class="manager-card-body">
                                <div class="manager-info-row">
                                    <i class="bi bi-phone"></i>
                                    <span class="info-label">موبایل:</span>
                                    <span class="info-value">{{ user.mobile }}</span>
                                </div>
                            </div>

                            <div class="manager-card-actions">
                                <router-link :to="`/users/managers/${user.id}/edit`" class="btn btn-sm btn-info flex-fill">
                                    <i class="bi bi-pen"></i>
                                    <span>ویرایش</span>
                                </router-link>
                                <button class="btn btn-sm btn-danger flex-fill" @click="confirmDelete(user.id)">
                                    <i class="bi bi-trash3-fill"></i>
                                    <span>حذف</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;
const router = useRouter();
const route = useRoute();

// ✅ اینجا آرایه مستقیم نگه می‌داریم (نه آبجکت)
const users = ref([]);
const loading = ref(false);
const filters = ref({ search: "" });
let abortController = null;

const getManagers = async () => {
    loading.value = true;

    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController();

    try {
        const response = await axios.get("/user-managers", {
            params: {
                search: filters.value.search,
            },
            signal: abortController.signal,
        });

        // ✅ پشتیبانی از هر دو ساختار: مستقیم یا داخل data
        const raw = response.data;
        if (Array.isArray(raw)) {
            users.value = raw;
        } else if (Array.isArray(raw?.data)) {
            users.value = raw.data;
        } else {
            users.value = [];
        }
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('درخواست قبلی کنسل شد:', error.message);
        } else {
            console.error('خطا در دریافت مدیران:', error);
            users.value = [];
        }
    } finally {
        loading.value = false;
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
            try {
                await axios.delete(`/user-managers/${id}`);
                getManagers();
                Swal.fire("حذف شد!", "مدیر موردنظر با موفقیت حذف شد.", "success");
            } catch (err) {
                Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
            }
        }
    });
};

onMounted(() => {
    getManagers();
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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
.manager-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.manager-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

.manager-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.manager-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 12px;
}

.manager-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 22px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.manager-info {
    flex: 1;
    min-width: 0;
}

.manager-name {
    font-weight: 700;
    color: #2d3436;
    font-size: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.manager-id {
    font-size: 0.75rem;
    color: #6c757d;
    margin-top: 2px;
}

.manager-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.manager-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
}

.manager-info-row i {
    color: #3b82f6;
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

.manager-card-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
}

.manager-card-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.8rem;
    padding: 8px 10px;
    white-space: nowrap;
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
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
    .page-title {
        font-size: 1rem;
    }

    .manager-card {
        padding: 12px;
    }

    .manager-avatar {
        width: 42px;
        height: 42px;
        font-size: 18px;
    }

    .manager-name {
        font-size: 0.9rem;
    }

    .manager-info-row {
        font-size: 0.78rem;
    }

    .manager-card-actions .btn {
        font-size: 0.72rem;
        padding: 6px 8px;
    }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
    .manager-cards {
        display: none;
    }
}
</style>