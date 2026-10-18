<template>
  <div class="container py-4" v-if="checkPermission(['report_orders'])">
    <!-- فیلترها -->
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>
          <i class="bi bi-receipt"></i>
          <span>گزارش سفارشات</span>
        </h3>
        <b-spinner small v-if="loading"></b-spinner>
      </div>
      <div class="card-body">
        <form @submit.prevent="getReport()" class="row g-3">
          <!-- تاریخ -->
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
          
          <!-- وضعیت سفارش -->
          <div class="col-md-2">
            <multiselect
              v-model="filters.status"
              placeholder="وضعیت سفارش"
              open-direction="bottom"
              :options="filterOptions.statuses"
              label="label"
              track-by="value"
              :searchable="true"
              :multiple="false"
              :close-on-select="true"
              :show-labels="false"
              class="multiselect-rtl"
            >
              <template slot="option" slot-scope="props">
                <span>{{ props.option.label }}</span>
              </template>
            </multiselect>
          </div>
          
          <!-- وضعیت پرداخت -->
          <div class="col-md-2">
            <multiselect
              v-model="filters.payment_status"
              placeholder="وضعیت پرداخت"
              open-direction="bottom"
              :options="filterOptions.payment_statuses"
              label="label"
              track-by="value"
              :searchable="true"
              :multiple="false"
              :close-on-select="true"
              :show-labels="false"
              class="multiselect-rtl"
            >
              <template slot="option" slot-scope="props">
                <span>{{ props.option.label }}</span>
              </template>
            </multiselect>
          </div>
          
          <!-- روش پرداخت -->
          <div class="col-md-2">
            <multiselect
              v-model="filters.payment_method"
              placeholder="روش پرداخت"
              open-direction="bottom"
              :options="filterOptions.payment_methods"
              label="label"
              track-by="value"
              :searchable="true"
              :multiple="false"
              :close-on-select="true"
              :show-labels="false"
              class="multiselect-rtl"
            >
              <template slot="option" slot-scope="props">
                <span>{{ props.option.label }}</span>
              </template>
            </multiselect>
          </div>
          
          <!-- استان -->
          <div class="col-md-2">
            <multiselect
              v-model="filters.province"
              placeholder="استان"
              open-direction="bottom"
              :options="filterOptions.provinces"
              :searchable="true"
              :multiple="false"
              :close-on-select="true"
              :show-labels="false"
              class="multiselect-rtl"
            >
            </multiselect>
          </div>
          
          <!-- شهر -->
          <div class="col-md-2">
            <input
              type="text"
              v-model="filters.city"
              class="form-control"
              placeholder="شهر"
            />
          </div>
          
          <!-- روش حمل و نقل -->
          <div class="col-md-2">
            <multiselect
              v-model="filters.shipping_method_id"
              placeholder="روش حمل"
              open-direction="bottom"
              :options="filterOptions.shipping_methods"
              label="name"
              track-by="id"
              :searchable="true"
              :multiple="false"
              :close-on-select="true"
              :show-labels="false"
              class="multiselect-rtl"
            >
              <template slot="option" slot-scope="props">
                <span>{{ props.option.name }}</span>
              </template>
            </multiselect>
          </div>
          
          <!-- حداقل قیمت -->
          <div class="col-md-2">
            <input
              type="number"
              v-model="filters.min_total"
              class="form-control"
              placeholder="حداقل قیمت"
            />
          </div>
          
          <!-- حداکثر قیمت -->
          <div class="col-md-2">
            <input
              type="number"
              v-model="filters.max_total"
              class="form-control"
              placeholder="حداکثر قیمت"
            />
          </div>
          
          <!-- کد تخفیف -->
          <div class="col-md-2">
            <select v-model="filters.has_coupon" class="form-select">
              <option value="">همه سفارشات</option>
              <option value="1">دارای تخفیف</option>
              <option value="0">بدون تخفیف</option>
            </select>
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

    <!-- کارت‌های خلاصه -->
    <div class="row mb-4" v-if="summary">
      <div class="col-md-6">
        <div class="card text-white bg-primary">
          <div class="card-body text-center">
            <h5 class="card-title">کل سفارشات</h5>
            <h2>{{ formatNumber(summary.total_orders) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card text-white bg-success">
          <div class="card-body text-center">
            <h5 class="card-title">کل فروش</h5>
            <h2>{{ formatCurrency(summary.total_revenue) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card text-white bg-warning">
          <div class="card-body text-center">
            <h5 class="card-title">میانگین هر سفارش</h5>
            <h2>{{ formatCurrency(summary.average_order_value) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card text-white bg-info">
          <div class="card-body text-center">
            <h5 class="card-title">تعداد مشتریان</h5>
            <h2>{{ formatNumber(summary.unique_customers) }}</h2>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">در حال بارگذاری...</p>
    </div>

    <div v-else>
      <!-- تب‌ها -->
      <b-tabs>
        <!-- تب لیست سفارشات -->
        <b-tab title="لیست سفارشات" active>
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped text-center align-middle">
                  <thead class="table-light">
                    <tr>
                      <th @click="sortBy('id')" style="cursor: pointer;">
                        شناسه 
                        <i v-if="sortField === 'id'" :class="sortOrder === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                      </th>
                      <th>مشتری</th>
                      <th>مبلغ کل</th>
                      <th @click="sortBy('total')" style="cursor: pointer;">
                        تخفیف
                        <i v-if="sortField === 'total'" :class="sortOrder === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                      </th>
                      <th>وضعیت</th>
                      <th>پرداخت</th>
                      <th>روش پرداخت</th>
                      <th>استان</th>
                      <th @click="sortBy('created_at')" style="cursor: pointer;">
                        تاریخ
                        <i v-if="sortField === 'created_at'" :class="sortOrder === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                      </th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in tableData.data" :key="order.id">
                      <td>#{{ order.id }}</td>
                      <td>{{ order.user?.full_name || 'کاربر مهمان' }}</td>
                      <td>{{ formatCurrency(order.total) }}</td>
                      <td>{{ formatCurrency(order.discount_amount) }}</td>
                      <td>
                        <span class="badge" :class="getStatusBadgeClass(order.status)">
                          {{ translateStatus(order.status) }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" :class="getPaymentStatusBadgeClass(order.payment_status)">
                          {{ translatePaymentStatus(order.payment_status) }}
                        </span>
                      </td>
                      <td>{{ translatePaymentMethod(order.payment_method) }}</td>
                      <td>{{ order.address?.province?.name || '-' }}</td>
                      <td>{{ formatDate(order.created_at) }}</td>
                      <td>
                        <button @click="showOrderDetail(order)" class="btn btn-sm btn-info">
                          <i class="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!tableData.data?.length">
                      <td colspan="10" class="text-center text-muted py-4">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <p class="mt-2">هیچ سفارشی با این فیلترها یافت نشد</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination -->
              <b-pagination
                v-if="tableData.last_page > 1"
                v-model="currentPage"
                :total-rows="tableData.total"
                :per-page="tableData.per_page"
                @update:modelValue="changePage"
                align="center"
                class="mt-3"
              ></b-pagination>
            </div>
          </div>
        </b-tab>

        <!-- تب نمودارها -->
        <b-tab title="نمودارها">
          <div class="row">
            <!-- نمودار فروش روزانه -->
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5>فروش روزانه (۳۰ روز اخیر)</h5>
                </div>
                <div class="card-body">
                  <div v-if="charts.daily_sales?.length">
                    <BarChart :chart-data="dailyChartData" />
                  </div>
                  <div v-else class="text-center text-muted py-4">
                    <i class="bi bi-bar-chart" style="font-size: 2rem;"></i>
                    <p>داده‌ای برای نمایش وجود ندارد</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- نمودار فروش ماهانه -->
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5>فروش ماهانه (۱۲ ماه اخیر)</h5>
                </div>
                <div class="card-body">
                  <div v-if="charts.monthly_sales?.length">
                    <BarChart :chart-data="monthlyChartData" />
                  </div>
                  <div v-else class="text-center text-muted py-4">
                    <i class="bi bi-bar-chart" style="font-size: 2rem;"></i>
                    <p>داده‌ای برای نمایش وجود ندارد</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- نمودار تفکیک وضعیت -->
            <div class="col-md-4 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5>تفکیک وضعیت سفارش</h5>
                </div>
                <div class="card-body">
                  <div v-if="charts.status?.length">
                    <PieChart :chart-data="statusChartData" />
                  </div>
                  <div v-else class="text-center text-muted py-4">
                    <p>داده‌ای برای نمایش وجود ندارد</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- نمودار تفکیک روش پرداخت -->
            <div class="col-md-4 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5>تفکیک روش پرداخت</h5>
                </div>
                <div class="card-body">
                  <div v-if="charts.payment_method?.length">
                    <PieChart :chart-data="paymentMethodChartData" />
                  </div>
                  <div v-else class="text-center text-muted py-4">
                    <p>داده‌ای برای نمایش وجود ندارد</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- نمودار تفکیک استان‌ها -->
            <div class="col-md-4 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5>تفکیک فروش بر اساس استان</h5>
                </div>
                <div class="card-body">
                  <div v-if="charts.province?.length">
                    <PieChart :chart-data="provinceChartData" />
                  </div>
                  <div v-else class="text-center text-muted py-4">
                    <p>داده‌ای برای نمایش وجود ندارد</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </b-tab>
      </b-tabs>
    </div>

    <!-- مودال جزئیات سفارش -->
    <Modal
      v-if="showModal"
      id="orderDetailModal"
      @closeModal="() => { showModal = false; selectedOrder = null; }"
      :title="'جزئیات سفارش #' + selectedOrder?.id"
    >
      <div v-if="selectedOrder">
        <div class="row mb-4">
          <div class="col-md-6">
            <h6>اطلاعات مشتری</h6>
            <p><strong>نام:</strong> {{ selectedOrder.user?.full_name || 'کاربر مهمان' }}</p>
            <p><strong>موبایل:</strong> {{ selectedOrder.user?.mobile || '-' }}</p>
          </div>
          <div class="col-md-6">
            <h6>اطلاعات سفارش</h6>
            <p><strong>تاریخ:</strong> {{ formatDate(selectedOrder.created_at) }}</p>
            <p><strong>وضعیت:</strong> {{ translateStatus(selectedOrder.status) }}</p>
            <p><strong>وضعیت پرداخت:</strong> {{ translatePaymentStatus(selectedOrder.payment_status) }}</p>
            <p><strong>روش پرداخت:</strong> {{ translatePaymentMethod(selectedOrder.payment_method) }}</p>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6">
            <h6>آدرس</h6>
            <p>{{ selectedOrder.address?.address_line || '-' }}</p>
            <p><strong>استان:</strong> {{ selectedOrder.address?.province?.name || '-' }}</p>
            <p><strong>شهر:</strong> {{ selectedOrder.address?.city?.name || '-' }}</p>
            <p><strong>کد پستی:</strong> {{ selectedOrder.address?.postal_code || '-' }}</p>
          </div>
          <div class="col-md-6">
            <h6>روش حمل و نقل</h6>
            <p><strong>روش:</strong> {{ selectedOrder.shipping?.title || '-' }}</p>
            <p><strong>هزینه:</strong> {{ formatCurrency(selectedOrder.shipping_cost) }}</p>
          </div>
        </div>
        
        <h6>محصولات</h6>
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>محصول</th>
                <th>تنوع</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>مجموع</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedOrder.items" :key="item.id">
                <td>{{ item.product?.title || 'محصول حذف شده' }}</td>
                <td>{{ item.variant?.values?.map(v => v.value).join(' - ') || '-' }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.price) }}</td>
                <td>{{ formatCurrency(item.price * item.quantity) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-end"><strong>جمع کل:</strong></td>
                <td>{{ formatCurrency(selectedOrder.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, computed, onMounted, watch } from 'vue';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Bar, Pie } from 'vue-chartjs';
import { useAdmin } from '@/stores/modules/admin';
import Modal from "@/components/shared/modal.vue";
import Multiselect from 'vue-multiselect';

const store = useAdmin();
const checkPermission = store.checkPermission;

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

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
    paid: 'پرداخت شده',
    failed: 'خطا شده',
    cancelled: 'لغو شده',
    completed: 'تکمیل شده',
    canceled: 'لغو شده',
    returned: 'مرجوعی',
  };
  return map[status] || status;
}

function translatePaymentStatus(status) {
  const map = {
    pending: 'در انتظار پرداخت',
    paid: 'پرداخت شده',
    failed: 'ناموفق',
    refunded: 'برگشت داده شده',
  };
  return map[status] || status;
}

function translatePaymentMethod(method) {
  const map = {
    online: 'پرداخت آنلاین',
    wallet: 'کیف پول',
    cod: 'پرداخت در محل',
    card_transfer: 'کارت به کارت',
  };
  return map[method] || method;
}

function getStatusBadgeClass(status) {
  const map = {
    pending: 'bg-warning',
    processing: 'bg-info',
    shipped: 'bg-primary',
    completed: 'bg-success',
    canceled: 'bg-danger',
    returned: 'bg-secondary',
    reserved: 'bg-secondary',
  };
  return map[status] || 'bg-secondary';
}

function getPaymentStatusBadgeClass(status) {
  const map = {
    pending: 'bg-warning',
    paid: 'bg-success',
    failed: 'bg-danger',
    refunded: 'bg-secondary',
  };
  return map[status] || 'bg-secondary';
}

// Chart components
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

const PieChart = {
  props: ['chartData'],
  components: { Pie },
  template: `
    <Pie 
      :data="chartData" 
      :options="{
        responsive: true,
        plugins: { 
          legend: { 
            display: true,
            position: 'bottom'
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
  status: '',
  payment_status: '',
  payment_method: '',
  province: '',
  city: '',
  shipping_method_id: '',
  user_id: '',
  min_total: '',
  max_total: '',
  has_coupon: '',
});

const loading = ref(false);
const tableData = ref({ data: [], total: 0, per_page: 20, last_page: 1 });
const summary = ref(null);
const charts = ref({
  daily_sales: [],
  monthly_sales: [],
  status: [],
  payment_method: [],
  province: [],
  shipping: [],
});
const filterOptions = ref({
  statuses: [],
  payment_methods: [],
  payment_statuses: [],
  provinces: [],
  shipping_methods: [],
});
const currentPage = ref(1);
const sortField = ref('created_at');
const sortOrder = ref('desc');
const showModal = ref(false);
const selectedOrder = ref(null);

// Chart data computed
const dailyChartData = computed(() => {
  const data = charts.value.daily_sales || [];
  if (!data.length) return null;
  
  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return {
    labels: sorted.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'فروش',
        data: sorted.map(d => Math.round(d.total_sales)),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'تعداد سفارشات',
        data: sorted.map(d => d.orders_count),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };
});

const monthlyChartData = computed(() => {
  const data = (charts.value.monthly_sales || []).filter(d => d.month);
  if (!data.length) return null;

  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));

  return {
    labels: sorted.map(d => {
      const [year, month] = d.month.split('-');
      return `${year}/${month}`;
    }),
    datasets: [
      {
        label: 'فروش ماهانه',
        data: sorted.map(d => Math.round(d.total_sales)),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: '#8b5cf6',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };
});
const statusChartData = computed(() => {
  const data = charts.value.status || [];
  if (!data.length) return null;
  
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
  
  return {
    labels: data.map(d => translateStatus(d.status)),
    datasets: [
      {
        data: data.map(d => d.orders_count),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
      },
    ],
  };
});

const paymentMethodChartData = computed(() => {
  const data = charts.value.payment_method || [];
  if (!data.length) return null;
  
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  
  return {
    labels: data.map(d => translatePaymentMethod(d.payment_method)),
    datasets: [
      {
        data: data.map(d => d.orders_count),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
      },
    ],
  };
});

const provinceChartData = computed(() => {
  const data = charts.value.province || [];
  if (!data.length) return null;
  
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  
  return {
    labels: data.map(d => d.province),
    datasets: [
      {
        data: data.map(d => d.orders_count),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
      },
    ],
  };
});

// Methods
const getReport = async (page = 1) => {
  loading.value = true;
  try {
    const params = {
      ...filters.value,
      page: page,
      per_page: 20,
      sort_by: sortField.value,
      sort_order: sortOrder.value,
    };
    
    // حذف مقادیر خالی
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });
    
    const { data } = await axios.get('/reports/orders', { params });
    tableData.value = data.data;
    summary.value = data.summary;
    charts.value = data.charts || {};
    filterOptions.value = data.filter_options || {};
    currentPage.value = data.data.current_page || 1;
  } catch (error) {
    console.error('Error fetching report:', error);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page > 0) {
    getReport(page);
  }
};

const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'desc';
  }
  getReport();
};

const showOrderDetail = (order) => {
  selectedOrder.value = order;
  showModal.value = true;
};

// Initialize
onMounted(() => {
  getReport();
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

/* استایل‌های vue-multiselect */
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