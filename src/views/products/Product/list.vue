<template>
  <div class="products-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['product_view'])">

    <!-- هدر و فیلترها -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
          <h3 class="mb-0 page-title">
            <i class="bi bi-box-fill"></i>
            <span>مدیریت محصولات</span>
          </h3>
          <router-link to="/products/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن محصول</span>
          </router-link>
        </div>
      </div>

      <div class="card-body p-2 p-md-3">
        <form @submit.prevent="getProducts()">
          <div class="row g-2">
            <div class="col-12 col-sm-6 col-md-4">
              <input
                v-model="filters.search"
                type="text"
                class="form-control search-input"
                placeholder="جستجو بر اساس نام محصول"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <select v-model="filters.status" class="form-select">
                <option value="">همه وضعیت‌ها</option>
                <option value="published">موجود</option>
                <option value="unpublished">ناموجود</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>
            <div class="col-12 col-md-2">
              <button class="btn btn-primary w-100" type="submit">
                <i class="bi bi-search"></i>
                <span>جستجو</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- لیست -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
          <!-- ===== حالت خالی ===== -->
          <div v-if="!products.data || products.data.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>محصولی یافت نشد</p>
          </div>

          <!-- ===== نمایش جدول در دسکتاپ ===== -->
          <div v-else class="table-responsive d-none d-md-block">
            <table class="table table-bordered table-striped mb-0">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>تصویر</th>
                  <th>عنوان</th>
                  <th>قیمت</th>
                  <th>موجودی</th>
                  <th>تخفیف</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products.data" :key="product.id">
                  <td>{{ product.id }}</td>
                  <td>
                    <div class="imageBox">
                      <img :src="imageResolver(product.main_image)" width="64" alt="">
                      <!-- <span class="counterImages" v-if="product.images">
                        {{ product.images.length }}
                      </span> -->
                    </div>
                  </td>
                  <td class="product-title">{{ product.title }}</td>
                  <td class="product-price">{{ product.price }}</td>
                  <td>{{ product.stock }}</td>
                  <td>
                    <span v-if="product.discount_value" class="discount-badge">
                      {{ product.discount_value }}
                      {{ product.discount_type === 'percent' ? '%' : 'تومان' }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td>
                    <span :class="product.status == 'published' ? 'badge bg-success' : 'badge bg-secondary'">
                      {{ product.status == 'published' ? 'موجود' :
                         product.status == 'unpublished' ? 'ناموجود' :
                         product.published_at ? `انتشار در ${new Date(product.published_at).toLocaleString('fa-IR')}` :
                         'پیش‌نویس' }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <router-link :to="`/products/${product.id}/edit`" class="btn btn-sm btn-warning">
                        <i class="bi bi-pen"></i>
                        <span>ویرایش</span>
                      </router-link>
                      <button class="btn btn-sm btn-danger" @click="deleteProduct(product.id)">
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
          <div v-if="products.data && products.data.length > 0" class="d-md-none product-cards">
            <div
              v-for="product in products.data"
              :key="product.id"
              class="product-card"
            >
              <div class="product-card-header">
                <!-- تصویر محصول -->
                <div class="product-image-wrapper">
                  <img :src="imageResolver(product.main_image)" alt="">
                  <span class="product-images-count" v-if="product.images && product.images.length">
                    <i class="bi bi-images"></i>
                    {{ product.images.length }}
                  </span>
                </div>

                <!-- اطلاعات -->
                <div class="product-info">
                  <div class="product-name">{{ product.title }}</div>
                  <div class="product-id">شناسه: #{{ product.id }}</div>

                  <!-- وضعیت -->
                  <span
                    class="status-badge"
                    :class="product.status == 'published' ? 'status-yes' : 'status-no'"
                  >
                    <i class="bi" :class="product.status == 'published' ? 'bi-check-circle-fill' : 'bi-clock-fill'"></i>
                    {{ product.status == 'published' ? 'موجود' :
                       product.status == 'unpublished' ? 'ناموجود' :
                       product.published_at ? 'زمان‌بندی شده' : 'پیش‌نویس' }}
                  </span>
                </div>
              </div>

              <div class="product-card-body">
                <!-- قیمت -->
                <div class="info-row">
                  <i class="bi bi-tag-fill"></i>
                  <span class="info-label">قیمت:</span>
                  <span class="info-value price-value">{{ product.price }}</span>
                </div>

                <!-- موجودی -->
                <div class="info-row">
                  <i class="bi bi-box-seam"></i>
                  <span class="info-label">موجودی:</span>
                  <span class="info-value">{{ product.stock }}</span>
                </div>

                <!-- تخفیف -->
                <div class="info-row">
                  <i class="bi bi-percent"></i>
                  <span class="info-label">تخفیف:</span>
                  <span v-if="product.discount_value" class="discount-badge-sm">
                    {{ product.discount_value }}
                    {{ product.discount_type === 'percent' ? '%' : 'تومان' }}
                  </span>
                  <span v-else class="info-value muted">—</span>
                </div>

                <!-- تاریخ انتشار (اگه زمان‌بندی شده) -->
                <div v-if="product.published_at && product.status != 'published'" class="info-row">
                  <i class="bi bi-calendar-event"></i>
                  <span class="info-label">انتشار:</span>
                  <span class="info-value">{{ new Date(product.published_at).toLocaleDateString('fa-IR') }}</span>
                </div>
              </div>

              <div class="product-card-actions">
                <router-link :to="`/products/${product.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                  <i class="bi bi-pen"></i>
                  <span>ویرایش</span>
                </router-link>
                <button class="btn btn-sm btn-danger flex-fill" @click="deleteProduct(product.id)">
                  <i class="bi bi-trash3-fill"></i>
                  <span>حذف</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <b-pagination
            v-model="currentPage"
            :total-rows="products.total"
            v-if="products.last_page != 1"
            :per-page="products.per_page"
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
const products = ref({ data: [], meta: null });
const loading = ref(false);
const filters = ref({ search: "", status: "" });
let currentUrl = "/products";

async function getProducts(url = currentUrl) {
  loading.value = true;
  try {
    const { data } = await axios.get(url, { params: filters.value });
    products.value = data;
    currentPage.value = data.current_page;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function changePage(selectedPage) {
  if (selectedPage) {
    router.replace({ name: route.name, query: { page: selectedPage } });
    getProducts(`${currentUrl}?page=${selectedPage}`);
  }
}

const deleteProduct = (id) => {
  Swal.fire({
    title: "حذف محصول",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/products/${id}`);
        Swal.fire("موفق", "محصول حذف شد", "success");
        getProducts(`${currentUrl}?page=${currentPage.value}`);
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

function imageResolver(path) {
  return window.baseImageAddress + path;
}

onMounted(() => {
  currentPage.value = route.query.page ?? 1;
  getProducts(`${currentUrl}?page=${currentPage.value}`);
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

.form-select {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
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

.product-title {
  font-weight: 600;
  max-width: 200px;
  word-break: break-word;
}

.product-price {
  font-weight: 600;
  color: #16a34a;
}

/* ===== تصویر محصول (دسکتاپ) ===== */
.imageBox {
  position: relative;
  width: 70px;
  min-height: 50px;
}

.imageBox img {
  border-radius: 8px;
  object-fit: cover;
}

.counterImages {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
  font-size: 10px;
  font-weight: 700;
  transform: translate(-50%, -50%);
  background: rgba(59, 130, 246, 0.95);
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

/* ===== بج تخفیف ===== */
.discount-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ===== کارت‌های موبایل ===== */
.product-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.product-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.product-card-header {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

/* تصویر بزرگ‌تر در موبایل */
.product-image-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  flex-shrink: 0;
}

.product-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #f0f0f0;
}

.product-images-count {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(59, 130, 246, 0.95);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
}

.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 0.95rem;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-id {
  font-size: 0.72rem;
  color: #6c757d;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  align-self: flex-start;
  margin-top: auto;
}

.status-yes {
  background: #dcfce7;
  color: #16a34a;
}

.status-no {
  background: #fef3c7;
  color: #b45309;
}

/* بدنه کارت */
.product-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
}

.info-row > i {
  color: #6c5ce7;
  font-size: 0.9rem;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.info-label {
  color: #6c757d;
  flex-shrink: 0;
  font-weight: 500;
}

.info-value {
  color: #2d3436;
  font-weight: 600;
  margin-right: auto;
}

.info-value.muted {
  color: #adb5bd;
}

.price-value {
  color: #16a34a;
  font-weight: 700;
}

.discount-badge-sm {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  margin-right: auto;
}

/* دکمه‌ها */
.product-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.product-card-actions .btn {
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
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
  .page-title {
    font-size: 1rem;
  }

  .product-card {
    padding: 12px;
  }

  .product-image-wrapper {
    width: 76px;
    height: 76px;
  }

  .product-name {
    font-size: 0.88rem;
  }

  .info-row {
    font-size: 0.75rem;
  }

  .info-row > i {
    font-size: 0.82rem;
    width: 14px;
  }

  .product-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .product-cards {
    display: none;
  }
}
</style>