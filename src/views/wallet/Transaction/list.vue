<template>
    <div class="container wallets-page mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['wallet_view'])">

        <!-- فیلتر -->
        <div class="card mb-2 header-card">
            <div class="card-header">
                <div
                    class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-arrow-left-right"></i>
                        <span>مدیریت تراکنش‌ها</span>
                    </h3>
                </div>
            </div>
            <div class="card-body">
                <div class="row g-2">
                    <div class="col-12 col-md-8">
                        <input v-model="filters.search" @input="getTransactions" type="text"
                            class="form-control search-input"
                            placeholder="جستجو بر اساس نام کاربر یا شماره تماس" />
                    </div>
                    <div class="col-12 col-md-4">
                        <select v-model="filters.type" @change="getTransactions" class="form-select filter-select">
                            <option value="">همه انواع</option>
                            <option value="credit">افزایش موجودی</option>
                            <option value="debit">کاهش موجودی</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- جدول -->
        <div class="card">
            <div class="card-body p-2 p-md-3">
                <div v-if="loading" class="text-center my-5">
                    <div class="spinner-border" role="status"></div>
                    <p class="mt-2">در حال بارگذاری...</p>
                </div>

                <div v-else>
                    <!-- ===== حالت خالی ===== -->
                    <div v-if="!transactions.data || transactions.data.length === 0"
                        class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        <p>تراکنشی یافت نشد</p>
                    </div>

                    <!-- ===== نمایش جدول در دسکتاپ ===== -->
                    <div v-else class="table-responsive d-none d-md-block">
                        <table class="table table-bordered table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>شناسه</th>
                                    <th>کاربر</th>
                                    <th>شماره تماس</th>
                                    <th>نوع</th>
                                    <th>مبلغ (تومان)</th>
                                    <th>توضیح</th>
                                    <th>تاریخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="tx in transactions.data" :key="tx.id">
                                    <td>{{ tx.id }}</td>
                                    <td>{{ tx.wallet?.user?.full_name ?? '-' }}</td>
                                    <td>{{ tx.wallet?.user?.mobile ?? '-' }}</td>
                                    <td>
                                        <span class="badge"
                                            :class="tx.type === 'credit' ? 'bg-success' : 'bg-warning text-dark'">
                                            {{ tx.type === 'credit' ? 'افزایش' : 'کاهش' }}
                                        </span>
                                    </td>
                                    <td class="balance-cell"
                                        :class="tx.type === 'credit' ? 'text-success' : 'text-danger'">
                                        {{ tx.type === 'credit' ? '+' : '-' }}
                                        {{ Number(tx.amount).toLocaleString('fa-ir') }}
                                    </td>
                                    <td>{{ tx.description || '-' }}</td>
                                    <td>{{ formatDate(tx.created_at) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- ===== نمایش کارتی در موبایل ===== -->
                    <div v-if="transactions.data && transactions.data.length > 0"
                        class="d-md-none wallet-cards">
                        <div v-for="tx in transactions.data" :key="tx.id" class="wallet-card">
                            <div class="wallet-card-header">
                                <div class="wallet-avatar"
                                    :class="tx.type === 'credit' ? 'avatar-credit' : 'avatar-debit'">
                                    <i class="bi"
                                        :class="tx.type === 'credit' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'"></i>
                                </div>
                                <div class="wallet-user-info">
                                    <div class="wallet-user-name">
                                        {{ tx.wallet?.user?.full_name ?? '-' }}
                                    </div>
                                    <div class="wallet-id">
                                        شناسه تراکنش: #{{ tx.id }}
                                    </div>
                                </div>
                            </div>

                            <div class="wallet-balance-box"
                                :class="tx.type === 'credit' ? 'box-credit' : 'box-debit'">
                                <div class="balance-label">
                                    <i class="bi bi-cash-coin"></i>
                                    {{ tx.type === 'credit' ? 'افزایش موجودی' : 'کاهش موجودی' }}
                                </div>
                                <div class="balance-value">
                                    {{ tx.type === 'credit' ? '+' : '-' }}
                                    {{ Number(tx.amount).toLocaleString('fa-ir') }}
                                    <small>تومان</small>
                                </div>
                            </div>

                            <div class="tx-info-row">
                                <span class="tx-info-label">
                                    <i class="bi bi-phone"></i>
                                    شماره تماس
                                </span>
                                <span class="tx-info-value">
                                    {{ tx.wallet?.user?.mobile ?? '-' }}
                                </span>
                            </div>

                            <div v-if="tx.description" class="tx-description">
                                <i class="bi bi-chat-right-text"></i>
                                <span>{{ tx.description }}</span>
                            </div>

                            <div class="tx-date">
                                <i class="bi bi-calendar3"></i>
                                {{ formatDate(tx.created_at) }}
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <b-pagination v-model="currentPage" :total-rows="transactions.total"
                        v-if="transactions.last_page != 1" :per-page="transactions.per_page"
                        @Update:modelValue="changePage" align="center"
                        class="mt-3 pagination-responsive"></b-pagination>
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
let router = useRouter();
let route = useRoute();

const transactions = ref({ data: [] });
const loading = ref(false);
const filters = ref({ search: "", type: "" });
const currentPage = ref(1);
let abortController = null;

const getTransactions = async (page = 1) => {
    loading.value = true;

    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController();

    try {
        const response = await axios.get("/transactions", {
            params: {
                page,
                search: filters.value.search,
                type: filters.value.type,
            },
            signal: abortController.signal,
        });
        transactions.value = response.data;
        currentPage.value = page;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('درخواست قبلی کنسل شد:', error.message);
        } else {
            console.error('خطا در دریافت تراکنش‌ها:', error);
        }
    } finally {
        loading.value = false;
    }
};

const changePage = (page) => {
    if (page) {
        router.replace({ name: route.name, query: { page: page } })
        getTransactions(page)
    }
};

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fa-IR');
};

onMounted(() => {
    getTransactions();
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

.search-input,
.filter-select {
    border-radius: 10px;
    padding: 10px 14px;
    border: 1px solid #e0e0e0;
    transition: all 0.2s ease;
}

.search-input:focus,
.filter-select:focus {
    border-color: #6c5ce7;
    box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
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

.balance-cell {
    font-weight: 700;
}

/* ===== کارت‌های موبایل ===== */
.wallet-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wallet-card {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

.wallet-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.wallet-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 12px;
}

.wallet-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    flex-shrink: 0;
}

.avatar-credit {
    background: linear-gradient(135deg, #00b894, #55efc4);
    box-shadow: 0 4px 12px rgba(0, 184, 148, 0.25);
}

.avatar-debit {
    background: linear-gradient(135deg, #e17055, #fab1a0);
    box-shadow: 0 4px 12px rgba(225, 112, 85, 0.25);
}

.wallet-user-info {
    flex: 1;
    min-width: 0;
}

.wallet-user-name {
    font-weight: 700;
    color: #2d3436;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wallet-id {
    font-size: 0.72rem;
    color: #6c757d;
    margin-top: 2px;
}

/* جعبه موجودی */
.wallet-balance-box {
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
    text-align: center;
}

.box-credit {
    background: linear-gradient(135deg, #e8fff8, #f0fff9);
    border: 1px solid #d1f4e6;
}

.box-debit {
    background: linear-gradient(135deg, #fff5e8, #fff9f0);
    border: 1px solid #f4e6d1;
}

.balance-label {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.box-credit .balance-label {
    color: #00b894;
}

.box-debit .balance-label {
    color: #e17055;
}

.balance-value {
    font-size: 1.15rem;
    font-weight: 700;
    word-break: break-word;
}

.box-credit .balance-value {
    color: #00895e;
}

.box-debit .balance-value {
    color: #b8502a;
}

.balance-value small {
    font-size: 0.7rem;
    font-weight: 500;
    margin-right: 4px;
}

/* ردیف اطلاعات */
.tx-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    padding: 6px 4px;
    border-bottom: 1px dashed #f0f0f0;
    margin-bottom: 8px;
}

.tx-info-label {
    color: #6c757d;
    display: flex;
    align-items: center;
    gap: 5px;
}

.tx-info-value {
    color: #2d3436;
    font-weight: 600;
    direction: ltr;
}

.tx-description {
    font-size: 0.82rem;
    color: #555;
    padding: 8px 10px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 8px;
    display: flex;
    gap: 6px;
    align-items: flex-start;
}

.tx-description span {
    flex: 1;
    word-break: break-word;
}

.tx-date {
    font-size: 0.75rem;
    color: #6c757d;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
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

    .search-input,
    .filter-select {
        padding: 9px 12px;
        font-size: 0.9rem;
    }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
    .page-title {
        font-size: 1rem;
    }

    .wallet-card {
        padding: 12px;
    }

    .wallet-avatar {
        width: 40px;
        height: 40px;
        font-size: 18px;
    }

    .wallet-user-name {
        font-size: 0.88rem;
    }

    .balance-value {
        font-size: 1rem;
    }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
    .wallet-cards {
        display: none;
    }
}
</style>