<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 coupons-page" v-if="checkPermission(['coupon_view'])">

    <!-- فیلتر -->
    <div class="card mb-2 header-card">
      <div class="card-body p-2 p-md-3">
        <form @submit.prevent="getCoupons">
          <div class="row g-2">
            <div class="col-12 col-sm-8 col-md-4">
              <input
                v-model="filters.code"
                type="text"
                class="form-control search-input"
                placeholder="جستجو بر اساس کد کوپن"
              />
            </div>
            <div class="col-12 col-sm-4 col-md-2">
              <button class="btn btn-primary w-100 search-btn" type="submit">
                <i class="bi bi-search"></i>
                <span>جستجو</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- دکمه افزودن -->
    <div class="mb-2 add-wrapper">
      <router-link to="/shop/coupons/create" class="btn btn-success add-btn">
        <i class="bi bi-plus"></i>
        <span>افزودن کوپن</span>
      </router-link>
    </div>

    <!-- جدول -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!coupons.data || coupons.data.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>کوپنی یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered table-striped mb-0">
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>کد</th>
                    <th>نوع</th>
                    <th>مقدار</th>
                    <th>تاریخ شروع</th>
                    <th>تاریخ پایان</th>
                    <th class="text-center">وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="coupon in coupons.data" :key="coupon.id">
                    <td class="coupon-id">{{ coupon.id }}</td>
                    <td>
                      <span class="coupon-code">
                        <i class="bi bi-ticket-perforated"></i>
                        {{ coupon.code }}
                      </span>
                    </td>
                    <td>
                      <span class="type-badge" :class="coupon.type === 'percent' ? 'type-percent' : 'type-fixed'">
                        {{ coupon.type === 'percent' ? 'درصدی' : 'ثابت' }}
                      </span>
                    </td>
                    <td class="coupon-value">{{ coupon.value }}</td>
                    <td class="date-cell">{{ formatDate(coupon.start_date) }}</td>
                    <td class="date-cell">{{ formatDate(coupon.end_date) }}</td>
                    <td class="text-center">
                      <span
                        class="status-badge"
                        :class="coupon.status ? 'status-active' : 'status-inactive'"
                      >
                        <i class="bi" :class="coupon.status ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                        {{ coupon.status ? 'فعال' : 'غیرفعال' }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        <router-link :to="`/shop/coupons/${coupon.id}/edit`" class="btn btn-sm btn-warning">
                          <i class="bi bi-pen"></i>
                          <span>ویرایش</span>
                        </router-link>
                        <button class="btn btn-sm btn-danger" @click="deleteCoupon(coupon.id)">
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
            <div class="d-md-none coupon-cards">
              <div
                v-for="coupon in coupons.data"
                :key="coupon.id"
                class="coupon-card"
                :class="{ 'inactive-card': !coupon.status }"
              >
                <div class="coupon-card-header">
                  <div class="coupon-icon">
                    <i class="bi bi-ticket-perforated-fill"></i>
                  </div>
                  <div class="coupon-info">
                    <div class="coupon-name">{{ coupon.code }}</div>
                    <div class="coupon-id">شناسه: #{{ coupon.id }}</div>
                  </div>
                  <span
                    class="status-badge-sm"
                    :class="coupon.status ? 'status-active' : 'status-inactive'"
                  >
                    <i class="bi" :class="coupon.status ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ coupon.status ? 'فعال' : 'غیرفعال' }}
                  </span>
                </div>

                <div class="coupon-card-body">
                  <div class="info-row">
                    <i class="bi bi-percent"></i>
                    <span class="info-label">نوع:</span>
                    <span class="type-badge" :class="coupon.type === 'percent' ? 'type-percent' : 'type-fixed'">
                      {{ coupon.type === 'percent' ? 'درصدی' : 'ثابت' }}
                    </span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-cash-coin"></i>
                    <span class="info-label">مقدار:</span>
                    <span class="info-value">{{ coupon.value }}</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-calendar-check"></i>
                    <span class="info-label">شروع:</span>
                    <span class="info-value date-value">{{ formatDate(coupon.start_date) }}</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-calendar-x"></i>
                    <span class="info-label">پایان:</span>
                    <span class="info-value date-value">{{ formatDate(coupon.end_date) }}</span>
                  </div>
                </div>

                <div class="coupon-card-actions">
                  <router-link :to="`/shop/coupons/${coupon.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                    <i class="bi bi-pen"></i>
                    <span>ویرایش</span>
                  </router-link>
                  <button class="btn btn-sm btn-danger flex-fill" @click="deleteCoupon(coupon.id)">
                    <i class="bi bi-trash3-fill"></i>
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- صفحه بندی -->
          <b-pagination
            v-model="currentPage"
            :total-rows="coupons.total"
            v-if="coupons.last_page != 1"
            :per-page="coupons.per_page"
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
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const coupons = ref({ data: [], meta: null });
const loading = ref(false);
const filters = ref({ code: "" });
let currentUrl = "/coupons";

const getCoupons = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url, { params: filters.value });
    coupons.value = data.data;
    currentUrl = url;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page) getCoupons(`${currentUrl}?page=${page}`);
  else currentUrl = "/copons"
};

const deleteCoupon = (id) => {
  Swal.fire({
    title: "حذف کوپن",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/coupons/${id}`);
        Swal.fire("موفق", "کوپن حذف شد", "success");
        getCoupons();
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("fa-IR");
};

onMounted(() => {
  getCoupons();
});
</script>

<style scoped>
/* ===== فیلتر ===== */
.header-card .card-body {
  padding: 14px 18px;
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

.search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
}

/* ===== دکمه افزودن ===== */
.add-wrapper {
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  font-size: 0.9rem;
}

.table tbody td {
  vertical-align: middle;
  font-size: 0.9rem;
}

.coupon-id {
  font-weight: 700;
  color: #6c757d;
}

/* کد کوپن */
.coupon-code {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 4px 12px;
  border-radius: 8px;
  letter-spacing: 0.5px;
  border: 1px dashed #f59e0b;
}

.coupon-value {
  font-weight: 700;
  color: #16a34a;
}

.date-cell {
  font-size: 0.82rem;
  color: #6c757d;
  white-space: nowrap;
}

/* بج نوع */
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.type-percent {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
}

.type-fixed {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  color: #be185d;
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
.coupon-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.coupon-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* کارت غیرفعال */
.coupon-card.inactive-card {
  background: #fefefe;
  border-right: 4px solid #ef4444;
}

.coupon-card.inactive-card .coupon-icon {
  background: linear-gradient(135deg, #94a3b8, #cbd5e1);
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.25);
}

.coupon-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.coupon-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  transition: all 0.3s ease;
}

.coupon-info {
  flex: 1;
  min-width: 0;
}

.coupon-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.coupon-id {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 2px;
}

.coupon-card-body {
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
  color: #f59e0b;
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
  color: #16a34a;
  font-weight: 700;
  margin-right: auto;
  background: #f0fdf4;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
}

.date-value {
  color: #4f46e5;
  background: #eef2ff;
}

/* دکمه‌ها */
.coupon-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.coupon-card-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.8rem;
  padding: 8px 10px;
  font-weight: 600;
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
  .add-wrapper {
    justify-content: stretch;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 16px;
  }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
  .coupon-card {
    padding: 12px;
  }

  .coupon-icon {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }

  .coupon-name {
    font-size: 0.9rem;
  }

  .info-row {
    font-size: 0.78rem;
  }

  .coupon-card-actions .btn {
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
  .coupon-cards {
    display: none;
  }
}
</style>