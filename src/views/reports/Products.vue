<template>
  <div class="container py-4" v-if="checkPermission(['report_products'])">
    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>
          <i class="bi bi-box-seam"></i>
          <span>گزارش موجودی و فروش کالا</span>
        </h3>
        <b-spinner small v-if="loading"></b-spinner>
      </div>
      <div class="card-body">
        <form @submit.prevent="getReport()" class="row g-3">
          <div class="col-md-2">
            <date-picker
              display-format="jYYYY/jMM/jDD"
              placeholder="از تاریخ"
              format="YYYY-MM-DD"
              v-model="filters.date_from"
            ></date-picker>
          </div>
          <div class="col-md-2">
            <date-picker
              display-format="jYYYY/jMM/jDD"
              placeholder="تا تاریخ"
              format="YYYY-MM-DD"
              v-model="filters.date_to"
            ></date-picker>
          </div>
          <div class="col-md-2">
            <select v-model="filters.category_id" class="form-select">
              <option value="">همه دسته‌بندی‌ها</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.title }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="filters.status" class="form-select">
              <option value="">همه وضعیت‌ها</option>
              <option value="published">منتشر شده</option>
              <option value="unpublished">منتشر نشده</option>
            </select>
          </div>
          <div class="col-md-2">
            <input
              type="text"
              v-model="filters.product_id"
              class="form-control"
              placeholder="شناسه کالا"
            />
          </div>
          <div class="col-md-2">
            <input
              type="text"
              v-model="filters.search"
              class="form-control"
              placeholder="جستجو..."
            />
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
      <div class="col-md-4">
        <div class="card text-white bg-primary">
          <div class="card-body text-center">
            <h5 class="card-title">کل محصولات</h5>
            <h2>{{ formatNumber(summary.total_products) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-white bg-success">
          <div class="card-body text-center">
            <h5 class="card-title">کل موجودی</h5>
            <h2>{{ formatNumber(summary.total_stock) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-white bg-warning">
          <div class="card-body text-center">
            <h5 class="card-title">کل فروش</h5>
            <h2>{{ formatCurrency(summary.total_revenue) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-white bg-info">
          <div class="card-body text-center">
            <h5 class="card-title">تعداد فروخته شده</h5>
            <h2>{{ formatNumber(summary.total_items_sold) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-white bg-secondary">
          <div class="card-body text-center">
            <h5 class="card-title">با فروش</h5>
            <h2>{{ formatNumber(summary.products_with_sales) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-white bg-danger">
          <div class="card-body text-center">
            <h5 class="card-title">بدون فروش</h5>
            <h2>{{ formatNumber(summary.products_without_sales) }}</h2>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">در حال بارگذاری...</p>
    </div>

    <div v-else>
      <!-- Tabs for different views -->
      <b-tabs>
        <b-tab title="لیست محصولات" active>
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped text-center align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>شناسه</th>
                      <th>نام محصول</th>
                      <th>قیمت</th>
                      <th>موجودی</th>
                      <th>تعداد فروش</th>
                      <th>درآمد</th>
                      <th>وضعیت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in reportData" :key="item.product.id">
                      <td>{{ item.product.id }}</td>
                      <td>
                        <strong>{{ item.product.title }}</strong>
                        <div class="small text-muted">{{ item.product.sku }}</div>
                        <span v-if="item.product.categories.length" class="badge bg-secondary">
                          {{ item.product.categories.join(', ') }}
                        </span>
                      </td>
                      <td>{{ formatCurrency(item.product.price) }}</td>
                      <td>
                        <span :class="item.product.stock > 0 ? 'text-success' : 'text-danger'">
                          {{ item.product.stock }}
                        </span>
                      </td>
                      <td>
                        <span :class="item.sales_summary.total_quantity_sold > 0 ? 'text-success' : 'text-muted'">
                          {{ item.sales_summary.total_quantity_sold }}
                        </span>
                      </td>
                      <td>{{ formatCurrency(item.sales_summary.total_revenue) }}</td>
                      <td>
                        <span :class="item.product.status === 'published' ? 'badge bg-success' : 'badge bg-secondary'">
                          {{ item.product.status === 'published' ? 'منتشر شده' : 'منتشر نشده' }}
                        </span>
                      </td>
                      <td>
                        <button @click="showProductDetail(item)" class="btn btn-sm btn-info">
                          <i class="bi bi-eye"></i>
                        </button>
                      </td>
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

        <b-tab title="پر فروش‌ترین">
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>محصول</th>
                      <th>تعداد فروش</th>
                      <th>درآمد</th>
                      <th>تعداد سفارش</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in topSellingProducts" :key="item.product.id">
                      <td>{{ index + 1 }}</td>
                      <td>{{ item.product.title }}</td>
                      <td>{{ formatNumber(item.sales_summary.total_quantity_sold) }}</td>
                      <td>{{ formatCurrency(item.sales_summary.total_revenue) }}</td>
                      <td>{{ formatNumber(item.sales_summary.total_orders) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </b-tab>

        <b-tab title="ورود و خروج موجودی">
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>محصول</th>
                      <th>ورودی</th>
                      <th>خروجی</th>
                      <th>موجودی فعلی</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in reportData" :key="item.product.id">
                      <td>{{ item.product.title }}</td>
                      <td>{{ formatNumber(item.inventory_summary.total_incoming) }}</td>
                      <td>{{ formatNumber(item.inventory_summary.total_outgoing) }}</td>
                      <td>
                        <span :class="item.product.stock > 0 ? 'text-success' : 'text-danger'">
                          {{ formatNumber(item.product.stock) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </b-tab>
      </b-tabs>
    </div>

    <!-- Product Detail Modal -->
    <Modal
      v-if="showModal"
      id="productDetailModal"
      @closeModal="() => { showModal = false; selectedProduct = null; }"
      :title="selectedProduct?.product?.title || 'جزئیات محصول'"
    >
      <div v-if="selectedProduct">
        <!-- خلاصه فروش -->
        <h5 class="mb-3">خلاصه فروش</h5>
        <div class="row mb-4 g-3">
          <div class="col-md-6">
            <div class="card bg-danger text-white">
              <div class="card-body text-center">
                <h6>تعداد فروش</h6>
                <h2 class="mb-0">{{ formatNumber(selectedProduct.sales_summary.total_quantity_sold) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-primary text-white">
              <div class="card-body text-center">
                <h6>درآمد کل</h6>
                <h2 class="mb-0">{{ formatCurrency(selectedProduct.sales_summary.total_revenue) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-info text-white">
              <div class="card-body text-center">
                <h6>تعداد سفارش</h6>
                <h2 class="mb-0">{{ formatNumber(selectedProduct.sales_summary.total_orders) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-warning text-white">
              <div class="card-body text-center">
                <h6>موجودی فعلی</h6>
                <h2 class="mb-0">{{ formatNumber(selectedProduct.product.stock) }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- خلاصه موجودی -->
        <h5 class="mb-3">خلاصه موجودی</h5>
        <div class="row mb-4 g-3">
          <div class="col-md-4">
            <div class="card bg-success text-white">
              <div class="card-body text-center">
                <h6>کل ورودی</h6>
                <h2 class="mb-0">{{ formatNumber(selectedProduct.inventory_summary.total_incoming) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-danger text-white">
              <div class="card-body text-center">
                <h6>کل خروجی</h6>
                <h2 class="mb-0">{{ formatNumber(selectedProduct.inventory_summary.total_outgoing) }}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-info text-white">
              <div class="card-body text-center">
                <h6>موجودی فعلی</h6>
                <h2 class="mb-0">{{ formatNumber(selectedProduct.product.stock) }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- فروش به ازای هر شخص -->
        <h5 class="mb-3">فروش به ازای هر شخص</h5>
        <div class="table-responsive mb-4">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>مشتری</th>
                <th>موبایل</th>
                <th>تعداد</th>
                <th>مبلغ</th>
                <th>تعداد سفارش</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="person in selectedProduct.per_person_sales" :key="person.user_id">
                <td>{{ person.full_name || 'کاربر مهمان' }}</td>
                <td>{{ person.mobile || '-' }}</td>
                <td>{{ formatNumber(person.total_quantity) }}</td>
                <td>{{ formatCurrency(person.total_spent) }}</td>
                <td>{{ formatNumber(person.order_count) }}</td>
              </tr>
              <tr v-if="!selectedProduct.per_person_sales.length">
                <td colspan="5" class="text-center text-muted">هیچ فروشی برای این محصول وجود ندارد</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- آخرین فروش‌ها -->
        <h5 class="mb-3">آخرین فروش‌ها</h5>
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>مشتری</th>
                <th>موبایل</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>مجموع</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in selectedProduct.recent_sales" :key="sale.order_id">
                <td>{{ formatDate(sale.sold_at) }}</td>
                <td>{{ sale.customer_name }}</td>
                <td>{{ sale.customer_mobile || '-' }}</td>
                <td>{{ formatNumber(sale.quantity) }}</td>
                <td>{{ formatCurrency(sale.price_per_unit) }}</td>
                <td>{{ formatCurrency(sale.total_price) }}</td>
                <td>
                  <span class="badge" :class="sale.order_status === 'completed' ? 'bg-success' : 'bg-warning'">
                    {{ translateStatus(sale.order_status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!selectedProduct.recent_sales.length">
                <td colspan="7" class="text-center text-muted">هیچ فروشی برای این محصول وجود ندارد</td>
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

const store = useAdmin();
const checkPermission = store.checkPermission;

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

function translateStatus(status) {
  const map = {
    pending: 'در انتظار',
    reserved: 'رزرو شده',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    completed: 'تکمیل شده',
    canceled: 'لغو شده',
    returned: 'مرجوعی',
    paid: 'پرداخت شده',
    delivered: 'تحویل داده شده',
  };
  return map[status] || status;
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
  status: '',
  product_id: '',
  search: '',
});

const loading = ref(false);
const reportData = ref([]);
const summary = ref(null);
const showModal = ref(false);
const selectedProduct = ref(null);
const categories = ref([]);

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

const topSellingProducts = computed(() => {
  return [...reportData.value]
    .filter(item => item.sales_summary.total_quantity_sold > 0)
    .sort((a, b) => b.sales_summary.total_quantity_sold - a.sales_summary.total_quantity_sold)
    .slice(0, 10);
});

// Methods
const getReport = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get('/reports/products/inventory', {
            params: { ...filters.value },
        });
        reportData.value = data.data || [];
        summary.value = data.summary || null;
        
        // لاگ برای دیباگ
        console.log('Product Report Summary:', data.summary);
        console.log('Product Report Total Revenue:', data.summary?.total_revenue);
        
    } catch (error) {
        console.error('Error fetching report:', error);
    } finally {
        loading.value = false;
    }
};

const showProductDetail = (item) => {
  selectedProduct.value = item;
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

// Initialize
onMounted(() => {
  getReport();
  loadCategories();
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
</style>