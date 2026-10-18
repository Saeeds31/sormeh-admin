<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 pos-page" v-if="checkPermission(['pos_view'])">

    <!-- کارت‌های آماری -->
    <div v-if="summary" class="row g-2 g-md-3 mb-3 mb-md-4">
      <div class="col-6 col-md-3">
        <div class="stat-card stat-primary">
          <div class="stat-icon">
            <i class="bi bi-wallet2"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">فروش امروز</div>
            <div class="stat-value">{{ formatPrice(summary.today_sales) }}</div>
            <div class="stat-sub">{{ summary.today_orders }} سفارش</div>
          </div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="stat-card stat-success">
          <div class="stat-icon">
            <i class="bi bi-cash-coin"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">موجودی صندوق</div>
            <div class="stat-value">{{ formatPrice(summary.current_cash) }}</div>
            <div class="stat-sub">{{ summary.open_sessions }} شیفت باز</div>
          </div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="stat-card stat-info">
          <div class="stat-icon">
            <i class="bi bi-cart-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">سفارشات امروز</div>
            <div class="stat-value">{{ summary.today_orders }}</div>
            <div class="stat-sub">میانگین: {{ formatPrice(summary.average_order) }}</div>
          </div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon">
            <i class="bi bi-arrow-left-right"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">برگشتی امروز</div>
            <div class="stat-value">{{ formatPrice(summary.today_refunds) }}</div>
            <div class="stat-sub">{{ summary.refund_count }} مورد</div>
          </div>
        </div>
      </div>
    </div>

    <!-- وضعیت شیفت فعلی -->
    <div class="card mb-3 mb-md-4 shift-card" v-if="currentSession">
      <div class="card-header shift-header shift-active">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h5 class="mb-0 shift-title">
            <i class="bi bi-clock-history"></i>
            <span>شیفت فعال شما</span>
          </h5>
          <button class="btn btn-danger btn-sm close-shift-btn" @click="closeSession">
            <i class="bi bi-x-circle"></i>
            <span>بستن شیفت</span>
          </button>
        </div>
      </div>
      <div class="card-body p-2 p-md-3">
        <div class="row g-2">
          <div class="col-6 col-md-3">
            <div class="shift-info-box">
              <div class="shift-info-label">
                <i class="bi bi-calendar-check"></i>
                شروع شیفت
              </div>
              <div class="shift-info-value">{{ formatDate(currentSession.opened_at) }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="shift-info-box">
              <div class="shift-info-label">
                <i class="bi bi-cash-stack"></i>
                موجودی اولیه
              </div>
              <div class="shift-info-value">{{ formatPrice(currentSession.opening_balance) }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="shift-info-box">
              <div class="shift-info-label">
                <i class="bi bi-wallet-fill"></i>
                موجودی فعلی
              </div>
              <div class="shift-info-value current-balance">{{ formatPrice(currentSession.current_balance) }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="shift-info-box">
              <div class="shift-info-label">
                <i class="bi bi-bag-check"></i>
                تعداد سفارشات
              </div>
              <div class="shift-info-value">{{ currentSession.orders_count || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- شیفت بسته -->
    <div class="card mb-3 mb-md-4 empty-shift-card" v-else>
      <div class="card-body text-center py-4 py-md-5">
        <div class="empty-shift-icon">
          <i class="bi bi-clock"></i>
        </div>
        <h5 class="text-muted mt-3 mb-3">شما شیفت فعالی ندارید</h5>
        <button class="btn btn-success open-shift-btn" @click="openSession">
          <i class="bi bi-play-circle"></i>
          <span>باز کردن شیفت جدید</span>
        </button>
      </div>
    </div>

    <!-- نمودار فروش -->
    <div class="card mb-3 mb-md-4 chart-card">
      <div class="card-header chart-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h5 class="mb-0 chart-title">
            <i class="bi bi-graph-up"></i>
            <span>نمودار فروش</span>
          </h5>
          <div class="d-flex gap-2 chart-controls">
            <select v-model="chartFilter" class="form-select form-select-sm chart-select">
              <option value="daily">روزانه</option>
              <option value="weekly">هفتگی</option>
              <option value="monthly">ماهانه</option>
            </select>
            <button class="btn btn-primary btn-sm refresh-btn" @click="loadChartData">
              <i class="bi bi-arrow-repeat"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="card-body chart-body p-2 p-md-3">
        <div v-if="chartLoading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
        <div v-else class="chart-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- آخرین سفارشات -->
    <div class="card">
      <div class="card-header orders-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h5 class="mb-0 orders-title">
            <i class="bi bi-list-ul"></i>
            <span>آخرین سفارشات</span>
          </h5>
          <router-link to="/pos/orders" class="btn btn-sm btn-outline-primary view-all-btn">
            <i class="bi bi-eye"></i>
            <span>مشاهده همه</span>
          </router-link>
        </div>
      </div>
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!orders.data || orders.data.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>سفارشی یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered table-striped mb-0">
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>مشتری</th>
                    <th>مبلغ</th>
                    <th>فروشنده</th>
                    <th>تاریخ</th>
                    <th class="text-center">وضعیت</th>
                    <th class="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in orders.data" :key="order.id">
                    <td class="order-id">#{{ order.id }}</td>
                    <td>{{ order.user?.full_name || 'مشتری' }}</td>
                    <td class="order-amount">{{ formatPrice(order.total_amount) }}</td>
                    <td>{{ order.cashier?.full_name || 'نامشخص' }}</td>
                    <td class="order-date">{{ formatDateTime(order.created_at) }}</td>
                    <td class="text-center">
                      <span class="badge" :class="{
                        'bg-success': order.status === 'paid',
                        'bg-danger': order.status === 'cancelled',
                        'bg-warning': order.status === 'returned',
                        'bg-secondary': order.status === 'pending'
                      }">
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </td>
                    <td class="text-center">
                      <router-link :to="`/pos/order/${order.id}`" class="btn btn-sm btn-info">
                        <i class="bi bi-eye"></i>
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ===== کارت موبایل ===== -->
            <div class="d-md-none order-cards">
              <div
                v-for="order in orders.data"
                :key="order.id"
                class="order-card"
              >
                <div class="order-card-header">
                  <div class="order-icon">
                    <i class="bi bi-receipt"></i>
                  </div>
                  <div class="order-info">
                    <div class="order-name">
                      <i class="bi bi-person-circle"></i>
                      {{ order.user?.full_name || 'مشتری' }}
                    </div>
                    <div class="order-meta">
                      <span class="order-id-badge">#{{ order.id }}</span>
                      <span class="order-date-sm">{{ formatDateTime(order.created_at) }}</span>
                    </div>
                  </div>
                  <span class="badge" :class="{
                    'bg-success': order.status === 'paid',
                    'bg-danger': order.status === 'cancelled',
                    'bg-warning': order.status === 'returned',
                    'bg-secondary': order.status === 'pending'
                  }">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>

                <div class="order-card-body">
                  <div class="info-row">
                    <i class="bi bi-cash-coin"></i>
                    <span class="info-label">مبلغ:</span>
                    <span class="info-value amount-value">{{ formatPrice(order.total_amount) }}</span>
                  </div>
                  <div class="info-row">
                    <i class="bi bi-person-badge"></i>
                    <span class="info-label">فروشنده:</span>
                    <span class="info-value">{{ order.cashier?.full_name || 'نامشخص' }}</span>
                  </div>
                </div>

                <div class="order-card-actions">
                  <router-link :to="`/pos/order/${order.id}`" class="btn btn-sm btn-info flex-fill">
                    <i class="bi bi-eye"></i>
                    <span>مشاهده</span>
                  </router-link>
                </div>
              </div>
            </div>
          </template>

          <b-pagination v-model="currentPage" :total-rows="orders.total" v-if="orders.last_page != 1"
            :per-page="orders.per_page" @Update:modelValue="changePage" align="center" class="mt-3 pagination-responsive" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, onMounted, nextTick } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import Swal from "sweetalert2";
import Chart from 'chart.js/auto';

const store = useAdmin();
const checkPermission = store.checkPermission;

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const chartLoading = ref(false);
const currentPage = ref(1);
const chartFilter = ref('daily');

const summary = ref({
  today_sales: 0,
  today_orders: 0,
  current_cash: 0,
  open_sessions: 0,
  average_order: 0,
  today_refunds: 0,
  refund_count: 0
});

const currentSession = ref(null);
const orders = ref({ data: [], total: 0, per_page: 20, last_page: 1 });
const chartData = ref([]);
const chartCanvas = ref(null);
let chartInstance = null;

async function getDashboardData() {
  loading.value = true;
  try {
    const res = await axios.get('/pos/dashboard');
    summary.value = res.data.data.summary;
    currentSession.value = res.data.data.current_session;
    orders.value = res.data.data.recent_orders;
    currentPage.value = res.data.data.recent_orders.current_page || 1;
  } catch (err) {
    console.error('Error loading dashboard:', err);
    Swal.fire('خطا', 'مشکلی در بارگذاری داشبورد پیش آمد', 'error');
  } finally {
    loading.value = false;
  }
}

async function loadChartData() {
  chartLoading.value = true;
  try {
    const { data } = await axios.get('/pos/chart-data', {
      params: { filter: chartFilter.value }
    });
    chartData.value = data;
    await nextTick();
    renderChart();
  } catch (err) {
    console.error('Error loading chart:', err);
  } finally {
    chartLoading.value = false;
  }
}

function renderChart() {
  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!chartCanvas.value) return;

  const labels = chartData.value.map(item => item.label);
  const sales = chartData.value.map(item => item.sales);
  const ordersCount = chartData.value.map(item => item.orders);

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'فروش (تومان)',
          data: sales,
          backgroundColor: 'rgba(13, 110, 253, 0.6)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'تعداد سفارشات',
          data: ordersCount,
          type: 'line',
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString('fa-IR');
            }
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

async function openSession() {
  const result = await Swal.fire({
    title: 'باز کردن شیفت جدید',
    html: `
      <div class="text-end">
        <label class="form-label">موجودی اولیه صندوق (تومان)</label>
        <input id="openingBalance" class="form-control" type="number" value="0">
        <label class="form-label mt-2">توضیحات (اختیاری)</label>
        <input id="notes" class="form-control" type="text" placeholder="توضیحات...">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'باز کردن شیفت',
    cancelButtonText: 'انصراف',
    preConfirm: () => {
      const openingBalance = document.getElementById('openingBalance').value;
      const notes = document.getElementById('notes').value;
      return { opening_balance: parseInt(openingBalance) || 0, notes };
    }
  });

  if (result.isConfirmed) {
    try {
      const { data } = await axios.post('/pos/cashier/open', result.value);
      Swal.fire('موفق', 'شیفت با موفقیت باز شد', 'success');
      await getDashboardData();
    } catch (err) {
      Swal.fire('خطا', err.response?.data?.message || 'مشکلی در باز کردن شیفت پیش آمد', 'error');
    }
  }
}

async function closeSession() {
  const result = await Swal.fire({
    title: 'بستن شیفت',
    html: `
      <div class="text-end">
        <label class="form-label">موجودی نهایی صندوق (تومان)</label>
        <input id="closingBalance" class="form-control" type="number" placeholder="موجودی نهایی را وارد کنید">
        <label class="form-label mt-2">توضیحات (اختیاری)</label>
        <input id="notes" class="form-control" type="text" placeholder="توضیحات...">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'بستن شیفت',
    cancelButtonText: 'انصراف',
    preConfirm: () => {
      const closingBalance = document.getElementById('closingBalance').value;
      if (!closingBalance) {
        Swal.showValidationMessage('لطفاً موجودی نهایی را وارد کنید');
        return false;
      }
      const notes = document.getElementById('notes').value;
      return { closing_balance: parseInt(closingBalance), notes };
    }
  });

  if (result.isConfirmed) {
    try {
      const sessionId = currentSession.value.id;
      await axios.post(`/pos/cashier/close/${sessionId}`, result.value);
      Swal.fire('موفق', 'شیفت با موفقیت بسته شد', 'success');
      await getDashboardData();
    } catch (err) {
      Swal.fire('خطا', err.response?.data?.message || 'مشکلی در بستن شیفت پیش آمد', 'error');
    }
  }
}

function changePage(page) {
  if (page) {
    router.replace({ name: route.name, query: { page: page } });
    getDashboardData();
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('fa-IR').format(price || 0) + ' تومان';
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fa-IR');
}

function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('fa-IR');
}

function getPaymentMethodLabel(method) {
  const labels = {
    cash: 'نقدی',
    card: 'کارت',
    transfer: 'انتقال'
  };
  return labels[method] || method;
}

function getStatusLabel(status) {
  const labels = {
    paid: 'پرداخت شده',
    pending: 'در انتظار',
    cancelled: 'لغو شده',
    returned: 'برگشت خورده'
  };
  return labels[status] || status;
}

onMounted(() => {
  getDashboardData();
  loadChartData();
});
</script>

<style scoped>
/* ===== کارت‌های آماری ===== */
.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  color: white;
  height: 100%;
  min-height: 90px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.stat-primary {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
}

.stat-success {
  background: linear-gradient(135deg, #00b894, #55efc4);
}

.stat-info {
  background: linear-gradient(135deg, #0984e3, #74b9ff);
}

.stat-warning {
  background: linear-gradient(135deg, #f39c12, #fdcb6e);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.95;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
  word-break: break-word;
  margin-bottom: 2px;
}

.stat-sub {
  font-size: 0.7rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== کارت شیفت ===== */
.shift-card,
.empty-shift-card {
  border: none;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.shift-header {
  background: transparent;
  border-bottom: 2px solid #f8f9fa;
  padding: 14px 18px;
}

.shift-active {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-bottom-color: #a7f3d0;
}

.shift-title {
  font-weight: 700;
  color: #065f46;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shift-title i {
  color: #16a34a;
}

.close-shift-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.shift-info-box {
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px 12px;
  height: 100%;
  border: 1px solid #e2e8f0;
}

.shift-info-label {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.shift-info-label i {
  color: #16a34a;
}

.shift-info-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  word-break: break-word;
}

.current-balance {
  color: #16a34a;
}

/* ===== شیفت بسته ===== */
.empty-shift-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #64748b;
}

.open-shift-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
}

/* ===== نمودار ===== */
.chart-card {
  border: none;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chart-header {
  background: transparent;
  border-bottom: 2px solid #f8f9fa;
  padding: 14px 18px;
}

.chart-title {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-title i {
  color: #3b82f6;
}

.chart-controls {
  align-items: center;
}

.chart-select {
  border-radius: 8px;
  font-size: 0.82rem;
  padding: 5px 10px;
  min-width: 110px;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
}

/* ===== آخرین سفارشات ===== */
.orders-header {
  background: transparent;
  border-bottom: 2px solid #f8f9fa;
  padding: 14px 18px;
}

.orders-title {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.orders-title i {
  color: #3b82f6;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
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

.order-id {
  font-weight: 700;
  color: #6c757d;
}

.order-amount {
  font-weight: 700;
  color: #16a34a;
}

.order-date {
  font-size: 0.82rem;
  color: #6c757d;
  white-space: nowrap;
}

/* ===== کارت‌های موبایل ===== */
.order-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.order-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.order-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.order-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.25);
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-name i {
  color: #6c5ce7;
  flex-shrink: 0;
}

.order-meta {
  display: flex;
  gap: 8px;
  font-size: 0.7rem;
  color: #6c757d;
  margin-top: 3px;
  flex-wrap: wrap;
  align-items: center;
}

.order-id-badge {
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 700;
}

.order-date-sm {
  font-size: 0.7rem;
}

.order-card-body {
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
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.info-label {
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  color: #2d3436;
  font-weight: 600;
  margin-right: auto;
  word-break: break-word;
}

.amount-value {
  color: #16a34a;
  background: #f0fdf4;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
}

.order-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-card-actions .btn {
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
  .stat-card {
    padding: 10px;
    gap: 8px;
    min-height: 76px;
    border-radius: 12px;
  }

  .stat-icon {
    width: 38px;
    height: 38px;
    font-size: 17px;
    border-radius: 10px;
  }

  .stat-label {
    font-size: 0.68rem;
  }

  .stat-value {
    font-size: 0.85rem;
  }

  .stat-sub {
    font-size: 0.62rem;
  }

  .shift-title,
  .chart-title,
  .orders-title {
    font-size: 0.92rem;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .shift-header,
  .chart-header,
  .orders-header {
    padding: 12px 14px;
  }

  .close-shift-btn,
  .view-all-btn {
    width: 100%;
    justify-content: center;
  }

  .chart-controls {
    width: 100%;
    justify-content: center;
  }

  .chart-select {
    flex: 1;
  }

  .chart-wrapper {
    height: 250px;
  }

  .shift-info-box {
    padding: 8px 10px;
  }

  .shift-info-label {
    font-size: 0.68rem;
  }

  .shift-info-value {
    font-size: 0.78rem;
  }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
  .stat-card {
    padding: 8px;
    min-height: 68px;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    font-size: 15px;
  }

  .stat-label {
    font-size: 0.62rem;
  }

  .stat-value {
    font-size: 0.78rem;
  }

  .stat-sub {
    font-size: 0.58rem;
  }

  .order-card {
    padding: 12px;
  }

  .order-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .order-name {
    font-size: 0.85rem;
  }

  .info-row {
    font-size: 0.75rem;
  }

  .order-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }

  .chart-wrapper {
    height: 220px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .order-cards {
    display: none;
  }
}
</style>