<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 banners-page" v-if="checkPermission(['banner_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-images"></i>
            <span>مدیریت بنرها</span>
          </h3>
          <router-link to="/content/banners/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن بنر</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- لیست -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">در حال بارگذاری...</span>
          </div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!banners || banners.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>بنری یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered table-striped mb-0">
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>عنوان</th>
                    <th>موقعیت</th>
                    <th class="text-center">وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="banner in banners" :key="banner.id">
                    <td class="banner-id">{{ banner.id }}</td>
                    <td class="banner-title">{{ banner.title }}</td>
                    <td>
                      <span class="position-badge">
                        <i class="bi bi-geo-alt-fill"></i>
                        {{ postitionTitle(banner.position) }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span
                        class="status-badge"
                        :class="banner.status ? 'status-active' : 'status-inactive'"
                      >
                        <i class="bi" :class="banner.status ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                        {{ banner.status ? 'فعال' : 'غیرفعال' }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        <router-link :to="`/content/banners/${banner.id}/edit`" class="btn btn-sm btn-warning">
                          <i class="bi bi-pen"></i>
                          <span>ویرایش</span>
                        </router-link>
                        <button class="btn btn-sm btn-danger" @click="deleteBanner(banner.id)">
                          <i class="bi bi-trash3-fill"></i>
                          <span>حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ===== کارت موبایل ===== -->
            <div class="d-md-none banner-cards">
              <div
                v-for="banner in banners"
                :key="banner.id"
                class="banner-card"
                :class="{ 'inactive-card': !banner.status }"
              >
                <div class="banner-card-header">
                  <div class="banner-icon">
                    <i class="bi bi-image-fill"></i>
                  </div>
                  <div class="banner-info">
                    <div class="banner-name">{{ banner.title }}</div>
                    <div class="banner-id">شناسه: #{{ banner.id }}</div>
                  </div>
                  <!-- بج وضعیت گوشه -->
                  <span
                    class="status-badge-sm"
                    :class="banner.status ? 'status-active' : 'status-inactive'"
                  >
                    <i class="bi" :class="banner.status ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ banner.status ? 'فعال' : 'غیرفعال' }}
                  </span>
                </div>

                <div class="banner-card-body">
                  <div class="info-row">
                    <i class="bi bi-geo-alt-fill"></i>
                    <span class="info-label">موقعیت:</span>
                    <span class="info-value">{{ postitionTitle(banner.position) }}</span>
                  </div>
                </div>

                <div class="banner-card-actions">
                  <router-link :to="`/content/banners/${banner.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                    <i class="bi bi-pen"></i>
                    <span>ویرایش</span>
                  </router-link>
                  <button class="btn btn-sm btn-danger flex-fill" @click="deleteBanner(banner.id)">
                    <i class="bi bi-trash3-fill"></i>
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const banners = ref([]);
const loading = ref(false);
const filters = ref({ title: "" });
let currentUrl = "/banners";
let positions = [
  { id: 'after_discount', label: "بعد از تخفیف ها" },
  { id: 'after_new_product', label: "بعد از جدیدترین ها" },
  { id: 'before_blog', label: "قبل از بلاگ" },
];
function postitionTitle(pos) {
  let position = positions.find((p) => p.id == pos)
  return position ? position.label : "-"
}
const getBanners = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url, { params: filters.value });
    banners.value = data.data;
    currentUrl = url;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const deleteBanner = (id) => {
  Swal.fire({
    title: "حذف بنر",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/banners/${id}`);
        Swal.fire("موفق", "بنر حذف شد", "success");
        getBanners();
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

onMounted(() => {
  getBanners();
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

.add-btn {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
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

.banner-id {
  font-weight: 700;
  color: #6c757d;
}

.banner-title {
  font-weight: 600;
}

/* بج موقعیت */
.position-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

/* بج وضعیت */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}

.status-active {
  background: #dcfce7;
  color: #16a34a;
}

.status-inactive {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge-sm {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  flex-shrink: 0;
}

.status-badge-sm.status-active {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge-sm.status-inactive {
  background: #fee2e2;
  color: #dc2626;
}

/* ===== کارت‌های موبایل ===== */
.banner-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.banner-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.banner-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* کارت غیرفعال */
.banner-card.inactive-card {
  background: #fefefe;
  border-color: #fecaca;
  border-right: 4px solid #ef4444;
}

.banner-card.inactive-card .banner-icon {
  background: linear-gradient(135deg, #94a3b8, #cbd5e1);
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.25);
}

.banner-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.banner-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  transition: all 0.3s ease;
}

.banner-info {
  flex: 1;
  min-width: 0;
}

.banner-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-id {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 2px;
}

.banner-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.info-row > i {
  color: #6c5ce7;
  font-size: 0.95rem;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.info-label {
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  color: #4f46e5;
  font-weight: 700;
  margin-right: auto;
  background: #eef2ff;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
}

/* دکمه‌ها */
.banner-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.banner-card-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.8rem;
  padding: 8px 10px;
  font-weight: 600;
}

/* ========================================= */
/* ===== موبایل (کمتر از 768px) ===== */
/* ========================================= */
@media (max-width: 767.98px) {
  .header-card .card-header {
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
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
  .page-title {
    font-size: 1rem;
  }

  .banner-card {
    padding: 12px;
  }

  .banner-icon {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }

  .banner-name {
    font-size: 0.9rem;
  }

  .info-row {
    font-size: 0.78rem;
  }

  .banner-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }

  .status-badge-sm {
    font-size: 0.62rem;
    padding: 2px 6px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .banner-cards {
    display: none;
  }
}
</style>