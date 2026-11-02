<template>
  <div class="low-stock-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['product_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-exclamation-triangle-fill text-warning"></i>
            <span>هشدار موجودی</span>
          </h3>
          <router-link to="/products" class="btn btn-secondary add-btn">
            <i class="bi bi-arrow-right"></i>
            <span>بازگشت به محصولات</span>
          </router-link>
        </div>
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
            <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
            <p>هیچ محصولی زیر آستانه‌ی موجودی نیست</p>
          </div>

          <!-- ===== جدول دسکتاپ ===== -->
          <div v-else class="table-responsive d-none d-md-block">
            <table class="table table-bordered table-striped mb-0">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>تصویر</th>
                  <th>عنوان</th>
                  <th>آستانه</th>
                  <th>واریانت‌های بحرانی</th>
                  <th>حداقل موجودی</th>
                  <th>وضعیت پیامک</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products.data" :key="product.id">
                  <td>{{ product.id }}</td>
                  <td>
                    <div class="imageBox">
                      <img :src="imageResolver(product.main_image)" width="64" alt="">
                    </div>
                  </td>
                  <td class="product-title">
                    {{ product.title }}
                    <div class="small text-muted" v-if="product.categories && product.categories.length">
                      {{ product.categories.map(c => c.title).join('، ') }}
                    </div>
                  </td>
                  <td>
                    <span class="threshold-badge">{{ product.low_stock_threshold }}</span>
                  </td>
                  <td>
                    <div class="variant-list">
                      <span
                        v-for="v in product.critical_variants"
                        :key="v.id"
                        class="variant-chip"
                        :class="{ 'variant-chip-critical': v.stock === 0 }"
                      >
                        {{ v.label }} = {{ v.stock }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="min-stock" :class="{ 'min-stock-zero': product.min_stock === 0 }">
                      {{ product.min_stock }}
                    </span>
                  </td>
                  <td>
                    <span
                      v-for="v in product.critical_variants"
                      :key="'n-' + v.id"
                      class="notify-badge"
                      :class="v.needs_notification ? 'notify-pending' : 'notify-done'"
                      :title="v.needs_notification ? 'هنوز پیامک نرفته' : 'پیامک رفته'"
                    >
                      <i class="bi" :class="v.needs_notification ? 'bi-bell-fill' : 'bi-bell-slash-fill'"></i>
                      {{ v.needs_notification ? 'در انتظار' : 'ارسال شده' }}
                    </span>
                  </td>
                  <td>
                    <router-link :to="`/products/${product.id}/edit`" class="btn btn-sm btn-warning">
                      <i class="bi bi-pen"></i>
                      <span>ویرایش</span>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ===== کارت موبایل ===== -->
          <div v-if="products.data && products.data.length > 0" class="d-md-none low-stock-cards">
            <div v-for="product in products.data" :key="product.id" class="low-stock-card">
              <div class="low-stock-card-header">
                <div class="product-image-wrapper">
                  <img :src="imageResolver(product.main_image)" alt="">
                </div>
                <div class="product-info">
                  <div class="product-name">{{ product.title }}</div>
                  <div class="product-id">شناسه: #{{ product.id }}</div>
                  <span class="threshold-badge-sm">
                    آستانه: {{ product.low_stock_threshold }}
                  </span>
                </div>
              </div>

              <div class="low-stock-card-body">
                <div class="critical-title">
                  <i class="bi bi-exclamation-circle-fill text-danger"></i>
                  واریانت‌های زیر آستانه
                </div>
                <div class="variant-list">
                  <span
                    v-for="v in product.critical_variants"
                    :key="v.id"
                    class="variant-chip"
                    :class="{ 'variant-chip-critical': v.stock === 0 }"
                  >
                    <span class="variant-label">{{ v.label }}</span>
                    <span class="variant-stock">{{ v.stock }}</span>
                    <i
                      class="bi"
                      :class="v.needs_notification ? 'bi-bell-fill text-warning' : 'bi-bell-slash-fill text-muted'"
                      :title="v.needs_notification ? 'هنوز پیامک نرفته' : 'پیامک رفته'"
                    ></i>
                  </span>
                </div>
                <div class="min-stock-row">
                  <span class="info-label">حداقل موجودی:</span>
                  <span class="min-stock" :class="{ 'min-stock-zero': product.min_stock === 0 }">
                    {{ product.min_stock }}
                  </span>
                </div>
              </div>

              <div class="low-stock-card-actions">
                <router-link :to="`/products/${product.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                  <i class="bi bi-pen"></i>
                  <span>ویرایش محصول</span>
                </router-link>
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
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;
const currentPage = ref(1);
const router = useRouter();
const route = useRoute();
const products = ref({ data: [] });
const loading = ref(false);

const currentUrl = "/products-low-stock";

async function getLowStockProducts(url = currentUrl) {
  loading.value = true;
  try {
    const { data } = await axios.get(url);
    products.value = data.data;
    currentPage.value = data.data.current_page;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function changePage(selectedPage) {
  if (selectedPage) {
    router.replace({ name: route.name, query: { page: selectedPage } });
    getLowStockProducts(`${currentUrl}?page=${selectedPage}`);
  }
}

function imageResolver(path) {
  if (!path) return '';
  return window.baseImageAddress + path;
}

onMounted(() => {
  currentPage.value = route.query.page ?? 1;
  getLowStockProducts(`${currentUrl}?page=${currentPage.value}`);
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
  max-width: 220px;
  word-break: break-word;
}

.imageBox {
  position: relative;
  width: 70px;
  min-height: 50px;
}

.imageBox img {
  border-radius: 8px;
  object-fit: cover;
}

/* ===== بج آستانه ===== */
.threshold-badge {
  display: inline-block;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ===== لیست واریانت‌ها ===== */
.variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.variant-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.variant-chip-critical {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.variant-label {
  font-weight: 700;
}

.variant-stock {
  font-weight: 800;
}

/* ===== حداقل موجودی ===== */
.min-stock {
  display: inline-block;
  font-weight: 800;
  color: #c2410c;
  font-size: 1rem;
}

.min-stock-zero {
  color: #b91c1c;
}

/* ===== بج وضعیت پیامک ===== */
.notify-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  margin-left: 4px;
  margin-bottom: 4px;
}

.notify-pending {
  background: #fef3c7;
  color: #b45309;
}

.notify-done {
  background: #dcfce7;
  color: #16a34a;
}

/* ===== کارت‌های موبایل ===== */
.low-stock-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.low-stock-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.low-stock-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.low-stock-card-header {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

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

.threshold-badge-sm {
  display: inline-block;
  align-self: flex-start;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  margin-top: auto;
}

.low-stock-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.critical-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #b91c1c;
}

.min-stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
}

.info-label {
  color: #6c757d;
  font-weight: 500;
}

.low-stock-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.low-stock-card-actions .btn {
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

@media (max-width: 399.98px) {
  .page-title {
    font-size: 1rem;
  }

  .low-stock-card {
    padding: 12px;
  }

  .product-image-wrapper {
    width: 76px;
    height: 76px;
  }

  .product-name {
    font-size: 0.88rem;
  }

  .variant-chip {
    font-size: 0.7rem;
    padding: 2px 8px;
  }

  .low-stock-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}

@media (min-width: 768px) {
  .low-stock-cards {
    display: none;
  }
}
</style>