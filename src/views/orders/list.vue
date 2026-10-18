<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 orders-page" v-if="checkPermission(['order_view'])">

    <!-- هدر و فیلترها -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div
          class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
          <h3 class="mb-0 page-title">
            <i class="bi bi-list-check"></i>
            <span>مدیریت سفارش‌ها</span>
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

            <router-link to="/orders/create" class="btn btn-primary add-btn">
              <i class="bi bi-plus"></i>
              <span>افزودن سفارش</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- فیلترها -->
      <div class="card-body p-2 p-md-3">
        <div class="row g-2">

          <!-- سرچ عمومی -->
          <div class="col-12 col-sm-6 col-md-3">
            <label class="filter-label">جستجو (کاربر / موبایل / شماره سفارش)</label>
            <input v-model="filters.search" @keyup.enter="applyFilters" type="text" class="form-control search-input"
              placeholder="نام، موبایل یا شماره سفارش" />
          </div>

          <!-- سرچ آیتم سفارش -->
          <div class="col-12 col-sm-6 col-md-3">
            <label class="filter-label">جستجوی آیتم سفارش</label>
            <input v-model="filters.item_search" @keyup.enter="applyFilters" type="text"
              class="form-control search-input" placeholder="نام محصول، کد یا SKU" />
          </div>

          <!-- استان -->
          <div class="col-6 col-sm-3 col-md-2">
            <label class="filter-label">استان</label>
            <select v-model="filters.province_id" @change="onProvinceChange" class="form-select">
              <option value="">همه استان‌ها</option>
              <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <!-- سرچ شهر (فقط وقتی استان انتخاب نشده) -->
          <div v-if="!filters.province_id" class="col-6 col-sm-3 col-md-2 position-relative">
            <label class="filter-label">جستجوی شهر</label>
            <input v-model="citySearch" @input="onCitySearch" @focus="showCityResults = true" type="text"
              class="form-control search-input" placeholder="نام شهر..." />
            <!-- نتایج سرچ -->
            <div v-if="showCityResults && searchedCities.length" class="city-results">
              <div v-for="c in searchedCities" :key="c.id" class="city-result-item" @click="selectCity(c)">
                {{ c.name }}
                <small v-if="c.province">- {{ c.province.name }}</small>
              </div>
            </div>
          </div>

          <!-- شهر (وقتی استان انتخاب شده) -->
          <div v-if="filters.province_id" class="col-6 col-sm-3 col-md-2">
            <label class="filter-label">شهر</label>
            <select v-model="filters.city_id" class="form-select">
              <option value="">همه شهرها</option>
              <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- نمایش شهر انتخاب‌شده وقتی استان انتخاب نشده -->
          <div v-if="!filters.province_id && filters.city_id" class="col-6 col-sm-3 col-md-2">
            <label class="filter-label">شهر انتخاب‌شده</label>
            <div class="selected-city-box">
              <span>{{ selectedCityName }}</span>
              <button type="button" class="btn-clear-city" @click="clearCity">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>

          <!-- وضعیت سفارش -->
          <div class="col-6 col-sm-3 col-md-2">
            <label class="filter-label">وضعیت سفارش</label>
            <select v-model="filters.status" class="form-select">
              <option value="">همه وضعیت‌ها</option>
              <option value="pending">در انتظار</option>
              <option value="reserved">رزرو شده</option>
              <option value="processing">در حال پردازش</option>
              <option value="shipped">ارسال شده</option>
              <option value="paid">پرداخت شده</option>
              <option value="completed">تکمیل شده</option>
              <option value="failed">لغو شده</option>
              <option value="returned">مرجوعی</option>
              <option value="card_transfer_pending">در انتظار آپلود رسید</option>
              <option value="card_transfer_review">در حال پردازش رسید</option>
              <option value="card_transfer_send_again">در انتظار آپلود مجدد رسید</option>
            </select>
          </div>

          <!-- وضعیت پرداخت -->
          <div class="col-6 col-sm-3 col-md-2">
            <label class="filter-label">وضعیت پرداخت</label>
            <select v-model="filters.payment_status" class="form-select">
              <option value="">همه پرداخت‌ها</option>
              <option value="pending">در انتظار پرداخت</option>
              <option value="paid">پرداخت شده</option>
              <option value="failed">ناموفق</option>
              <option value="refunded">برگشت داده شده</option>
            </select>
          </div>

          <!-- روش پرداخت -->
          <div class="col-6 col-sm-3 col-md-2">
            <label class="filter-label">روش پرداخت</label>
            <select v-model="filters.payment_method" class="form-select">
              <option value="">روش پرداخت</option>
              <option value="online">پرداخت آنلاین</option>
              <option value="wallet">کیف پول</option>
              <option value="card_transfer">کارت به کارت</option>
              
              <option value="cod">پرداخت در محل</option>
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
          <div v-if="!orders.data || orders.data.length === 0" class="text-center py-5 text-muted">
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
                        :disabled="orders.data.length === 0" />
                    </th>
                    <th>#</th>
                    <th>کاربر</th>
                    <th>آدرس</th>
                    <th>روش ارسال</th>
                    <th>مبلغ کل</th>
                    <th>وضعیت سفارش</th>
                    <th>وضعیت پرداخت</th>
                    <th>روش پرداخت</th>
                    <th> دگاه پرداخت</th>

                    <th>زمان سفارش</th>
                    <th>زمان بروزرسانی</th>
                    <th style="width: 120px;">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in orders.data" :key="order.id">
                    <td>
                      <input type="checkbox" :value="order.id" v-model="selectedOrders" />
                    </td>
                    <td class="order-id">#{{ order.id }}</td>
                    <td>{{ order.user?.full_name ?? "-" }}</td>
                    <td class="address-cell">{{ order.address?.address_line ?? "-" }}</td>
                    <td>{{ order.shipping?.title ?? "-" }}</td>
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
                    <td>{{ paymentMethodText(order.payment_method) }}</td>
                    <td>{{
                      order.gateway_transactions && order.gateway_transactions.length ?
                        findGateWayName(order.gateway_transactions) : ""
                    }}</td>

                    <td class="date-cell">{{ new Date(order.created_at).toLocaleString('fa') }}</td>
                    <td class="date-cell">{{ new Date(order.updated_at).toLocaleDateString('fa') }}</td>

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
              <div v-for="order in orders.data" :key="order.id" class="order-card"
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
                    <span class="info-value amount-value">{{ Number(order.total).toLocaleString('fa-Ir') }} تومان</span>
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

                  <div class="info-row">
                    <i class="bi bi-calendar-plus"></i>
                    <span class="info-label">سفارش:</span>
                    <span class="info-value date-value">{{ new Date(order.created_at).toLocaleDateString('fa') }}</span>
                  </div>

                  <div class="info-row">
                    <i class="bi bi-arrow-repeat"></i>
                    <span class="info-label">بروزرسانی:</span>
                    <span class="info-value date-value">{{ new Date(order.updated_at).toLocaleDateString('fa') }}</span>
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

    <!-- Pagination -->
    <b-pagination v-model="currentPage" :total-rows="orders.total" v-if="orders.last_page != 1"
      :per-page="orders.per_page" @Update:modelValue="changePage" align="center"
      class="mt-3 pagination-responsive"></b-pagination>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { useAdmin } from '@/stores/modules/admin';

const router = useRouter();
const route = useRoute();
const store = useAdmin();
const checkPermission = store.checkPermission;

const orders = ref({ data: [] });
const loading = ref(false);
const selectedOrders = ref([]);
const printType = ref('full');

// استان و شهر
const provinces = ref([]);
const cities = ref([]);            // شهرهای استان انتخاب‌شده
const searchedCities = ref([]);    // نتایج سرچ شهر (وقتی استان انتخاب نشده)
const citySearch = ref("");
const showCityResults = ref(false);
let citySearchTimeout = null;

function findGateWayName(gateway_transactions) {
  let names = {
    parsian: 'پارسیان',
    zarinpal: 'زرین پال',
  }
  let finded = gateway_transactions.find(i => i.status == "paid")
  if (finded)
    return names[finded.gateway]
  return "-"
}

const filters = ref({
  search: "",
  item_search: "",
  province_id: "",
  city_id: "",
  status: "",
  payment_status: "",
  payment_method: "",
  date_from: "",
  date_to: "",
});
const currentPage = ref(1);

// نام شهر انتخاب‌شده برای نمایش
const selectedCityName = computed(() => {
  if (!filters.value.city_id) return "";
  const found = searchedCities.value.find(c => c.id == filters.value.city_id);
  return found ? found.name : "";
});

const allSelected = computed(() => {
  return orders.value.data.length > 0 &&
    orders.value.data.every(order => selectedOrders.value.includes(order.id));
});

const toggleAll = (event) => {
  if (event.target.checked) {
    selectedOrders.value = orders.value.data.map(order => order.id);
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

let abortController = null;

// ===== استان‌ها و شهرها =====
const getProvinces = async () => {
  try {
    const response = await axios.get("/provinces");
    provinces.value = response.data.data?.data || response.data.data || response.data;
  } catch (e) {
    console.error("خطا در دریافت استان‌ها", e);
  }
};

// دریافت شهرهای یک استان (وقتی استان انتخاب شده)
const getCitiesByProvince = async (provinceId) => {
  if (!provinceId) {
    cities.value = [];
    return;
  }
  try {
    const response = await axios.get("/cities", {
      params: {
        province_id: provinceId,
        per_page: 100,
      },
    });
    cities.value = response.data.data?.data || response.data.data || [];
  } catch (e) {
    console.error("خطا در دریافت شهرها", e);
  }
};

// سرچ شهر در همه استان‌ها (وقتی استان انتخاب نشده)
const searchCities = async (search) => {
  if (!search || search.length < 2) {
    searchedCities.value = [];
    return;
  }
  try {
    const response = await axios.get("/cities", {
      params: {
        search: search,
        per_page: 30,
      },
    });
    searchedCities.value = response.data.data?.data || response.data.data || [];
  } catch (e) {
    console.error("خطا در سرچ شهرها", e);
  }
};

// Debounce سرچ شهر
const onCitySearch = () => {
  if (citySearchTimeout) clearTimeout(citySearchTimeout);
  citySearchTimeout = setTimeout(() => {
    searchCities(citySearch.value);
  }, 400);
};

// انتخاب یک شهر از نتایج سرچ
const selectCity = (city) => {
  filters.value.city_id = city.id;
  citySearch.value = city.name;
  showCityResults.value = false;
};

// پاک کردن شهر انتخاب‌شده
const clearCity = () => {
  filters.value.city_id = "";
  citySearch.value = "";
  searchedCities.value = [];
};

// با تغییر استان
const onProvinceChange = () => {
  filters.value.city_id = "";
  citySearch.value = "";
  searchedCities.value = [];
  cities.value = [];
  if (filters.value.province_id) {
    getCitiesByProvince(filters.value.province_id);
  }
};

// بستن نتایج سرچ وقتی کاربر جای دیگری کلیک می‌کند
const handleClickOutside = (e) => {
  if (!e.target.closest('.position-relative')) {
    showCityResults.value = false;
  }
};

// ===== URL =====
const syncFiltersToUrl = () => {
  const query = {};
  Object.keys(filters.value).forEach(key => {
    if (filters.value[key]) {
      query[key] = filters.value[key];
    }
  });
  if (currentPage.value > 1) {
    query.page = currentPage.value;
  }
  router.replace({ query });
};

const loadFiltersFromUrl = () => {
  const q = route.query;
  filters.value.search = q.search || "";
  filters.value.item_search = q.item_search || "";
  filters.value.province_id = q.province_id || "";
  filters.value.city_id = q.city_id || "";
  filters.value.status = q.status || "";
  filters.value.payment_status = q.payment_status || "";
  filters.value.payment_method = q.payment_method || "";
  filters.value.date_from = q.date_from || "";
  filters.value.date_to = q.date_to || "";
  currentPage.value = q.page ? parseInt(q.page) : 1;
};

const getOrders = async (page = 1) => {
  loading.value = true;

  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  selectedOrders.value = [];
  try {
    const response = await axios.get("/orders", {
      params: {
        page,
        ...filters.value,
      },
      signal: abortController.signal,
    });
    orders.value = response.data.data;
    currentPage.value = page;
    syncFiltersToUrl();
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  getOrders(1);
};

const resetFilters = () => {
  filters.value = {
    search: "",
    item_search: "",
    province_id: "",
    city_id: "",
    status: "",
    payment_status: "",
    payment_method: "",
    date_from: "",
    date_to: "",
  };
  cities.value = [];
  searchedCities.value = [];
  citySearch.value = "";
  getOrders(1);
};

const changePage = (page) => {
  if (page) getOrders(page);
};

const statusText = (status) => {
  const map = {
    pending: "در انتظار",
    reserved: "رزرو شده",
    processing: "در حال پردازش",
    paid: "پرداخت شده",
    shipped: "ارسال شده",
    completed: "تکمیل شده",
    card_transfer_pending: "در انتظار آپلود رسید",
    card_transfer_review: "در حال پردازش رسید",
    card_transfer_send_again: "در انتظار آپلود مجدد رسید",
    failed: "لغو شده",
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
    card_transfer: "کارت به کارت",
    cod: "پرداخت در محل",
  };
  return map[method] ?? method;
};

onMounted(async () => {
  await getProvinces();
  loadFiltersFromUrl();

  // اگر استان در URL بود، شهرهاش لود شوند
  if (filters.value.province_id) {
    await getCitiesByProvince(filters.value.province_id);
  }

  // اگر شهر انتخاب شده بود ولی استان نبود، برای نمایش اسمش سرچ کن
  if (filters.value.city_id && !filters.value.province_id) {
    try {
      const resp = await axios.get("/cities", {
        params: { search: filters.value.city_id, per_page: 1 },
      });
      const list = resp.data.data?.data || resp.data.data || [];
      const found = list.find(c => c.id == filters.value.city_id);
      if (found) {
        citySearch.value = found.name;
        searchedCities.value = [found];
      }
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('click', handleClickOutside);
  getOrders(currentPage.value);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
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

.address-cell {
  max-width: 200px;
  font-size: 0.78rem;
  color: #6c757d;
  word-break: break-word;
  text-align: right;
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

.date-value {
  font-size: 0.78rem;
  color: #6c757d;
  font-weight: 500;
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

/* ===== رنگ مشکی برای وضعیت completed ===== */
.bg-black {
  background-color: #000 !important;
  color: #fff !important;
}

/* ===== لیبل فیلترها ===== */
.filter-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 4px;
  padding-right: 4px;
}

/* ===== نتایج سرچ شهر ===== */
.city-results {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  max-height: 220px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
}

.city-result-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}

.city-result-item:last-child {
  border-bottom: none;
}

.city-result-item:hover {
  background: #f8f9ff;
  color: #667eea;
}

.city-result-item small {
  color: #6c757d;
  font-size: 0.72rem;
}

/* ===== باکس شهر انتخاب‌شده ===== */
.selected-city-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9ff;
  border: 1px solid #667eea;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.82rem;
  color: #2d3436;
  font-weight: 600;
  min-height: 44px;
}

.btn-clear-city {
  background: transparent;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
}

.btn-clear-city:hover {
  color: #a71d2a;
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

  .filter-actions {
    width: 100%;
  }

  .filter-btn,
  .reset-btn {
    flex: 1;
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
</style>