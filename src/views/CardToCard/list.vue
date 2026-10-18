<template>
    <div class="container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['cardtocard_view'])">
        <div class="card mb-2 header-card">
            <div class="card-header">
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-receipt"></i>
                        <span>مدیریت رسیدهای کارت به کارت</span>
                    </h3>
                    <span class="badge bg-info total-badge">
                        تعداد کل: {{ receipts.total }}
                    </span>
                </div>
            </div>
            <div class="card-body">
                <form @submit.prevent="getReceipts()">
                    <div class="row g-2">
                        <div class="col-12 col-sm-6 col-md-3">
                            <input v-model="filters.order_id" type="number" class="form-control search-input"
                                placeholder="جستجو بر اساس شماره سفارش" />
                        </div>
                        <div class="col-12 col-sm-6 col-md-3">
                            <select v-model="filters.status" class="form-select">
                                <option value="">همه وضعیت‌ها</option>
                                <option value="pending">در انتظار بررسی</option>
                                <option value="approved">تأیید شده</option>
                                <option value="rejected">رد شده</option>
                            </select>
                        </div>
                        <div class="col-12 col-sm-6 col-md-2">
                            <button class="btn btn-primary w-100" type="submit">
                                <i class="bi bi-search"></i>
                                جستجو
                            </button>
                        </div>
                        <div class="col-12 col-sm-6 col-md-2">
                            <button class="btn btn-secondary w-100" type="button" @click="resetFilters">
                                <i class="bi bi-arrow-counterclockwise"></i>
                                بازنشانی
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- جدول -->
        <div class="card">
            <div class="card-body p-2 p-md-3">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else>
                    <!-- ===== حالت خالی ===== -->
                    <div v-if="receipts.data?.length === 0" class="text-center py-5">
                        <i class="bi bi-inbox fs-1 text-muted"></i>
                        <p class="text-muted mt-2">هیچ رسیدی یافت نشد</p>
                    </div>

                    <div v-else>
                        <!-- ===== نمایش جدول در دسکتاپ ===== -->
                        <div class="table-responsive d-none d-md-block">
                            <table class="table table-bordered table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>شماره سفارش</th>
                                        <th>نام کاربر</th>
                                        <th>مبلغ سفارش</th>
                                        <th>تصویر رسید</th>
                                        <th>کد پیگیری</th>
                                        <th>وضعیت رسید</th>
                                        <th>تاریخ آپلود</th>
                                        <th>عملیات</th>
                                        <th>نظارت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="receipt in receipts.data" :key="receipt.id">
                                        <td>{{ receipt.id }}</td>
                                        <td>
                                            <router-link :to="`/orders/${receipt.order_id}`" class="text-primary">
                                                #{{ receipt.order_id }}
                                            </router-link>
                                        </td>
                                        <td>{{ receipt.order?.user?.full_name || 'نامشخص' }}</td>
                                        <td>{{ formatPrice(receipt.order?.total || 0) }} تومان</td>
                                        <td>
                                            <button class="btn btn-sm btn-info" @click="previewImage(receipt.image_path)">
                                                <i class="bi bi-eye"></i>
                                                <span>مشاهده</span>
                                            </button>
                                        </td>
                                        <td>{{ receipt.tracking_code || '—' }}</td>
                                        <td>
                                            <span :class="getStatusClass(receipt.status)">
                                                {{ getStatusLabel(receipt.status) }}
                                            </span>
                                        </td>
                                        <td>{{ formatDate(receipt.created_at) }}</td>
                                        <td>
                                            <!-- دکمه‌های تایید و رد (فقط برای وضعیت pending) -->
                                            <template v-if="checkPermission(['cardtocard_update'])">

                                                <div class="d-flex flex-column gap-1">

                                                    <button
                                                        v-if="receipt.status != 'send_again' && receipt.status != 'rejected'"
                                                        class="btn btn-sm btn-warning" @click="sendAgainReceipt(receipt)">
                                                        <i class="bi bi-check-circle"></i>
                                                        <span>رد و ارسال مجدد</span>
                                                    </button>
                                                    <button v-if="receipt.status != 'approved' && receipt.status != 'rejected'"
                                                        class="btn btn-sm btn-success" @click="approveReceipt(receipt)">
                                                        <i class="bi bi-check-circle"></i>
                                                        <span>تایید</span>
                                                    </button>
                                                    <button class="btn btn-sm btn-danger" v-if="receipt.status != 'rejected'"
                                                        @click="rejectReceipt(receipt)">
                                                        <i class="bi bi-x-circle"></i>
                                                        <span>رد کامل رسید و سفارش</span>
                                                    </button>
                                                </div>
                                            </template>


                                        </td>
                                        <td>
                                            <span>
                                                {{ receipt.admin ? `بررسی شده توسط ${receipt.admin.full_name}` : '—' }}

                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- ===== نمایش کارتی در موبایل ===== -->
                        <div class="d-md-none receipt-cards">
                            <div
                                v-for="receipt in receipts.data"
                                :key="receipt.id"
                                class="receipt-card"
                            >
                                <div class="receipt-card-header">
                                    <div class="receipt-id-badge">#{{ receipt.id }}</div>
                                    <router-link :to="`/orders/${receipt.order_id}`" class="receipt-order-link">
                                        سفارش #{{ receipt.order_id }}
                                    </router-link>
                                    <span :class="getStatusClass(receipt.status)">
                                        {{ getStatusLabel(receipt.status) }}
                                    </span>
                                </div>

                                <div class="receipt-card-body">
                                    <div class="receipt-info-row">
                                        <i class="bi bi-person"></i>
                                        <span class="info-label">کاربر:</span>
                                        <span class="info-value">{{ receipt.order?.user?.full_name || 'نامشخص' }}</span>
                                    </div>
                                    <div class="receipt-info-row">
                                        <i class="bi bi-cash-stack"></i>
                                        <span class="info-label">مبلغ سفارش:</span>
                                        <span class="info-value">{{ formatPrice(receipt.order?.total || 0) }} تومان</span>
                                    </div>
                                    <div class="receipt-info-row">
                                        <i class="bi bi-upc-scan"></i>
                                        <span class="info-label">کد پیگیری:</span>
                                        <span class="info-value">{{ receipt.tracking_code || '—' }}</span>
                                    </div>
                                    <div class="receipt-info-row">
                                        <i class="bi bi-calendar"></i>
                                        <span class="info-label">تاریخ آپلود:</span>
                                        <span class="info-value">{{ formatDate(receipt.created_at) }}</span>
                                    </div>
                                    <div class="receipt-info-row">
                                        <i class="bi bi-person-badge"></i>
                                        <span class="info-label">نظارت:</span>
                                        <span class="info-value">{{ receipt.admin ? `بررسی شده توسط ${receipt.admin.full_name}` : '—' }}</span>
                                    </div>
                                </div>

                                <div class="receipt-card-actions">
                                    <button class="btn btn-sm btn-info flex-fill" @click="previewImage(receipt.image_path)">
                                        <i class="bi bi-eye"></i>
                                        <span>مشاهده رسید</span>
                                    </button>
                                </div>

                                <div class="receipt-card-actions" v-if="checkPermission(['cardtocard_update'])">
                                    <button
                                        v-if="receipt.status != 'send_again' && receipt.status != 'rejected'"
                                        class="btn btn-sm btn-warning flex-fill" @click="sendAgainReceipt(receipt)">
                                        <i class="bi bi-check-circle"></i>
                                        <span>ارسال مجدد</span>
                                    </button>
                                    <button v-if="receipt.status != 'approved' && receipt.status != 'rejected'"
                                        class="btn btn-sm btn-success flex-fill" @click="approveReceipt(receipt)">
                                        <i class="bi bi-check-circle"></i>
                                        <span>تایید</span>
                                    </button>
                                    <button class="btn btn-sm btn-danger flex-fill" v-if="receipt.status != 'rejected'"
                                        @click="rejectReceipt(receipt)">
                                        <i class="bi bi-x-circle"></i>
                                        <span>رد</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <b-pagination v-model="currentPage" :total-rows="receipts.total" v-if="receipts.last_page != 1"
                        :per-page="receipts.per_page" @Update:modelValue="changePage" align="center"
                        class="mt-3 pagination-responsive">
                    </b-pagination>
                </div>
            </div>
        </div>
    </div>

    <!-- مودال پیش‌نمایش تصویر -->
    <div v-if="showImageModal" class="modal show d-block" style="background: rgba(0,0,0,0.5);"
        @click.self="closeImageModal">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">پیش‌نمایش رسید</h5>
                    <button type="button" class="btn-close" @click="closeImageModal"></button>
                </div>
                <div class="modal-body text-center">
                    <img :src="previewImageUrl" alt="رسید" class="img-fluid" style="max-height: 70vh;" />
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

const currentPage = ref(1);
const router = useRouter();
const route = useRoute();
const receipts = ref({ data: [], total: 0, per_page: 15, last_page: 1 });
const loading = ref(false);
const filters = ref({ order_id: "", status: "" });
const currentUrl = "/card-transfer/receipts";

// مودال پیش‌نمایش
const showImageModal = ref(false);
const previewImageUrl = ref('');

// دریافت لیست رسیدها
async function getReceipts(url = currentUrl) {
    loading.value = true;
    try {
        const response = await axios.get(url, {
            params: {
                order_id: filters.value.order_id || undefined,
                status: filters.value.status || undefined,
                per_page: 15
            }
        });

        receipts.value = {
            data: response.data.data || [],
            total: response.data.meta?.total || 0,
            per_page: response.data.meta?.per_page || 15,
            last_page: response.data.meta?.last_page || 1,
            current_page: response.data.meta?.current_page || 1
        };

        currentPage.value = response.data.meta?.current_page || 1;
    } catch (err) {
        console.error("Error fetching receipts:", err);
        Swal.fire("خطا", "مشکلی در بارگذاری داده‌ها پیش آمد", "error");
    } finally {
        loading.value = false;
    }
}

function changePage(selectedPage) {
    if (selectedPage) {
        router.replace({ name: route.name, query: { page: selectedPage } });
        getReceipts(`${currentUrl}?page=${selectedPage}`);
    }
}

function resetFilters() {
    filters.value = { order_id: "", status: "" };
    getReceipts();
}


// تایید رسید
function approveReceipt(receipt) {
    Swal.fire({
        title: "تایید رسید",
        text: `آیا از تایید رسید سفارش #${receipt.order_id} مطمئن هستید؟`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "بله، تایید شود",
        cancelButtonText: "انصراف",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await axios.put(`/card-transfer/receipt/${receipt.id}/review`, {
                    status: 'approved'
                });

                Swal.fire("موفق", "رسید با موفقیت تایید شد", "success");
                getReceipts();
            } catch (err) {
                console.error("Error approving receipt:", err);
                Swal.fire("خطا", err.response?.data?.message || "مشکلی در تایید رسید پیش آمد", "error");
            }
        }
    });
}

function sendAgainReceipt(receipt) {
    Swal.fire({
        title: "رد رسید برای بارگذاری مجدد",
        text: "لطفاً دلیل رد رسید را وارد کنید:",
        icon: "warning",
        input: "text",
        inputPlaceholder: "مثال: رسید نامشخص است",
        inputAttributes: {
            'aria-label': 'توضیح دلیل رد'
        },
        showCancelButton: true,
        confirmButtonText: "بله، رد شود",
        cancelButtonText: "انصراف",
        preConfirm: (value) => {
            if (!value || value.trim() === '') {
                Swal.showValidationMessage('لطفاً دلیل رد را وارد کنید');
                return false;
            }
            return value.trim();
        }
    }).then(async (result) => {
        if (result.isConfirmed && result.value) {
            try {
                await axios.put(`/card-transfer/receipt/${receipt.id}/review`, {
                    status: 'send_again',
                    description: result.value
                });

                Swal.fire("موفق", "رسید با موفقیت رد شد", "success");
                getReceipts();
            } catch (err) {
                console.error("Error rejecting receipt:", err);
                Swal.fire("خطا", err.response?.data?.message || "مشکلی در رد رسید پیش آمد", "error");
            }
        }
    });
}
// رد رسید
function rejectReceipt(receipt) {
    Swal.fire({
        title: "رد رسید",
        text: "لطفاً دلیل رد رسید را وارد کنید:",
        icon: "warning",
        input: "text",
        inputPlaceholder: "مثال: رسید نامشخص است",
        inputAttributes: {
            'aria-label': 'توضیح دلیل رد'
        },
        showCancelButton: true,
        confirmButtonText: "بله، رد شود",
        cancelButtonText: "انصراف",
        preConfirm: (value) => {
            if (!value || value.trim() === '') {
                Swal.showValidationMessage('لطفاً دلیل رد را وارد کنید');
                return false;
            }
            return value.trim();
        }
    }).then(async (result) => {
        if (result.isConfirmed && result.value) {
            try {
                await axios.put(`/card-transfer/receipt/${receipt.id}/review`, {
                    status: 'rejected',
                    description: result.value
                });

                Swal.fire("موفق", "رسید با موفقیت رد شد", "success");
                getReceipts();
            } catch (err) {
                console.error("Error rejecting receipt:", err);
                Swal.fire("خطا", err.response?.data?.message || "مشکلی در رد رسید پیش آمد", "error");
            }
        }
    });
}

// پیش‌نمایش تصویر
function previewImage(url) {
    previewImageUrl.value = window.baseImageAddress + url;
    showImageModal.value = true;
}

function closeImageModal() {
    showImageModal.value = false;
    previewImageUrl.value = '';
}

// توابع کمکی
function formatPrice(price) {
    return price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
}

function formatDate(date) {
    if (!date) return "-";
    try {
        const dateObj = new Date(date);
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(dateObj);
    } catch {
        return date;
    }
}

function getStatusLabel(status) {
    const map = {
        pending: "در انتظار بررسی",
        approved: "تأیید شده",
        send_again: "در انتظار ارسال مجدد رسید",
        rejected: "رد شده"
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        pending: "badge bg-warning text-dark",
        approved: "badge bg-success",
        rejected: "badge bg-danger"
    };
    return map[status] || "badge bg-secondary";
}

onMounted(() => {
    currentPage.value = route.query.page ?? 1;
    getReceipts(`${currentUrl}?page=${currentPage.value}`);
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

.total-badge {
    font-size: 0.85rem;
    padding: 0.5rem 0.9rem;
    white-space: nowrap;
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
    font-size: 0.85rem;
}

.table tbody td {
    vertical-align: middle;
    font-size: 0.85rem;
}

.badge {
    font-size: 0.75rem;
    padding: 0.35rem 0.6rem;
}

/* ===== کارت‌های موبایل ===== */
.receipt-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.receipt-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

.receipt-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.receipt-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.receipt-id-badge {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    flex-shrink: 0;
}

.receipt-order-link {
    font-weight: 700;
    color: #3b82f6;
    font-size: 0.95rem;
    text-decoration: none;
    flex: 1;
    min-width: 0;
}

.receipt-order-link:hover {
    text-decoration: underline;
}

.receipt-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.receipt-info-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.85rem;
}

.receipt-info-row i {
    color: #6c5ce7;
    font-size: 0.95rem;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
    margin-top: 2px;
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
}

.receipt-card-actions {
    display: flex;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
    flex-wrap: wrap;
}

.receipt-card-actions + .receipt-card-actions {
    padding-top: 6px;
    border-top: none;
}

.receipt-card-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.75rem;
    padding: 6px 8px;
    white-space: nowrap;
}

.receipt-card-actions .btn span {
    display: none;
}

/* ===== Pagination ===== */
.pagination-responsive {
    flex-wrap: wrap;
    justify-content: center;
}

/* ===== Modal ===== */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1050;
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

    .total-badge {
        align-self: center;
    }

    .search-input {
        padding: 9px 12px;
        font-size: 0.9rem;
    }

    /* نمایش label دکمه‌ها در موبایل */
    .receipt-card-actions .btn span {
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

    .receipt-card {
        padding: 12px;
    }

    .receipt-order-link {
        font-size: 0.85rem;
    }

    .receipt-info-row {
        font-size: 0.78rem;
    }

    .receipt-card-actions .btn {
        font-size: 0.7rem;
        padding: 5px 6px;
    }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
    .receipt-cards {
        display: none;
    }
}
</style>