<template>
    <div class="container wallets-page mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['wallet_view'])">

        <!-- فیلتر -->
        <div class="card mb-2 header-card">
            <div class="card-header">
                <div
                    class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-wallet"></i>
                        <span>مدیریت کیف پول‌ها</span>
                    </h3>
                </div>
            </div>
            <div class="card-body">
                <input v-model="filters.search" @input="getWallets" type="text" class="form-control search-input"
                    placeholder="جستجو بر اساس نام کاربر یا شماره تماس" />
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
                    <div v-if="!wallets.data || wallets.data.length === 0" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        <p>کیف پولی یافت نشد</p>
                    </div>

                    <!-- ===== نمایش جدول در دسکتاپ ===== -->
                    <div v-else class="table-responsive d-none d-md-block">
                        <table class="table table-bordered table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>شناسه</th>
                                    <th>کاربر</th>
                                    <th>شماره تماس</th>
                                    <th>موجودی (تومان)</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="wallet in wallets.data" :key="wallet.id">
                                    <td>{{ wallet.id }}</td>
                                    <td>{{ wallet.user?.full_name ?? '-' }}</td>
                                    <td>{{ wallet.user?.mobile ?? '-' }}</td>
                                    <td class="balance-cell">
                                        {{ Number(wallet.balance).toLocaleString('fa-ir') }}
                                    </td>
                                    <td>
                                        <div class="d-flex flex-wrap gap-1">
                                            <button class="btn btn-sm btn-success"
                                                @click="openModal(wallet, 'deposit')">
                                                <i class="bi bi-plus"></i>
                                                <span>افزایش موجودی</span>
                                            </button>
                                            <button class="btn btn-sm btn-warning"
                                                @click="openModal(wallet, 'withdraw')">
                                                <i class="bi bi-dash"></i>
                                                <span>کاهش موجودی</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- ===== نمایش کارتی در موبایل ===== -->
                    <div v-if="wallets.data && wallets.data.length > 0" class="d-md-none wallet-cards">
                        <div v-for="wallet in wallets.data" :key="wallet.id" class="wallet-card">
                            <div class="wallet-card-header">
                                <div class="wallet-avatar">
                                    <i class="bi bi-person-fill"></i>
                                </div>
                                <div class="wallet-user-info">
                                    <div class="wallet-user-name">{{ wallet.user?.full_name ?? '-' }}</div>
                                    <div class="wallet-id">شناسه: #{{ wallet.id }}</div>
                                </div>
                            </div>

                            <div class="wallet-balance-box">
                                <div class="balance-label">
                                    <i class="bi bi-cash-coin"></i>
                                    موجودی
                                </div>
                                <div class="balance-value">
                                    {{ Number(wallet.balance).toLocaleString('fa-ir') }}
                                    <small>تومان</small>
                                </div>
                            </div>

                            <div class="wallet-card-actions">
                                <button class="btn btn-sm btn-success flex-fill" @click="openModal(wallet, 'deposit')">
                                    <i class="bi bi-plus-lg"></i>
                                    <span>افزایش</span>
                                </button>
                                <button class="btn btn-sm btn-warning flex-fill" @click="openModal(wallet, 'withdraw')">
                                    <i class="bi bi-dash-lg"></i>
                                    <span>کاهش</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <b-pagination v-model="currentPage" :total-rows="wallets.total" v-if="wallets.last_page != 1"
                        :per-page="wallets.per_page" @Update:modelValue="changePage" align="center"
                        class="mt-3 pagination-responsive"></b-pagination>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div class="modal fade" id="walletModal" tabindex="-1" aria-hidden="true" ref="walletModal">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ modalTitle }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">
                                مبلغ
                                <span v-if="form.amount" class="amount-preview">
                                    ({{ Number(form.amount).toLocaleString('fa-ir') }} تومان)
                                </span>
                            </label>
                            <input v-model="form.amount" type="number" class="form-control"
                                placeholder="مثلاً 100000" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">توضیح</label>
                            <textarea v-model="form.description" class="form-control" rows="3"
                                placeholder="توضیحات (اختیاری)"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x"></i>
                            <span>انصراف</span>
                        </button>
                        <button type="button" class="btn btn-primary" :disabled="loading" @click="submitForm">
                            <i class="bi bi-save2"></i>
                            <span>ثبت</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "bootstrap";
import { useRoute, useRouter } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;
let router = useRouter();
let route = useRoute();

const wallets = ref({ data: [] });
const loading = ref(false);
const filters = ref({ search: "" });
const currentPage = ref(1);

const modalInstance = ref(null);
const modalTitle = ref("");
const actionType = ref(""); // deposit | withdraw
const selectedWallet = ref(null);
const form = ref({
    amount: "",
    description: "",
});
let abortController = null;

const getWallets = async (page = 1) => {
    loading.value = true;
    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController();
    try {
        const response = await axios.get("/wallets", {
            params: {
                page,
                search: filters.value.search,
            },
            signal: abortController.signal,
        });
        wallets.value = response.data;
        currentPage.value = page;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('درخواست قبلی کنسل شد:', error.message);
        } else {
            console.error('خطا در دریافت کیف پول‌ها:', error);
        }
    } finally {
        loading.value = false;
    }
};

const changePage = (page) => {
    if (page) {
        router.replace({ name: route.name, query: { page: page } })
        getWallets(page)
    }
};

const openModal = (wallet, type) => {
    selectedWallet.value = wallet;
    actionType.value = type;
    modalTitle.value = type === "deposit" ? "افزایش موجودی" : "کاهش موجودی";
    form.value.amount = "";
    form.value.description = "";
    modalInstance.value = new Modal(document.getElementById("walletModal"));
    modalInstance.value.show();
};

const submitForm = async () => {
    if (!form.value.amount) {
        Swal.fire("خطا", "لطفاً مبلغ را وارد کنید", "error");
        return;
    }
    loading.value = true;

    let formData = new FormData();
    formData.append("wallet_id", selectedWallet.value.id)
    formData.append("amount", form.value.amount)
    formData.append("description", form.value.description)
    formData.append("type", actionType.value == "deposit" ? 'credit' : 'debit')

    try {
        await axios.post(`/wallets/${selectedWallet.value.id}/transactions`, formData);
        modalInstance.value.hide();
        getWallets(currentPage.value);
        Swal.fire("موفق", "عملیات با موفقیت انجام شد", "success");
    } catch (error) {
        Swal.fire("خطا", "مشکلی رخ داد", "error");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    getWallets();
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

.search-input {
    border-radius: 10px;
    padding: 10px 14px;
    border: 1px solid #e0e0e0;
    transition: all 0.2s ease;
}

.search-input:focus {
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
    color: #00b894;
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
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(108, 92, 231, 0.25);
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
    background: linear-gradient(135deg, #e8fff8, #f0fff9);
    border: 1px solid #d1f4e6;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
    text-align: center;
}

.balance-label {
    font-size: 0.75rem;
    color: #00b894;
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.balance-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: #00895e;
    word-break: break-word;
}

.balance-value small {
    font-size: 0.7rem;
    color: #00b894;
    font-weight: 500;
    margin-right: 4px;
}

/* دکمه‌ها */
.wallet-card-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
}

.wallet-card-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.8rem;
    padding: 8px 10px;
    white-space: nowrap;
    font-weight: 600;
}

/* ===== مودال ===== */
.amount-preview {
    color: #00b894;
    font-weight: 700;
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

    .search-input {
        padding: 9px 12px;
        font-size: 0.9rem;
    }

    .modal-footer {
        flex-direction: column-reverse;
        gap: 8px;
    }

    .modal-footer .btn {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
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

    .wallet-card-actions .btn {
        font-size: 0.72rem;
        padding: 7px 6px;
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