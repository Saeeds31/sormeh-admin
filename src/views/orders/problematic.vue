<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 orders-page" v-if="checkPermission(['order_view'])">

    <!-- هدر و فیلترها -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div
          class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
          <h3 class="mb-0 page-title">
            <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            <span>سفارش‌های مشکل‌دار</span>
          </h3>

          <div class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 header-actions">
            <!-- انتخاب نوع پرینت -->
            <select v-model="printType" class="form-select form-select-sm print-type-select">
              <option value="full">پرینت کامل (جزئیات سفارش)</option>
              <option value="label">پرینت برچسب (فرستنده و گیرنده)</option>
            </select>

            <!-- دکمه پرینت گروهی -->
            <button v-if="selectedOrders.length > 0" @click="goToPrint" class="btn btn-success print-bulk-btn">
              <i class="bi bi-printer"></i>
              <span>پرینت ({{ selectedOrders.length }})</span>
            </button>

            <router-link to="/orders" class="btn btn-primary add-btn">
              <i class="bi bi-arrow-right"></i>
              <span>بازگشت به سفارش‌ها</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- کارت‌های آماری -->
      <div class="card-body p-2 p-md-3">
        <div class="row g-2 mb-3 stats-row">
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-danger-soft">
                <i class="bi bi-exclamation-circle"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">کل مشکل‌دارها</div>
                <div class="stat-value">{{ stats.total ?? 0 }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-warning-soft">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">در انتظار</div>
                <div class="stat-value">{{ stats.by_status?.pending ?? 0 }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-secondary-soft">
                <i class="bi bi-x-octagon"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">Failed شده</div>
                <div class="stat-value">{{ stats.by_status?.failed ?? 0 }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-success-soft">
                <i class="bi bi-cash-stack"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">مبلغ در خطر</div>
                <div class="stat-value small-value">
                  {{ Number(stats.total_amount_at_risk ?? 0).toLocaleString('fa-Ir') }}
                  <small>تومان</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- فیلترها -->
        <div class="row g-2">


          <!-- سرچ عمومی -->
          <div class="col-12 col-sm-6 col-md-3">
            <label class="filter-label">جستجو (کاربر / موبایل / شماره سفارش)</label>
            <input v-model="filters.search" @keyup.enter="applyFilters" type="text" class="form-control search-input"
              placeholder="نام، موبایل یا شماره سفارش" />
          </div>

          <!-- درگاه -->
          <div class="col-6 col-sm-3 col-md-2">
            <label class="filter-label">درگاه پرداخت</label>
            <select v-model="filters.gateway" class="form-select">
              <option value="">همه درگاه‌ها</option>
              <option value="parsian">پارسیان</option>
              <option value="zarinpal">زرین‌پال</option>
              <option value="zibal">زیبال</option>
            </select>
          </div>

          <!-- تاریخ از -->
          <div class="col-12 col-sm-6 col-md-3">
            <label class="filter-label">از تاریخ</label>
            <date-picker type="datetime" display-format="jYYYY/jMM/jDD HH:mm" placeholder="از تاریخ"
              format="YYYY-MM-DD HH:mm" v-model="filters.date_from"></date-picker>
          </div>

          <!-- تاریخ تا -->
          <div class="col-12 col-sm-6 col-md-3">
            <label class="filter-label">تا تاریخ</label>
            <date-picker type="datetime" display-format="jYYYY/jMM/jDD HH:mm" placeholder="تا تاریخ"
              format="YYYY-MM-DD HH:mm" v-model="filters.date_to"></date-picker>
          </div>

          <!-- دکمه‌های فیلتر -->
          <div class="col-12 d-flex gap-2 flex-wrap filter-actions">
            <button @click="applyFilters" class="btn btn-primary filter-btn">
              <i class="bi bi-funnel"></i>
              <span>فیلتر</span>
            </button>
            <button @click="resetFilters" class="btn btn-outline-secondary reset-btn">
              <i class="bi bi-arrow-counterclockwise"></i>
              <span>حذف فیلترها</span>
            </button>
            <button @click="loadOrders" class="btn btn-outline-primary reset-btn">
              <i class="bi bi-arrow-clockwise"></i>
              <span>بروزرسانی</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- لیست -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!orders.length" class="text-center py-5 text-muted">
            <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
            <p>هیچ سفارش مشکل‌داری یافت نشد 🎉</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered align-middle text-center mb-0">
                <thead>
                  <tr>
                    <th style="width: 50px;">
                      <input type="checkbox" :checked="allSelected" @change="toggleAll"
                        :disabled="orders.length === 0" />
                    </th>
                    <th>#</th>
                    <th>کاربر</th>
                    <th>مبلغ کل</th>
                    <th>وضعیت سفارش</th>
                    <th>وضعیت پرداخت</th>
                    <th>درگاه</th>
                    <th>کد پیگیری</th>
                    <th>زمان سفارش</th>
                    <th>آخرین بروزرسانی</th>
                    <th style="width: 180px;">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in orders" :key="order.id"
                    :class="{ 'row-problem': order.problem_analysis?.problems?.length }">
                    <td>
                      <input type="checkbox" :value="order.id" v-model="selectedOrders" />
                    </td>
                    <td class="order-id">#{{ order.id }}</td>
                    <td>
                      <div class="user-cell">
                        <div class="user-name">{{ order.user?.full_name ?? "-" }}</div>
                        <div class="user-mobile">{{ order.user?.mobile ?? "-" }}</div>
                      </div>
                    </td>
                    <td class="order-amount">{{ Number(order.total).toLocaleString('fa-Ir') }} تومان</td>
                    <td>
                      <span class="badge" :class="statusBadge(order.status)">
                        {{ statusText(order.status) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="paymentStatusBadge(order.payment_status)">
                        {{ paymentStatusText(order.payment_status) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-info" v-if="order.problem_analysis?.latest_transaction">
                        {{ gatewayName(order.problem_analysis.latest_transaction.gateway) }}
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td @click="copyToClipboard(order.gateway_transactions[0].authority)" class="cursor-pointer">
                      <span>
                        {{ order.gateway_transactions.length ? order.gateway_transactions[0].authority : '-' }}

                      </span>
                      <i class="bi bi-copy"></i>

                    </td>
                    <td class="date-cell">{{ formatDate(order.created_at) }}</td>
                    <td class="date-cell">{{ formatDate(order.updated_at) }}</td>
                    <td>
                      <div class="d-flex flex-wrap gap-1 justify-content-center">
                        <router-link :to="`/orders/${order.id}`" class="btn btn-sm btn-info" title="مشاهده">
                          <i class="bi bi-eye"></i>
                        </router-link>

                        <button @click="singlePrint(order.id)" class="btn btn-sm btn-secondary" title="پرینت">
                          <i class="bi bi-printer"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ===== کارت موبایل ===== -->
            <div class="d-md-none order-cards">
              <div v-for="order in orders" :key="order.id" class="order-card"
                :class="{ 'selected-card': selectedOrders.includes(order.id), 'problem-card': order.problem_analysis?.problems?.length }">
                <div class="order-card-header">
                  <input type="checkbox" :value="order.id" v-model="selectedOrders" class="order-checkbox" />
                  <div class="order-icon problem-icon">
                    <i class="bi bi-exclamation-triangle"></i>
                  </div>
                  <div class="order-info">
                    <div class="order-name">
                      <i class="bi bi-person-circle"></i>
                      {{ order.user?.full_name ?? "نامشخص" }}
                    </div>
                    <div class="order-id">سفارش #{{ order.id }}</div>
                  </div>
                  <span class="badge" :class="statusBadge(order.status)">
                    {{ statusText(order.status) }}
                  </span>
                </div>

                <div class="order-card-body">
                  <div class="info-row">
                    <i class="bi bi-phone"></i>
                    <span class="info-label">موبایل:</span>
                    <span class="info-value">{{ order.user?.mobile ?? "-" }}</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-cash-coin"></i>
                    <span class="info-label">مبلغ:</span>
                    <span class="info-value amount-value">{{ Number(order.total).toLocaleString('fa-Ir') }} تومان</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-credit-card"></i>
                    <span class="info-label">پرداخت:</span>
                    <span class="badge" :class="paymentStatusBadge(order.payment_status)">
                      {{ paymentStatusText(order.payment_status) }}
                    </span>
                  </div>

                  <div class="info-row" v-if="order.problem_analysis?.latest_transaction">
                    <i class="bi bi-bank"></i>
                    <span class="info-label">درگاه:</span>
                    <span class="info-value">{{ gatewayName(order.problem_analysis.latest_transaction.gateway) }}</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-calendar-plus"></i>
                    <span class="info-label">سفارش:</span>
                    <span class="info-value date-value">{{ formatDate(order.created_at) }}</span>
                  </div>
              
                </div>

                <div class="order-card-actions">
                  <router-link :to="`/orders/${order.id}`" class="btn btn-sm btn-info flex-fill">
                    <i class="bi bi-eye"></i>
                    <span>مشاهده</span>
                  </router-link>
                  <button @click="recoverOrder(order)" class="btn btn-sm btn-warning flex-fill"
                    :disabled="recoveringId === order.id">
                    <span v-if="recoveringId === order.id" class="spinner-border spinner-border-sm"></span>
                    <template v-else>
                      <i class="bi bi-arrow-clockwise"></i>
                      <span>بازیابی</span>
                    </template>
                  </button>
                  <button @click="singlePrint(order.id)" class="btn btn-sm btn-secondary flex-fill">
                    <i class="bi bi-printer"></i>
                    <span>پرینت</span>
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
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { useAdmin } from '@/stores/modules/admin';

const router = useRouter();
const route = useRoute();
const store = useAdmin();
const checkPermission = store.checkPermission;
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
const orders = ref([]);
const stats = ref({});
const loading = ref(false);
const selectedOrders = ref([]);
const printType = ref('full');
const recoveringId = ref(null);

const filters = ref({
  type: "all",
  search: "",
  gateway: "",
  date_from: "",
  date_to: "",
});
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('✅ کپی شد:', text)
    return true;
  } catch (err) {
    console.error('❌ خطا در کپی:', err);
    return false;
  }
}

const allSelected = computed(() => {
  return orders.value.length > 0 &&
    orders.value.every(order => selectedOrders.value.includes(order.id));
});

const toggleAll = (event) => {
  if (event.target.checked) {
    selectedOrders.value = orders.value.map(order => order.id);
  } else {
    selectedOrders.value = [];
  }
};

const goToPrint = () => {
  if (selectedOrders.value.length === 0) {
    alert('لطفاً حداقل یک سفارش را انتخاب کنید.');
    return;
  }
  const route = router.resolve({
    path: '/orders/print',
    query: {
      ids: selectedOrders.value.join(','),
      type: printType.value
    }
  });
  window.open(route.href, '_blank');
};

const singlePrint = (orderId) => {
  router.push({
    path: '/orders/print',
    query: {
      ids: orderId.toString(),
      type: printType.value
    }
  });
};

// ===== URL Sync =====
const syncFiltersToUrl = () => {
  const query = {};
  Object.keys(filters.value).forEach(key => {
    if (filters.value[key] && filters.value[key] !== 'all') {
      query[key] = filters.value[key];
    }
  });
  router.replace({ query });
};

const loadFiltersFromUrl = () => {
  const q = route.query;
  filters.value.type = q.type || "all";
  filters.value.search = q.search || "";
  filters.value.gateway = q.gateway || "";
  filters.value.date_from = q.date_from || "";
  filters.value.date_to = q.date_to || "";
};

// ===== API =====
const loadOrders = async () => {
  loading.value = true;
  selectedOrders.value = [];
  try {
    const response = await axios.get("/orders-problematic", {
      params: filters.value,
    });
    orders.value = response.data.data || [];
    stats.value = response.data.stats || {};
    syncFiltersToUrl();
  } catch (e) {
    console.error("خطا در دریافت سفارش‌های مشکل‌دار", e);
    orders.value = [];
    stats.value = {};
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  loadOrders();
};

const resetFilters = () => {
  filters.value = {
    type: "all",
    search: "",
    gateway: "",
    date_from: "",
    date_to: "",
  };
  loadOrders();
};

const recoverOrder = async (order) => {
  if (!confirm(`آیا از بازیابی سفارش #${order.id} مطمئن هستید؟`)) {
    return;
  }
  recoveringId.value = order.id;
  try {
    await axios.post(`/orders/${order.id}/recover`);
    alert('سفارش با موفقیت بازیابی شد');
    loadOrders();
  } catch (e) {
    alert(e.response?.data?.message || 'خطا در بازیابی سفارش');
  } finally {
    recoveringId.value = null;
  }
};

// ===== Helpers =====
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString('fa-IR');
};

const gatewayName = (gateway) => {
  const map = {
    parsian: 'پارسیان',
    zarinpal: 'زرین‌پال',
    zibal: 'زیبال',
  };
  return map[gateway] ?? gateway;
};

const statusText = (status) => {
  const map = {
    pending: "در انتظار",
    reserved: "رزرو شده",
    processing: "در حال پردازش",
    paid: "پرداخت شده",
    shipped: "ارسال شده",
    completed: "تکمیل شده",
    failed: "لغو شده",
    cancelled: "لغو شده",
    canceled: "لغو شده",
    returned: "مرجوعی",
  };
  return map[status] ?? status;
};

const statusBadge = (status) => {
  const map = {
    pending: "bg-secondary",
    reserved: "bg-warning text-dark",
    processing: "bg-info",
    shipped: "bg-primary",
    completed: "bg-black",
    paid: "bg-success",
    failed: "bg-danger",
    cancelled: "bg-danger",
    canceled: "bg-danger",
    returned: "bg-dark",
  };
  return map[status] ?? "bg-secondary";
};

const paymentStatusText = (status) => {
  const map = {
    pending: "در انتظار پرداخت",
    paid: "پرداخت شده",
    failed: "ناموفق",
    refunded: "برگشت داده شده",
  };
  return map[status] ?? status;
};

const paymentStatusBadge = (status) => {
  const map = {
    pending: "bg-warning text-dark",
    paid: "bg-success",
    failed: "bg-danger",
    refunded: "bg-secondary",
  };
  return map[status] ?? "bg-secondary";
};

onMounted(() => {
  loadFiltersFromUrl();
  loadOrders();
});
</script>

<style scoped>
/* ===== هدر ===== */
.header-card .card-header {
  padding: 16px 20px 8px;
  background: transparent;
  border-bottom: none;
}

.header-card .card-body {
  padding: 8px 20px 16px;
}

.page-title {
  font-weight: 700;
  color: #2d3436;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  align-items: center;
}

.print-type-select {
  width: 100%;
  min-width: 180px;
  max-width: 260px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.82rem;
  transition: all 0.3s;
}

.print-type-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.print-bulk-btn,
.add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 10px;
  transition: all 0.3s;
}

.print-bulk-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
}

.print-bulk-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.add-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* ===== فیلترها ===== */
.search-input {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-select {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s;
}

.filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 10px;
  transition: all 0.3s;
}

.reset-btn:hover {
  transform: translateY(-2px);
}

.filter-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 4px;
  padding-right: 4px;
}

/* ===== کارت آماری ===== */
.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.bg-danger-soft {
  background: #fee2e2;
  color: #dc2626;
}

.bg-warning-soft {
  background: #fef3c7;
  color: #d97706;
}

.bg-secondary-soft {
  background: #f3f4f6;
  color: #4b5563;
}

.bg-success-soft {
  background: #d1fae5;
  color: #059669;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.72rem;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3436;
  line-height: 1.2;
}

.stat-value.small-value {
  font-size: 1rem;
}

.stat-value small {
  font-size: 0.7rem;
  color: #6c757d;
  font-weight: 500;
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
  font-size: 0.82rem;
}

.table tbody td {
  vertical-align: middle;
  font-size: 0.82rem;
}

.order-id {
  font-weight: 700;
  color: #6c757d;
}

.order-amount {
  font-weight: 700;
  color: #16a34a;
  white-space: nowrap;
}

.date-cell {
  font-size: 0.78rem;
  color: #6c757d;
  white-space: nowrap;
}

.user-cell {
  text-align: right;
}

.user-name {
  font-weight: 600;
  color: #2d3436;
  font-size: 0.82rem;
}

.user-mobile {
  font-size: 0.72rem;
  color: #6c757d;
  direction: ltr;
  text-align: right;
  margin-top: 2px;
}

.problems-cell {
  text-align: right;
}

.problem-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 6px;
  margin: 2px 2px 2px 0;
  font-weight: 500;
  white-space: nowrap;
}

.problem-tag i {
  font-size: 0.65rem;
}

.row-problem {
  background: #fffbfb !important;
}

.row-problem:hover {
  background: #fff5f5 !important;
}

/* چک‌باکس */
.orders-page input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
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
  transition: all 0.2s;
  position: relative;
}

.order-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.order-card.selected-card {
  border-color: #667eea;
  background: #f8f9ff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.order-card.problem-card {
  border-right: 4px solid #dc3545;
}

.order-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.order-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.order-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.order-icon.problem-icon {
  background: linear-gradient(135deg, #f97316, #dc2626);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
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
  color: #667eea;
  flex-shrink: 0;
}

.order-id {
  font-size: 0.7rem;
  color: #6c757d;
  margin-top: 3px;
  font-weight: 600;
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

.info-row>i {
  color: #667eea;
  font-size: 0.9rem;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.info-label {
  color: #6c757d;
  font-weight: 500;
  flex-shrink: 0;
}

.info-value {
  color: #2d3436;
  font-weight: 600;
  margin-right: auto;
  word-break: break-word;
  text-align: left;
}

.amount-value {
  color: #16a34a;
  background: #f0fdf4;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
}

.date-value {
  font-size: 0.78rem;
  color: #6c757d;
  font-weight: 500;
}

.problems-mobile {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e9ecef;
}

.problems-title {
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: 700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
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

/* ===== رنگ مشکی ===== */
.bg-black {
  background-color: #000 !important;
  color: #fff !important;
}

/* ========================================= */
/* ===== تبلت ===== */
/* ========================================= */
@media (max-width: 991.98px) {
  .header-actions {
    width: 100%;
  }

  .print-type-select {
    max-width: 100%;
    flex: 1;
  }
}

/* ========================================= */
/* ===== موبایل ===== */
/* ========================================= */
@media (max-width: 767.98px) {
  .header-card .card-header {
    padding: 12px 14px 6px;
  }

  .header-card .card-body {
    padding: 6px 14px 14px;
  }

  .page-title {
    font-size: 1.15rem;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .print-type-select {
    max-width: 100%;
    width: 100%;
  }

  .print-bulk-btn,
  .add-btn {
    width: 100%;
  }

  .filter-actions {
    width: 100%;
  }

  .filter-btn,
  .reset-btn {
    flex: 1;
    width: 100%;
  }
}

@media (max-width: 399.98px) {
  .page-title {
    font-size: 1rem;
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

  .stat-value {
    font-size: 1rem;
  }
}

@media (min-width: 768px) {
  .order-cards {
    display: none;
  }
}
</style>