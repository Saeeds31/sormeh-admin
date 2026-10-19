<template>
    <div class="container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['customer_photos_view'])">
        <!-- ===== هدر ===== -->
        <div class="card mb-2 header-card">
            <div class="card-header">
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-images"></i>
                        <span>مدیریت عکس‌های مشتریان</span>
                    </h3>
                    <span class="badge bg-info total-badge">
                        تعداد کل: {{ photos.total }}
                    </span>
                </div>
            </div>
            <div class="card-body">
                <form @submit.prevent="getPhotos()">
                    <div class="row g-2">
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
                                <i class="bi bi-search"></i> جستجو
                            </button>
                        </div>
                        <div class="col-12 col-sm-6 col-md-2">
                            <button class="btn btn-secondary w-100" type="button" @click="resetFilters">
                                <i class="bi bi-arrow-counterclockwise"></i> بازنشانی
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- ===== لیست ===== -->
        <div class="card">
            <div class="card-body p-2 p-md-3">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else>
                    <div v-if="photos.data?.length === 0" class="text-center py-5">
                        <i class="bi bi-inbox fs-1 text-muted"></i>
                        <p class="text-muted mt-2">هیچ درخواستی یافت نشد</p>
                    </div>

                    <div v-else>
                        <!-- ===== جدول دسکتاپ ===== -->
                        <div class="table-responsive d-none d-md-block">
                            <table class="table table-bordered table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>تصویر</th>
                                        <th>محصول</th>
                                        <th>کاربر</th>
                                        <th>سفارش</th>
                                        <th>تعداد عکس</th>
                                        <th>وضعیت</th>
                                        <th>تاریخ ارسال</th>
                                        <th>نظارت</th>
                                        <th>عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in photos.data" :key="item.id">
                                        <td>{{ item.id }}</td>
                                        <td>
                                            <img :src="imageUrl(item.thumbnail_path)" alt="thumb"
                                                class="table-thumb" @click="openDetails(item)" />
                                        </td>
                                        <td>{{ item.product?.name || '—' }}</td>
                                        <td>{{ item.user?.full_name || 'نامشخص' }}</td>
                                        <td>
                                            <span v-if="item.order_item?.order_id">#{{ item.order_item.order_id }}</span>
                                            <span v-else>—</span>
                                        </td>
                                        <td>{{ (item.images || []).length }}</td>
                                        <td>
                                            <span :class="getStatusClass(item.status)">
                                                {{ getStatusLabel(item.status) }}
                                            </span>
                                        </td>
                                        <td>{{ formatDate(item.created_at) }}</td>
                                        <td>
                                            <span v-if="item.moderator">
                                                {{ item.moderator.full_name }}
                                            </span>
                                            <span v-else>—</span>
                                        </td>
                                        <td>
                                            <div class="d-flex flex-column gap-1">
                                                <button class="btn btn-sm btn-info" @click="openDetails(item)">
                                                    <i class="bi bi-eye"></i> جزئیات
                                                </button>

                                                <template v-if="checkPermission(['customer_photos_update'])">
                                                    <button v-if="item.status !== 'approved'"
                                                        class="btn btn-sm btn-success" @click="approve(item)">
                                                        <i class="bi bi-check-circle"></i> تایید
                                                    </button>
                                                    <button v-if="item.status !== 'rejected'"
                                                        class="btn btn-sm btn-danger" @click="reject(item)">
                                                        <i class="bi bi-x-circle"></i> رد
                                                    </button>
                                                </template>

                                                <button v-if="checkPermission(['customer_photos_delete'])"
                                                    class="btn btn-sm btn-outline-danger" @click="remove(item)">
                                                    <i class="bi bi-trash"></i> حذف
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- ===== کارت موبایل ===== -->
                        <div class="d-md-none photo-cards">
                            <div v-for="item in photos.data" :key="item.id" class="photo-card">
                                <div class="photo-card-header">
                                    <div class="photo-id-badge">#{{ item.id }}</div>
                                    <span class="product-name">{{ item.product?.name || '—' }}</span>
                                    <span :class="getStatusClass(item.status)">
                                        {{ getStatusLabel(item.status) }}
                                    </span>
                                </div>

                                <div class="photo-card-body">
                                    <img :src="imageUrl(item.thumbnail_path)" alt="thumb" class="mobile-thumb"
                                        @click="openDetails(item)" />

                                    <div class="photo-info">
                                        <div class="photo-info-row">
                                            <i class="bi bi-person"></i>
                                            <span class="info-label">کاربر:</span>
                                            <span class="info-value">{{ item.user?.full_name || 'نامشخص' }}</span>
                                        </div>
                                        <div class="photo-info-row">
                                            <i class="bi bi-box-seam"></i>
                                            <span class="info-label">سفارش:</span>
                                            <span class="info-value">
                                                {{ item.order_item?.order_id ? '#' + item.order_item.order_id : '—' }}
                                            </span>
                                        </div>
                                        <div class="photo-info-row">
                                            <i class="bi bi-images"></i>
                                            <span class="info-label">تعداد عکس:</span>
                                            <span class="info-value">{{ (item.images || []).length }}</span>
                                        </div>
                                        <div class="photo-info-row">
                                            <i class="bi bi-calendar"></i>
                                            <span class="info-label">تاریخ:</span>
                                            <span class="info-value">{{ formatDate(item.created_at) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="photo-card-actions">
                                    <button class="btn btn-sm btn-info flex-fill" @click="openDetails(item)">
                                        <i class="bi bi-eye"></i> جزئیات
                                    </button>
                                    <template v-if="checkPermission(['customer_photos_update'])">
                                        <button v-if="item.status !== 'approved'"
                                            class="btn btn-sm btn-success flex-fill" @click="approve(item)">
                                            <i class="bi bi-check-circle"></i> تایید
                                        </button>
                                        <button v-if="item.status !== 'rejected'"
                                            class="btn btn-sm btn-danger flex-fill" @click="reject(item)">
                                            <i class="bi bi-x-circle"></i> رد
                                        </button>
                                    </template>
                                </div>
                                <div class="photo-card-actions" v-if="checkPermission(['customer_photos_delete'])">
                                    <button class="btn btn-sm btn-outline-danger flex-fill" @click="remove(item)">
                                        <i class="bi bi-trash"></i> حذف
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <b-pagination v-model="currentPage" :total-rows="photos.total" v-if="photos.last_page != 1"
                        :per-page="photos.per_page" @Update:modelValue="changePage" align="center"
                        class="mt-3 pagination-responsive">
                    </b-pagination>
                </div>
            </div>
        </div>
    </div>

    <!-- ===== مودال جزئیات ===== -->
    <div v-if="showDetailsModal" class="modal show d-block" style="background: rgba(0,0,0,0.5);"
        @click.self="closeDetails">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-images"></i> جزئیات عکس‌ها — #{{ selected?.id }}
                    </h5>
                    <button type="button" class="btn-close" @click="closeDetails"></button>
                </div>
                <div class="modal-body" v-if="selected">
                    <!-- اطلاعات -->
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <div class="detail-box">
                                <i class="bi bi-person"></i>
                                <strong>کاربر:</strong> {{ selected.user?.full_name || 'نامشخص' }}
                                <span v-if="selected.user?.mobile" class="text-muted">({{ selected.user.mobile }})</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-box">
                                <i class="bi bi-box-seam"></i>
                                <strong>محصول:</strong> {{ selected.product?.name || '—' }}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-box">
                                <i class="bi bi-receipt"></i>
                                <strong>سفارش:</strong>
                                {{ selected.order_item?.order_id ? '#' + selected.order_item.order_id : '—' }}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-box">
                                <i class="bi bi-flag"></i>
                                <strong>وضعیت:</strong>
                                <span :class="getStatusClass(selected.status)">
                                    {{ getStatusLabel(selected.status) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- کپشن -->
                    <div v-if="selected.caption" class="detail-box caption-box mb-3">
                        <i class="bi bi-chat-left-text"></i>
                        <strong>کپشن مشتری:</strong>
                        <p class="mb-0 mt-2">{{ selected.caption }}</p>
                    </div>

                    <!-- دلیل رد -->
                    <div v-if="selected.status === 'rejected' && selected.reject_reason"
                        class="detail-box reject-box mb-3">
                        <i class="bi bi-x-octagon"></i>
                        <strong>دلیل رد:</strong>
                        <p class="mb-0 mt-2">{{ selected.reject_reason }}</p>
                    </div>

                    <!-- همه تصاویر -->
                    <h6 class="mb-2"><i class="bi bi-images"></i> تصاویر ({{ (selected.images || []).length }})</h6>
                    <div class="image-gallery">
                        <div v-for="(img, idx) in selected.images" :key="idx" class="gallery-item"
                            @click="previewImage(img)">
                            <img :src="imageUrl(img)" :alt="`image-${idx + 1}`" />
                            <span class="img-index">{{ idx + 1 }}</span>
                            <span v-if="img === selected.thumbnail_path" class="img-thumb-badge">
                                <i class="bi bi-star-fill"></i>
                            </span>
                        </div>
                    </div>

                    <!-- اقدامات ادمین -->
                    <div class="mt-4 d-flex flex-wrap gap-2">
                        <button v-if="selected.status !== 'approved'" class="btn btn-success"
                            @click="approve(selected)">
                            <i class="bi bi-check-circle"></i> تایید
                        </button>
                        <button v-if="selected.status !== 'rejected'" class="btn btn-danger" @click="reject(selected)">
                            <i class="bi bi-x-circle"></i> رد
                        </button>
                        <button class="btn btn-outline-danger" @click="remove(selected)">
                            <i class="bi bi-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ===== مودال پیش‌نمایش تصویر ===== -->
    <div v-if="showImageModal" class="modal show d-block" style="background: rgba(0,0,0,0.85);"
        @click.self="closeImageModal">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">پیش‌نمایش تصویر</h5>
                    <button type="button" class="btn-close" @click="closeImageModal"></button>
                </div>
                <div class="modal-body text-center">
                    <img :src="previewImageUrl" alt="preview" class="img-fluid" style="max-height: 70vh;" />
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
import { useAdmin } from "@/stores/modules/admin";

const store = useAdmin();
const checkPermission = store.checkPermission;

const router = useRouter();
const route = useRoute();

const currentPage = ref(1);
const photos = ref({ data: [], total: 0, per_page: 15, last_page: 1 });
const loading = ref(false);
const filters = ref({ status: "" });
const currentUrl = "/customer-photos";

// مودال‌ها
const showDetailsModal = ref(false);
const selected = ref(null);
const showImageModal = ref(false);
const previewImageUrl = ref("");

// ===== API =====
async function getPhotos(url = currentUrl) {
    loading.value = true;
    try {
        const response = await axios.get(url, {
            params: {
                status: filters.value.status || undefined,
                per_page: 15,
            },
        });

        photos.value = {
            data: response.data.data || [],
            total: response.data.meta?.total || 0,
            per_page: response.data.meta?.per_page || 15,
            last_page: response.data.meta?.last_page || 1,
            current_page: response.data.meta?.current_page || 1,
        };

        currentPage.value = response.data.meta?.current_page || 1;
    } catch (err) {
        console.error("Error fetching photos:", err);
        Swal.fire("خطا", "مشکلی در بارگذاری داده‌ها پیش آمد", "error");
    } finally {
        loading.value = false;
    }
}

function changePage(selectedPage) {
    if (selectedPage) {
        router.replace({ name: route.name, query: { page: selectedPage } });
        getPhotos(`${currentUrl}?page=${selectedPage}`);
    }
}

function resetFilters() {
    filters.value = { status: "" };
    getPhotos();
}

// ===== مودال جزئیات =====
function openDetails(item) {
    selected.value = item;
    showDetailsModal.value = true;
}

function closeDetails() {
    showDetailsModal.value = false;
    selected.value = null;
}

// ===== تایید =====
function approve(item) {
    Swal.fire({
        title: "تایید درخواست",
        text: `آیا از تایید عکس‌های این درخواست (#${item.id}) مطمئن هستید؟`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "بله، تایید شود",
        cancelButtonText: "انصراف",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await axios.patch(`${currentUrl}/${item.id}/moderate`, {
                    decision: "approved",
                });
                Swal.fire("موفق", "درخواست تایید شد", "success");
                refreshAfterAction(item.id);
            } catch (err) {
                Swal.fire(
                    "خطا",
                    err.response?.data?.message || "مشکلی پیش آمد",
                    "error"
                );
            }
        }
    });
}

// ===== رد =====
function reject(item) {
    Swal.fire({
        title: "رد درخواست",
        text: "لطفاً دلیل رد را وارد کنید:",
        icon: "warning",
        input: "textarea",
        inputPlaceholder: "مثال: تصویر نامرتبط است",
        showCancelButton: true,
        confirmButtonText: "بله، رد شود",
        cancelButtonText: "انصراف",
        preConfirm: (value) => {
            if (!value || value.trim() === "") {
                Swal.showValidationMessage("لطفاً دلیل رد را وارد کنید");
                return false;
            }
            return value.trim();
        },
    }).then(async (result) => {
        if (result.isConfirmed && result.value) {
            try {
                await axios.patch(`${currentUrl}/${item.id}/moderate`, {
                    decision: "rejected",
                    reject_reason: result.value,
                });
                Swal.fire("موفق", "درخواست رد شد", "success");
                refreshAfterAction(item.id);
            } catch (err) {
                Swal.fire(
                    "خطا",
                    err.response?.data?.message || "مشکلی پیش آمد",
                    "error"
                );
            }
        }
    });
}

// ===== حذف =====
function remove(item) {
    Swal.fire({
        title: "حذف درخواست",
        text: `آیا از حذف درخواست #${item.id} و همه تصاویر آن مطمئن هستید؟ این عملیات بازگشت‌ناپذیر است.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "بله، حذف شود",
        cancelButtonText: "انصراف",
        confirmButtonColor: "#d33",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await axios.delete(`${currentUrl}/${item.id}`);
                Swal.fire("موفق", "درخواست حذف شد", "success");
                if (selected.value?.id === item.id) closeDetails();
                getPhotos();
            } catch (err) {
                Swal.fire(
                    "خطا",
                    err.response?.data?.message || "مشکلی در حذف پیش آمد",
                    "error"
                );
            }
        }
    });
}

// ===== بعد از تایید/رد =====
function refreshAfterAction(itemId) {
    // اگه مودال جزئیات بازه، رکورد رو آپدیت کن
    if (selected.value?.id === itemId) {
        // رفرش جزئیات از API
        axios
            .get(`${currentUrl}?per_page=1&id=${itemId}`)
            .catch(() => {});
        // ساده‌تر: مودال رو ببند و لیست رو رفرش کن
        closeDetails();
    }
    getPhotos();
}

// ===== پیش‌نمایش =====
function previewImage(path) {
    previewImageUrl.value = imageUrl(path);
    showImageModal.value = true;
}

function closeImageModal() {
    showImageModal.value = false;
    previewImageUrl.value = "";
}

// ===== هلپرها =====
function imageUrl(path) {
    if (!path) return "";
    return window.baseImageAddress + path;
}

function formatDate(date) {
    if (!date) return "-";
    try {
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    } catch {
        return date;
    }
}

function getStatusLabel(status) {
    const map = {
        pending: "در انتظار بررسی",
        approved: "تأیید شده",
        rejected: "رد شده",
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        pending: "badge bg-warning text-dark",
        approved: "badge bg-success",
        rejected: "badge bg-danger",
    };
    return map[status] || "badge bg-secondary";
}

onMounted(() => {
    currentPage.value = route.query.page ?? 1;
    getPhotos(`${currentUrl}?page=${currentPage.value}`);
});
</script>

<style scoped>
/* ===== هدر ===== */
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

.table-thumb {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid #eee;
    transition: transform 0.15s;
}

.table-thumb:hover {
    transform: scale(1.05);
    border-color: #6c5ce7;
}

.badge {
    font-size: 0.75rem;
    padding: 0.35rem 0.6rem;
}

/* ===== کارت‌های موبایل ===== */
.photo-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.photo-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

.photo-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.photo-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.photo-id-badge {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    flex-shrink: 0;
}

.product-name {
    font-weight: 700;
    color: #2d3436;
    font-size: 0.9rem;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.photo-card-body {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 12px;
}

.mobile-thumb {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
    cursor: pointer;
    border: 2px solid #eee;
}

.photo-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.photo-info-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
}

.photo-info-row i {
    color: #6c5ce7;
    width: 16px;
    text-align: center;
    flex-shrink: 0;
}

.info-label {
    color: #6c757d;
}

.info-value {
    color: #2d3436;
    font-weight: 600;
    margin-right: auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.photo-card-actions {
    display: flex;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
    flex-wrap: wrap;
}

.photo-card-actions + .photo-card-actions {
    padding-top: 6px;
    border-top: none;
}

.photo-card-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.75rem;
    padding: 6px 8px;
    white-space: nowrap;
}

/* ===== مودال جزئیات ===== */
.detail-box {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 0.88rem;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
}

.detail-box i {
    color: #6c5ce7;
    margin-top: 2px;
}

.caption-box {
    background: #eef4ff;
    border-right: 4px solid #3b82f6;
}

.reject-box {
    background: #fff0f0;
    border-right: 4px solid #ef4444;
}

.image-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
}

.gallery-item {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid #eee;
    transition: all 0.2s;
    background: #fafafa;
}

.gallery-item:hover {
    border-color: #6c5ce7;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 92, 231, 0.2);
}

.gallery-item img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    display: block;
}

.img-index {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
}

.img-thumb-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    background: #f59e0b;
    color: #fff;
    font-size: 0.72rem;
    padding: 2px 6px;
    border-radius: 10px;
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

/* ===== Pagination ===== */
.pagination-responsive {
    flex-wrap: wrap;
    justify-content: center;
}

/* ===== ریسپانسیو ===== */
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

    .image-gallery {
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 8px;
    }

    .gallery-item img {
        height: 110px;
    }
}

@media (max-width: 399.98px) {
    .page-title {
        font-size: 1rem;
    }

    .photo-card {
        padding: 12px;
    }

    .photo-info-row {
        font-size: 0.75rem;
    }
}

@media (min-width: 768px) {
    .photo-cards {
        display: none;
    }
}
</style>