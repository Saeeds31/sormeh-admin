<template>
  <div class="container py-4" v-if="checkPermission(['report_products'])">
    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>
          <i class="bi bi-palette"></i>
          <span>گزارش فروش تنوع‌ها</span>
        </h3>
        <b-spinner small v-if="loading"></b-spinner>
      </div>
      <div class="card-body">
        <form @submit.prevent="getReport()" class="row g-3">
          <div class="col-md-2">
            <date-picker display-format="jYYYY/jMM/jDD" placeholder="از تاریخ" format="YYYY-MM-DD"
              v-model="filters.date_from"></date-picker>
          </div>
          <div class="col-md-2">
            <date-picker display-format="jYYYY/jMM/jDD" placeholder="تا تاریخ" format="YYYY-MM-DD"
              v-model="filters.date_to"></date-picker>
          </div>
          <div class="col-md-4">
            <select v-model="filters.category_id" class="form-select">
              <option value="">همه دسته‌بندی‌ها</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.title }}
              </option>
            </select>
          </div>
          <div class="col-md-4">
            <multiselect @search-change="searchProducts" v-model="selectedProduct" placeholder="جستجوی محصول..."
              open-direction="bottom" :options="productOptions" label="title" track-by="id" :searchable="true"
              :multiple="false" :close-on-select="true" :show-labels="false">
              <template slot="noOptions">
                جستجو کنید
              </template>
              <template slot="noResult">
                <span v-if="loadingProducts" v-text="'در حال جستجو...'" />
                <span v-else v-text="'موردی یافت نشد'"></span>
              </template>
              <template slot="option" slot-scope="props">
                <div>
                  <strong>{{ props.option.title }}</strong>
                  <div class="small text-muted">{{ props.option.sku }}</div>
                </div>
              </template>
            </multiselect>
          </div>

          <div class="col-12">
            <button type="submit" class="btn btn-primary w-100">
              <i class="bi bi-search"></i>
              <span class="mx-2">اعمال فیلتر</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row mb-4" v-if="summary">
      <div class="col-md-6">
        <div class="card text-white bg-primary">
          <div class="card-body text-center">
            <h5 class="card-title">کل تنوع‌ها</h5>
            <h2>{{ formatNumber(summary.total_variants) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card text-white bg-success">
          <div class="card-body text-center">
            <h5 class="card-title">کل موجودی</h5>
            <h2>{{ formatNumber(summary.total_stock) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card text-white bg-warning">
          <div class="card-body text-center">
            <h5 class="card-title">کل فروش</h5>
            <h2>{{ formatCurrency(summary.total_revenue) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card text-white bg-info">
          <div class="card-body text-center">
            <h5 class="card-title">تعداد فروخته شده</h5>
            <h2>{{ formatNumber(summary.total_items_sold) }}</h2>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">در حال بارگذاری...</p>
    </div>

    <div v-else>
      <!-- Tabs -->
      <b-tabs>
        <b-tab title="لیست تنوع‌ها" active>
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped text-center align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>شناسه</th>
                      <th>محصول</th>
                      <th>ویژگی‌ها</th>
                      <th>قیمت</th>
                      <th>موجودی</th>
                      <th>تعداد فروش</th>
                      <th>درآمد</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in reportData" :key="item.variant.id">
                      <td>{{ item.variant.id }}</td>
                      <td>
                        <strong>{{ item.variant.product.title }}</strong>
                        <div class="small text-muted">{{ item.variant.sku }}</div>
                      </td>
                      <td>
                        <span v-for="attr in item.variant.attributes" :key="attr.value_id"
                          class="badge bg-secondary me-1">
                          {{ attr.attribute_name }}: {{ attr.value }}
                        </span>
                      </td>
                      <td>{{ formatCurrency(item.variant.price) }}</td>
                      <td>
                        <span :class="item.variant.stock > 0 ? 'text-success' : 'text-danger'">
                          {{ formatNumber(item.variant.stock) }}
                        </span>
                      </td>
                      <td>
                        <span :class="item.sales_summary.total_quantity_sold > 0 ? 'text-success' : 'text-muted'">
                          {{ formatNumber(item.sales_summary.total_quantity_sold) }}
                        </span>
                      </td>
                      <td>{{ formatCurrency(item.sales_summary.total_revenue) }}</td>
                      <td>
                        <button @click="showVariantDetail(item)" class="btn btn-sm btn-info">
                          <i class="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!reportData.length">
                      <td colspan="8" class="text-center text-muted py-4">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <p class="mt-2">هیچ تنوعی با این فیلترها یافت نشد</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </b-tab>

        <b-tab title="تحلیل بر اساس ویژگی">
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>ویژگی</th>
                      <th>مقدار</th>
                      <th>تعداد تنوع</th>
                      <th>تعداد فروش</th>
                      <th>درآمد</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in attributeAnalysis" :key="item.attribute_name + item.attribute_value">
                      <td>{{ item.attribute_name }}</td>
                      <td>{{ item.attribute_value }}</td>
                      <td>{{ formatNumber(item.variant_count) }}</td>
                      <td>{{ formatNumber(item.total_quantity) }}</td>
                      <td>{{ formatCurrency(item.total_revenue) }}</td>
                    </tr>
                    <tr v-if="!attributeAnalysis.length">
                      <td colspan="5" class="text-center text-muted">داده‌ای برای نمایش وجود ندارد</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </b-tab>

        <b-tab title="نمودار فروش">
          <div class="card">
            <div class="card-body">
              <div v-if="chartData">
                <BarChart :chart-data="chartData" />
              </div>
              <div v-else class="text-center text-muted py-5">
                <i class="bi bi-bar-chart" style="font-size: 3rem;"></i>
                <p>داده‌ای برای نمایش وجود ندارد</p>
              </div>
            </div>
          </div>
        </b-tab>


      </b-tabs>
    </div>

    <!-- Variant Detail Modal -->
    <Modal v-if="showModal" id="variantDetailModal" @closeModal="() => { showModal = false; selectedVariant = null; }"
      :title="selectedVariant?.variant?.product?.title + ' - ' + selectedVariant?.variant?.attributes_string">
      <div v-if="selectedVariant">
        <!-- خلاصه فروش -->
        <h5 class="mb-3">خلاصه فروش</h5>
        <div class="row mb-4 g-3">
          <div class="col-md-6">
            <div class="card bg-danger text-white">
              <div class="card-body text-center">
                <h6>تعداد فروش</h6>
                <h2 class="mb-0">{{ formatNumber(selectedVariant.sales_summary.total_quantity_sold) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-primary text-white">
              <div class="card-body text-center">
                <h6>درآمد کل</h6>
                <h2 class="mb-0">{{ formatCurrency(selectedVariant.sales_summary.total_revenue) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-info text-white">
              <div class="card-body text-center">
                <h6>تعداد سفارش</h6>
                <h2 class="mb-0">{{ formatNumber(selectedVariant.sales_summary.total_orders) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-warning text-white">
              <div class="card-body text-center">
                <h6>موجودی فعلی</h6>
                <h2 class="mb-0">{{ formatNumber(selectedVariant.variant.stock) }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- اطلاعات تنوع -->
        <h5 class="mb-3">اطلاعات تنوع</h5>
        <div class="row mb-4">
          <div class="col-md-6">
            <p><strong>شناسه:</strong> {{ selectedVariant.variant.id }}</p>
            <p><strong>SKU:</strong> {{ selectedVariant.variant.sku }}</p>
            <p><strong>قیمت:</strong> {{ formatCurrency(selectedVariant.variant.price) }}</p>
          </div>
          <div class="col-md-6">
            <p><strong>محصول:</strong> {{ selectedVariant.variant.product.title }}</p>
            <p><strong>موجودی:</strong> {{ formatNumber(selectedVariant.variant.stock) }}</p>
            <p><strong>ویژگی‌ها:</strong></p>
            <span v-for="attr in selectedVariant.variant.attributes" :key="attr.value_id"
              class="badge bg-secondary me-1">
              {{ attr.attribute_name }}: {{ attr.value }}
            </span>
          </div>
        </div>

        <!-- آخرین فروش‌ها -->
        <h5 class="mb-3">آخرین فروش‌ها</h5>
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>مشتری</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>مجموع</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in selectedVariant.recent_sales" :key="sale.order_id">
                <td>{{ formatDate(sale.sold_at) }}</td>
                <td>{{ sale.customer_name }}</td>
                <td>{{ formatNumber(sale.quantity) }}</td>
                <td>{{ formatCurrency(sale.price_per_unit) }}</td>
                <td>{{ formatCurrency(sale.total_price) }}</td>
              </tr>
              <tr v-if="!selectedVariant.recent_sales.length">
                <td colspan="5" class="text-center text-muted">هیچ فروشی برای این تنوع وجود ندارد</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, computed, onMounted } from 'vue';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Bar } from 'vue-chartjs';
import { useAdmin } from '@/stores/modules/admin';
import Modal from "@/components/shared/modal.vue";
import Multiselect from 'vue-multiselect';

const store = useAdmin();
const checkPermission = store.checkPermission;
let selectedProduct = ref(null)
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Utility functions
function formatCurrency(value) {
  if (!value && value !== 0) return "۰";
  return new Intl.NumberFormat("fa-IR").format(Math.round(value)) + " تومان";
}

function formatNumber(value) {
  if (!value && value !== 0) return "۰";
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fa-IR");
}

function getProgressColor(percentage) {
  if (percentage > 50) return 'bg-success';
  if (percentage > 25) return 'bg-warning';
  return 'bg-danger';
}

// Chart component
const BarChart = {
  props: ['chartData'],
  components: { Bar },
  template: `
    <Bar 
      :data="chartData" 
      :options="{
        responsive: true,
        plugins: { 
          legend: { 
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }" 
    />
  `,
};

// Data
const filters = ref({
  date_from: '',
  date_to: '',
  category_id: '',
  product_id: null,
  attribute_id: null,
});

const loading = ref(false);
const loadingProducts = ref(false);
const reportData = ref([]);
const summary = ref(null);
const attributeAnalysis = ref([]);
const showModal = ref(false);
const selectedVariant = ref(null);
const categories = ref([]);
const productOptions = ref([]);
const attributes = ref([]);

// Comparison data
const comparisonProductId = ref(null);
const comparisonData = ref(null);

// Abort controllers
let abortController = null;

// Computed
const chartData = computed(() => {
  if (!reportData.value.length) return null;

  const allDates = {};
  reportData.value.forEach(item => {
    if (item.chart_data && item.chart_data.length) {
      item.chart_data.forEach(day => {
        if (!allDates[day.date]) {
          allDates[day.date] = { date: day.date, revenue: 0, quantity: 0 };
        }
        allDates[day.date].revenue += Number(day.daily_revenue) || 0;
        allDates[day.date].quantity += Number(day.daily_quantity) || 0;
      });
    }
  });

  const sortedDates = Object.values(allDates).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  if (!sortedDates.length) return null;

  return {
    labels: sortedDates.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'درآمد روزانه',
        data: sortedDates.map(d => Math.round(d.revenue)),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'تعداد فروش روزانه',
        data: sortedDates.map(d => d.quantity),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };
});

// Methods
const getReport = async () => {
  loading.value = true;
  try {
    const params = { ...filters.value };
    // حذف مقادیر null/undefined
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });
    if (selectedProduct.value) {
      params.product_id = selectedProduct.value.id
    }
    const { data } = await axios.get('/reports/variants/sales', {
      params: params,
    });
    reportData.value = data.data || [];
    summary.value = data.summary || null;
    attributeAnalysis.value = data.attribute_analysis || [];
  } catch (error) {
    console.error('Error fetching report:', error);
    if (error.response?.data?.message) {
      alert(error.response.data.message);
    }
  } finally {
    loading.value = false;
  }
};

const showVariantDetail = (item) => {
  selectedVariant.value = item;
  showModal.value = true;
};

const loadCategories = async () => {
  try {
    const { data } = await axios.get('/categories');
    categories.value = data.data || [];
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};

const searchProducts = async (search) => {
  // اگر جستجو کمتر از 2 کاراکتر باشد، چیزی انجام نده
  if (search && search.length < 2) return;

  // لغو درخواست قبلی
  if (abortController) {
    abortController.abort();
  }

  abortController = new AbortController();
  loadingProducts.value = true;

  try {
    const { data } = await axios.get('/products', {
      params: {
        search: search || '',
        per_page: 20,
        status: 'published'
      },
      signal: abortController.signal,
    });
    productOptions.value = data.data || [];
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error searching products:', error);
    }
  } finally {
    loadingProducts.value = false;
  }
};

const loadAttributes = async () => {
  try {
    const { data } = await axios.get('/attributes');
    attributes.value = data || [];
  } catch (error) {
    console.error('Error loading attributes:', error);
  }
};

const getComparison = async () => {
  if (!comparisonProductId.value) {
    alert('لطفاً یک محصول انتخاب کنید');
    return;
  }

  try {
    const params = {
      product_id: comparisonProductId.value,
    };
    if (filters.value.date_from) params.date_from = filters.value.date_from;
    if (filters.value.date_to) params.date_to = filters.value.date_to;

    const { data } = await axios.get('/reports/variants/product-comparison', {
      params: params,
    });
    comparisonData.value = data;
  } catch (error) {
    console.error('Error fetching comparison:', error);
    alert(error.response?.data?.message || 'خطا در دریافت اطلاعات');
  }
};

// Initialize
onMounted(() => {
  getReport();
  loadCategories();
  // بارگذاری اولیه محصولات (همه محصولات)
  searchProducts('');
  loadAttributes();
});
</script>

<style scoped>
.card {
  margin-bottom: 1rem;
}

.container h3 {
  padding: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.table td {
  vertical-align: middle;
}

.badge {
  font-size: 0.75rem;
}

/* استایل‌های vue-multiselect برای RTL */
.multiselect-rtl {
  direction: rtl;
}

.multiselect-rtl .multiselect__tags {
  direction: rtl;
  text-align: right;
}

.multiselect-rtl .multiselect__input {
  direction: rtl;
}

.multiselect-rtl .multiselect__option {
  text-align: right;
}

.multiselect-rtl .multiselect__placeholder {
  text-align: right;
}

.progress {
  height: 8px;
}

/* استایل برای تب‌ها */
::v-deep .nav-tabs .nav-link {
  color: #495057;
}

::v-deep .nav-tabs .nav-link.active {
  color: #0d6efd;
  font-weight: bold;
}
</style>

<!-- اضافه کردن استایل‌های vue-multiselect به صورت global -->
<style>
.multiselect-rtl .multiselect__option--highlight {
  background: #0d6efd;
}

.multiselect-rtl .multiselect__option--selected {
  background: #e7f1ff;
  color: #0d6efd;
}

.multiselect-rtl .multiselect__option--selected.multiselect__option--highlight {
  background: #0d6efd;
  color: #fff;
}

.multiselect-rtl .multiselect__tag {
  background: #0d6efd;
}
</style>