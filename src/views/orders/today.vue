<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 orders-page" v-if="checkPermission(['order_today'])">

    <!-- هدر و فیلترها -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div
          class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
          <h3 class="mb-0 page-title">
            <i class="bi bi-list-check"></i>
            <span>مدیریت سفارش‌ها {{ orders ? ` - تعداد سفارشات : ${orders.length}` : '' }}</span>
          </h3>

          <div class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 header-actions">
            <button v-if="selectedOrders.length > 0" @click="bulkComplete" class="btn btn-warning bulk-complete-btn"
              :disabled="bulkCompleting">
              <span v-if="bulkCompleting" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-check2-circle"></i>
              <span>تکمیل ({{ selectedOrders.length }})</span>
            </button>
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

            <router-link to="/orders/create" class="btn btn-primary add-btn">
              <i class="bi bi-plus"></i>
              <span>افزودن سفارش</span>
            </router-link>
          </div>
        </div>
      </div>

      <div class="card-body p-2 p-md-3">
        <div class="row g-2">
          <div class="col-12 col-sm-6 col-md-3">
            <input v-model="filters.search" @input="getOrders" type="text" class="form-control search-input"
              placeholder="جستجو (کاربر یا شماره سفارش)" />
          </div>
          <div class="col-12 col-sm-6 col-md-2">
            <select v-model="filters.payment_method" @change="getOrders" class="form-select">
              <option value="">همه روش های پرداخت</option>
              <option value="online">پرداخت آنلاین</option>
              <option value="wallet">کیف پول</option>
              <option value="cod">پرداخت در محل</option>
            </select>
          </div>
          <div class="col-12 col-sm-6 col-md-2">
            <select v-model="filters.shipping_id" @change="getOrders" class="form-select">
              <option value="">همه روش های ارسال</option>
              <option value="2">پیک موتوری</option>
              <option value="3">تحویل حضوری</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- لیست سفارش‌ها -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!orders || orders.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>هیچ سفارشی یافت نشد</p>
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
                    <th>آدرس</th>
                    <th>روش ارسال</th>
                    <th>مبلغ کل</th>
                    <th>وضعیت سفارش</th>
                    <th>وضعیت پرداخت</th>
                    <th>روش پرداخت</th>
                    <th>زمان پرداخت</th>
                    <th>درگاه پرداخت</th>
                    <th style="width: 120px;">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in orders" :key="order.id">
                    <td>
                      <input type="checkbox" :value="order.id" v-model="selectedOrders" />
                    </td>
                    <td class="order-id">#{{ order.id }}</td>
                    <td>{{ order.user?.full_name ?? "-" }}</td>
                    <td class="address-cell">{{ order.address?.address_line ?? "-" }}</td>
                    <td>{{ order.shipping?.title ?? "-" }}</td>
                    <td class="order-amount">{{ Number(order.total).toLocaleString('fa-IR') }} تومان</td>
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
                    <td>{{ paymentMethodText(order.payment_method) }}</td>
                    <td>{{ new Date(order.updated_at).toLocaleDateString('fa') }}</td>
                    <td>{{
                      order.gateway_transactions && order.gateway_transactions.length ?
                        findGateWayName(order.gateway_transactions) : '-' }}</td>


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
                :class="{ 'selected-card': selectedOrders.includes(order.id) }">
                <div class="order-card-header">
                  <input type="checkbox" :value="order.id" v-model="selectedOrders" class="order-checkbox" />
                  <div class="order-icon">
                    <i class="bi bi-receipt"></i>
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
                    <i class="bi bi-geo-alt-fill"></i>
                    <span class="info-label">آدرس:</span>
                    <span class="info-value address-value">{{ order.address?.address_line ?? "-" }}</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-truck"></i>
                    <span class="info-label">ارسال:</span>
                    <span class="info-value">{{ order.shipping?.title ?? "-" }}</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-cash-coin"></i>
                    <span class="info-label">مبلغ:</span>
                    <span class="info-value amount-value">{{ Number(order.total).toLocaleString('fa-IR') }} تومان</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-credit-card"></i>
                    <span class="info-label">پرداخت:</span>
                    <span class="badge" :class="paymentStatusBadge(order.payment_status)">
                      {{ paymentStatusText(order.payment_status) }}
                    </span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-wallet2"></i>
                    <span class="info-label">روش:</span>
                    <span class="info-value">{{ paymentMethodText(order.payment_method) }}</span>
                  </div>
                </div>

                <div class="order-card-actions">
                  <router-link :to="`/orders/${order.id}`" class="btn btn-sm btn-info flex-fill">
                    <i class="bi bi-eye"></i>
                    <span>مشاهده</span>
                  </router-link>
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
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAdmin } from '@/stores/modules/admin';
import Swal from "sweetalert2";

const bulkCompleting = ref(false);

const bulkComplete = async () => {
  if (selectedOrders.value.length === 0) return;

  const count = selectedOrders.value.length;
  const result = await Swal.fire({
    title: 'تایید تکمیل سفارش‌ها',
    html: `آیا از تکمیل کردن <b>${count}</b> سفارش انتخاب شده مطمئن هستید؟`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'بله، تکمیل کن',
    cancelButtonText: 'انصراف',
    confirmButtonColor: '#f59e0b',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  bulkCompleting.value = true;
  try {
    const { data } = await axios.post('/orders-bulk-complete', {
      ids: selectedOrders.value,
    });

    Swal.fire({
      icon: 'success',
      title: 'انجام شد',
      text: data.message ?? 'سفارش‌ها با موفقیت تکمیل شدند.',
      timer: 1800,
      showConfirmButton: false,
    });

    selectedOrders.value = [];
    getOrders();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'خطا',
      text: error.response?.data?.message ?? 'عملیات با خطا مواجه شد.',
    });
  } finally {
    bulkCompleting.value = false;
  }
};
const router = useRouter();
const store = useAdmin();
const checkPermission = store.checkPermission;

const orders = ref([]);
const loading = ref(false);
const selectedOrders = ref([]);
const printType = ref('full');

const filters = ref({
  search: "",
  status: "",
  payment_status: "",
  payment_method: "",
  shipping_id:"",
});
const currentPage = ref(1);
let abortController = null;

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

const getOrders = async (page = 1) => {
  loading.value = true;
  selectedOrders.value = [];

  if (abortController) {
    abortController.abort();
  }

  abortController = new AbortController();

  try {
    const response = await axios.get("/orders-todays-orders", {
      params: {
        ...filters.value,
      },
      signal: abortController.signal,
    });
    orders.value = response.data.data;
    currentPage.value = page;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error fetching orders:', error);
    }
  } finally {
    loading.value = false;
  }
};

const statusText = (status) => {
  const map = {
    pending: "در انتظار",
    reserved: "رزرو شده",
    processing: "در حال پردازش",
    paid: "پرداخت  شده",
    shipped: "ارسال شده",
    completed: "تکمیل شده",
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
    paid: "bg-success",
    completed: "bg-success",
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

const paymentMethodText = (method) => {
  const map = {
    online: "پرداخت آنلاین",
    wallet: "کیف پول",
    cod: "پرداخت در محل",
  };
  return map[method] ?? method;
};
function findGateWayName(gateway_transactions) {
  let names = {
    parsian: 'پارسیان',
    zarinpal: 'زرین پال',
  }
  if (gateway_transactions.length == 1)
    return names[gateway_transactions[0].gateway]
  let finded = gateway_transactions.find(i => i.status == "paid")
  if (finded)
    return names[finded.gateway]
  return "-"
}
onMounted(() => {
  getOrders();
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

.order-id {
  font-weight: 700;
  color: #6c757d;
}

.address-cell {
  max-width: 200px;
  font-size: 0.8rem;
  color: #6c757d;
  word-break: break-word;
  text-align: right;
}

.order-amount {
  font-weight: 700;
  color: #16a34a;
  white-space: nowrap;
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

.address-value {
  font-size: 0.78rem;
  color: #6c757d;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

/* ========================================= */
/* ===== تبلت (کمتر از 992px) ===== */
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
/* ===== موبایل (کمتر از 768px) ===== */
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
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
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
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .order-cards {
    display: none;
  }
}

.bulk-complete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  transition: all 0.3s;
}

.bulk-complete-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.bulk-complete-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 767.98px) {
  .bulk-complete-btn {
    width: 100%;
  }
}
</style>