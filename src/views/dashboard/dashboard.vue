<template>
    <b-container fluid class="dashboard-container py-3 py-md-4" v-if="checkPermission(['dashboard_view'])">
        <!-- هدر داشبورد -->
        <div class="dashboard-header mb-3 mb-md-4">
            <h2 class="dashboard-title mb-1">📊 داشبورد مدیریت</h2>
            <small class="dashboard-time">آخرین به‌روزرسانی: {{ currentTime }}</small>
        </div>

        <!-- کارت‌های آماری اصلی -->
        <b-row class="main-stats-row mb-3 mb-md-4">
            <b-col
                cols="12"
                xs="12"
                sm="6"
                md="6"
                lg="3"
                class="mb-2 mb-md-3"
                v-for="stat in mainStats"
                :key="stat.label"
            >
                <div class="stat-card" :class="stat.color">
                    <div class="stat-icon">
                        <i :class="stat.icon"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">{{ stat.value }}</div>
                        <div class="stat-label">{{ stat.label }}</div>
                    </div>
                </div>
            </b-col>
        </b-row>

        <!-- ردیف اول: سفارش‌ها و محصولات -->
        <b-row class="content-row">
            <!-- سفارش‌ها -->
            <b-col cols="12" lg="6" class="mb-3 mb-md-4">
                <div class="dashboard-card h-100">
                    <div class="dashboard-card-header">
                        <h5 class="card-title mb-0">📦 سفارش‌ها</h5>
                        <span class="badge bg-primary">{{ dashboard.orders.total_orders }} سفارش</span>
                    </div>

                    <div class="dashboard-card-body">
                        <div class="stats-grid">
                            <div
                                v-for="(value, key) in orderStats"
                                :key="key"
                                class="stat-item"
                            >
                                <div class="stat-item-label">{{ orderLabels[key] }}</div>
                                <div class="stat-item-value">{{ formatNumber(value) }}</div>
                            </div>
                        </div>

                        <div class="chart-wrapper">
                            <ApexChart
                                type="line"
                                height="220"
                                :options="orderChartOptions"
                                :series="orderSeries"
                            />
                        </div>
                    </div>
                </div>
            </b-col>

            <!-- محصولات -->
            <b-col cols="12" lg="6" class="mb-3 mb-md-4">
                <div class="dashboard-card h-100">
                    <div class="dashboard-card-header">
                        <h5 class="card-title mb-0">🛒 محصولات</h5>
                        <span class="badge bg-success">{{ dashboard.products.total_products }} محصول</span>
                    </div>

                    <div class="dashboard-card-body">
                        <div class="stats-grid">
                            <div
                                v-for="(value, key) in productStats"
                                :key="key"
                                class="stat-item"
                            >
                                <div class="stat-item-label">{{ productLabels[key] }}</div>
                                <div class="stat-item-value">{{ formatNumber(value) }}</div>
                            </div>
                        </div>

                        <div class="chart-wrapper">
                            <ApexChart
                                type="pie"
                                height="220"
                                :options="productChartOptions"
                                :series="productSeries"
                            />
                        </div>
                    </div>
                </div>
            </b-col>
        </b-row>

        <!-- ردیف دوم: کاربران و دیدگاه‌ها -->
        <b-row class="content-row">
            <!-- کاربران -->
            <b-col cols="12" lg="6" class="mb-3 mb-md-4">
                <div class="dashboard-card h-100">
                    <div class="dashboard-card-header">
                        <h5 class="card-title mb-0">👤 کاربران</h5>
                        <span class="badge bg-info">{{ dashboard.users.total_users }} کاربر</span>
                    </div>

                    <div class="dashboard-card-body">
                        <div class="stats-grid">
                            <div
                                v-for="(value, key) in userStats"
                                :key="key"
                                class="stat-item"
                            >
                                <div class="stat-item-label">{{ userLabels[key] }}</div>
                                <div class="stat-item-value">{{ formatNumber(value) }}</div>
                            </div>
                        </div>

                        <div class="chart-wrapper">
                            <ApexChart
                                type="donut"
                                height="220"
                                :options="userChartOptions"
                                :series="userSeries"
                            />
                        </div>
                    </div>
                </div>
            </b-col>

            <!-- دیدگاه‌ها -->
            <b-col cols="12" lg="6" class="mb-3 mb-md-4">
                <div class="dashboard-card h-100">
                    <div class="dashboard-card-header">
                        <h5 class="card-title mb-0">💬 دیدگاه‌ها</h5>
                        <span class="badge bg-warning">{{ dashboard.comments.total_comments }} دیدگاه</span>
                    </div>

                    <div class="dashboard-card-body">
                        <div class="stats-grid">
                            <div
                                v-for="(value, key) in commentStats"
                                :key="key"
                                class="stat-item"
                            >
                                <div class="stat-item-label">{{ commentLabels[key] }}</div>
                                <div class="stat-item-value">{{ formatNumber(value) }}</div>
                            </div>
                        </div>

                        <div class="chart-wrapper">
                            <ApexChart
                                type="bar"
                                height="220"
                                :options="commentChartOptions"
                                :series="commentSeries"
                            />
                        </div>
                    </div>
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import ApexChart from "vue3-apexcharts";
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;

const dashboard = ref({
    orders: {},
    products: {},
    users: {},
    comments: {},
});

const currentTime = ref("");

// برچسب‌ها فارسی
const orderLabels = {
    total_orders: "کل سفارش‌ها",
    total_sales: "فروش کل",
    today_orders: "امروز",
    month_orders: "این ماه",
    average_order_value: "میانگین",
    max_order_value: "بیشترین",
    min_order_value: "کمترین",
};

const productLabels = {
    total_products: "کل محصولات",
    active_products: "فعال",
    inactive_products: "غیرفعال",
    out_of_stock: "ناموجود",
    average_price: "میانگین قیمت",
    max_price: "بیشترین قیمت",
    min_price: "کمترین قیمت",
};

const userLabels = {
    total_users: "کل کاربران",
    with_addresses: "با آدرس",
    with_wallet: "کیف پول دارد",
    without_wallet: "بدون کیف پول",
    today_registered: "ثبت‌نام امروز",
};

const commentLabels = {
    total_comments: "کل دیدگاه‌ها",
    approved: "تأیید شده",
    pending: "در انتظار",
    rejected: "رد شده",
    with_rating: "با امتیاز",
    average_rating: "میانگین امتیاز",
    today_comments: "امروز",
    this_month: "این ماه",
};

// محاسبه آمارها
const orderStats = computed(() => {
    const o = dashboard.value.orders;
    return {
        total_orders: o.total_orders || 0,
        total_sales: o.total_sales || 0,
        today_orders: o.today_orders || 0,
        month_orders: o.month_orders || 0,
        average_order_value: o.average_order_value || 0,
        max_order_value: o.max_order_value || 0,
        min_order_value: o.min_order_value || 0,
    };
});

const productStats = computed(() => {
    const p = dashboard.value.products;
    return {
        total_products: p.total_products || 0,
        active_products: p.active_products || 0,
        inactive_products: p.inactive_products || 0,
        out_of_stock: p.out_of_stock || 0,
        average_price: p.average_price || 0,
        max_price: p.max_price || 0,
        min_price: p.min_price || 0,
    };
});

const userStats = computed(() => {
    const u = dashboard.value.users;
    return {
        total_users: u.total_users || 0,
        with_addresses: u.with_addresses || 0,
        with_wallet: u.with_wallet || 0,
        without_wallet: u.without_wallet || 0,
        today_registered: u.today_registered || 0,
    };
});

const commentStats = computed(() => {
    const c = dashboard.value.comments;
    return {
        total_comments: c.total_comments || 0,
        approved: c.approved || 0,
        pending: c.pending || 0,
        rejected: c.rejected || 0,
        with_rating: c.with_rating || 0,
        average_rating: c.average_rating || 0,
        today_comments: c.today_comments || 0,
        this_month: c.this_month || 0,
    };
});

// کارت‌های آماری اصلی
const mainStats = computed(() => [
    {
        label: "کل سفارش‌ها",
        value: formatNumber(dashboard.value.orders.total_orders),
        icon: "bi bi-bag",
        color: "stat-primary"
    },
    {
        label: "کل فروش",
        value: formatPrice(dashboard.value.orders.total_sales),
        icon: "bi bi-currency-dollar",
        color: "stat-success"
    },
    {
        label: "کل کاربران",
        value: formatNumber(dashboard.value.users.total_users),
        icon: "bi bi-people",
        color: "stat-info"
    },
    {
        label: "کل محصولات",
        value: formatNumber(dashboard.value.products.total_products),
        icon: "bi bi-box-seam",
        color: "stat-warning"
    },
]);

// نمودار سفارش‌ها
const orderSeries = ref([{ name: "سفارش‌ها", data: [] }]);
const orderChartOptions = ref({
    chart: {
        id: "orders",
        toolbar: { show: false },
        sparkline: { enabled: false }
    },
    xaxis: {
        categories: [],
        labels: { rotate: -45 }
    },
    yaxis: {
        labels: {
            formatter: (val) => val.toLocaleString()
        }
    },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#6c5ce7'],
    grid: { show: false },
    tooltip: {
        y: {
            formatter: (val) => val.toLocaleString()
        }
    }
});

// نمودار محصولات
const productSeries = ref([]);
const productChartOptions = ref({
    labels: ["فعال", "غیرفعال", "ناموجود"],
    colors: ['#00b894', '#fdcb6e', '#e17055'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: false }
});

// نمودار کاربران
const userSeries = ref([]);
const userChartOptions = ref({
    labels: ["دارای کیف پول", "بدون کیف پول"],
    colors: ['#0984e3', '#dfe6e9'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: false }
});

// نمودار دیدگاه‌ها
const commentSeries = ref([{ name: "دیدگاه‌ها", data: [] }]);
const commentChartOptions = ref({
    chart: {
        id: "comments",
        toolbar: { show: false }
    },
    xaxis: {
        categories: ["تأیید شده", "در انتظار", "رد شده"]
    },
    colors: ['#00b894', '#fdcb6e', '#e17055'],
    grid: { show: false },
    plotOptions: {
        bar: { borderRadius: 4 }
    }
});

// توابع کمکی
function formatNumber(value) {
    if (!value && value !== 0) return "0";
    return Number(value).toLocaleString('fa-IR');
}

function formatPrice(value) {
    if (!value && value !== 0) return "0";
    return Number(value).toLocaleString('fa-IR') + " تومان";
}

// دریافت داده از API
onMounted(async () => {
    try {
        const { data } = await axios.get("/dashboard");
        dashboard.value = data.data;

        const now = new Date();
        currentTime.value = now.toLocaleString('fa-IR');

        const monthlyData = dashboard.value.orders.monthly_daily_breakdown || [];
        const dates = monthlyData.map(item => item.date);
        const counts = monthlyData.map(item => item.count);
        const sales = monthlyData.map(item => Number(item.total_sales));

        orderSeries.value = [
            { name: "تعداد سفارش‌ها", data: counts },
            { name: "فروش (تومان)", data: sales }
        ];
        orderChartOptions.value.xaxis.categories = dates;

        productSeries.value = [
            dashboard.value.products.active_products || 0,
            dashboard.value.products.inactive_products || 0,
            dashboard.value.products.out_of_stock || 0,
        ];

        userSeries.value = [
            dashboard.value.users.with_wallet || 0,
            dashboard.value.users.without_wallet || 0,
        ];

        commentSeries.value[0].data = [
            dashboard.value.comments.approved || 0,
            dashboard.value.comments.pending || 0,
            dashboard.value.comments.rejected || 0,
        ];

    } catch (error) {
        console.error("خطا در دریافت داده‌های داشبورد:", error);
    }
});
</script>

<style scoped>
/* ===== کانتینر اصلی ===== */
.dashboard-container {
    max-width: 100%;
    overflow-x: hidden;
}

/* ===== هدر داشبورد ===== */
.dashboard-header {
    padding: 12px 0;
    border-bottom: 2px solid #f0f0f0;
}

.dashboard-title {
    font-weight: 700;
    color: #2d3436;
    font-size: 1.5rem;
    line-height: 1.3;
}

.dashboard-time {
    font-size: 0.8rem;
    color: #6c757d;
}

/* ===== کارت‌های آماری اصلی ===== */
.main-stats-row {
    margin-left: -6px;
    margin-right: -6px;
}

.main-stats-row > [class*="col-"] {
    padding-left: 6px;
    padding-right: 6px;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 14px;
    transition: all 0.3s ease;
    height: 100%;
    min-height: 90px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.stat-primary {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
}

.stat-success {
    background: linear-gradient(135deg, #00b894, #55efc4);
    color: white;
}

.stat-info {
    background: linear-gradient(135deg, #0984e3, #74b9ff);
    color: white;
}

.stat-warning {
    background: linear-gradient(135deg, #f39c12, #fdcb6e);
    color: white;
}

.stat-icon {
    width: 52px;
    height: 52px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-number {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.stat-label {
    font-size: 0.85rem;
    opacity: 0.95;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ===== کارت‌های داشبورد ===== */
.dashboard-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.dashboard-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.dashboard-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 16px 20px;
    border-bottom: 2px solid #f8f9fa;
}

.card-title {
    font-weight: 600;
    color: #2d3436;
    font-size: 1.1rem;
}

.dashboard-card-body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* ===== گرید آیتم‌های آماری ===== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
}

.stat-item {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
    transition: all 0.2s ease;
    min-width: 0;
}

.stat-item:hover {
    background: #e9ecef;
    transform: translateY(-2px);
}

.stat-item-label {
    font-size: 0.7rem;
    color: #6c757d;
    margin-bottom: 4px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.stat-item-value {
    font-size: 0.85rem;
    font-weight: 700;
    color: #2d3436;
    line-height: 1.3;
    word-break: break-word;
}

/* ===== محفظه نمودار ===== */
.chart-wrapper {
    margin-top: auto;
    overflow: hidden;
    width: 100%;
}

/* ===== Badge‌ها ===== */
.badge {
    font-size: 0.75rem;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 500;
    white-space: nowrap;
}

/* ========================================= */
/* ===== تبلت (کمتر از 992px) ===== */
/* ========================================= */
@media (max-width: 991.98px) {
    .stats-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
}

/* ========================================= */
/* ===== موبایل (کمتر از 768px) ===== */
/* ========================================= */
@media (max-width: 767.98px) {
    .dashboard-title {
        font-size: 1.15rem;
    }

    .dashboard-time {
        font-size: 0.7rem;
    }

    /* کارت‌های آماری اصلی - ۲ ستونه */
    .stat-card {
        padding: 12px;
        gap: 10px;
        border-radius: 12px;
        min-height: 76px;
    }

    .stat-icon {
        width: 42px;
        height: 42px;
        font-size: 20px;
        border-radius: 10px;
    }

    .stat-number {
        font-size: 1rem;
    }

    .stat-label {
        font-size: 0.72rem;
    }

    /* کارت‌های داشبورد */
    .dashboard-card {
        border-radius: 12px;
    }

    .dashboard-card-header {
        padding: 12px 14px;
    }

    .dashboard-card-body {
        padding: 14px;
    }

    .card-title {
        font-size: 0.95rem;
    }

    /* گرید آیتم‌ها */
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
        margin-bottom: 12px;
    }

    .stat-item {
        padding: 8px 6px;
        border-radius: 8px;
    }

    .stat-item-label {
        font-size: 0.68rem;
    }

    .stat-item-value {
        font-size: 0.8rem;
    }

    .badge {
        font-size: 0.7rem;
        padding: 4px 10px;
    }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
    .dashboard-container {
        padding-left: 8px !important;
        padding-right: 8px !important;
    }

    .dashboard-title {
        font-size: 1rem;
    }

    /* کارت‌های آماری اصلی - تک ستونه */
    .stat-card {
        padding: 10px;
        min-height: 68px;
    }

    .stat-icon {
        width: 36px;
        height: 36px;
        font-size: 16px;
    }

    .stat-number {
        font-size: 0.92rem;
    }

    .stat-label {
        font-size: 0.68rem;
    }

    .dashboard-card-header {
        padding: 10px 12px;
    }

    .dashboard-card-body {
        padding: 12px;
    }

    .card-title {
        font-size: 0.88rem;
    }

    .stat-item-label {
        font-size: 0.65rem;
    }

    .stat-item-value {
        font-size: 0.75rem;
    }
}
</style>