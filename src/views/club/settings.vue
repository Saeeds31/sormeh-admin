<template>
    <div class="club-settings-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['club_store'])">
        <!-- دکمه بازگشت -->
        <div class="mb-2">
            <router-link to="/club/users" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-right"></i>
                <span>بازگشت به لیست</span>
            </router-link>
        </div>

        <div class="card mb-2 header-card">
            <div class="card-header">
                <div
                    class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-gear-fill"></i>
                        <span>تنظیمات باشگاه مشتریان</span>
                    </h3>
                    <button class="btn btn-primary" :disabled="saving" @click="saveAll">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                        <i v-else class="bi bi-check2-circle me-1"></i>
                        ذخیره تغییرات
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center my-5">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">در حال بارگذاری...</p>
        </div>

        <form v-else @submit.prevent="saveAll">
            <!-- ===== فعال بودن ===== -->
            <div class="card mb-3">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <strong>فعال بودن باشگاه مشتریان</strong>
                        <div class="text-muted small">در صورت غیرفعال بودن، امتیازدهی و تخفیف‌ها اعمال نمی‌شوند.</div>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input switch-lg" type="checkbox" :checked="boolOf('club.enabled')"
                            @change="setValue('club.enabled', $event.target.checked ? 1 : 0)" />
                    </div>
                </div>
            </div>

            <!-- ===== پایه امتیازدهی ===== -->
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0"><i class="bi bi-coin me-1"></i>پایه امتیازدهی</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-12 col-md-6">
                            <label class="form-label">مبلغ لازم برای هر امتیاز (تومان)</label>
                            <input type="number" min="1" class="form-control" :value="numOf('club.point_rate_amount')"
                                @input="setValue('club.point_rate_amount', $event.target.value)" />
                            <small class="text-muted">مثلاً ۱۰۰٫۰۰۰ تومان</small>
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label">تعداد کوین به ازای هر مبلغ</label>
                            <input type="number" min="1" class="form-control" :value="numOf('club.point_rate_coins')"
                                @input="setValue('club.point_rate_coins', $event.target.value)" />
                            <small class="text-muted">مثلاً هر ۱۰۰٫۰۰۰ تومان = ۱ کوین</small>
                        </div>
                        <div class="col-12">
                            <label class="form-label">امتیاز تکمیل پروفایل</label>
                            <input type="number" min="0" class="form-control"
                                :value="numOf('club.profile_completion_points')"
                                @input="setValue('club.profile_completion_points', $event.target.value)" />
                            <small class="text-muted">
                                امتیازی که با تکمیل پروفایل (نام، کد ملی، تاریخ تولد) به کاربر داده می‌شود. صفر =
                                غیرفعال.
                            </small>
                        </div>
                        <div class="col-12">
                            <label class="form-label">امتیاز تکمیل انتخاب سلیقه/مشخصات</label>
                            <input type="number" min="0" class="form-control"
                                :value="numOf('club.preferences_completion_points')"
                                @input="setValue('club.preferences_completion_points', $event.target.value)" />
                            <small class="text-muted">
                                امتیازی که با تکمیل انتخاب سلیقه/مشخصات به کاربر داده می‌شود. صفر = غیرفعال.
                            </small>
                        </div>
                    </div>

                    <div class="alert alert-info mt-3 mb-0 small">
                        <i class="bi bi-info-circle me-1"></i>
                        هر {{ Number(numOf('club.point_rate_amount')).toLocaleString('fa-IR') }} تومان خرید =
                        {{ numOf('club.point_rate_coins') }} کوین
                    </div>
                </div>
            </div>

            <!-- ===== سطوح ===== -->
            <div class="row g-3">
                <div v-for="lv in levelCards" :key="lv.key" class="col-12 col-lg-4">
                    <div class="card level-card h-100">
                        <div class="card-header level-header" :class="`header-${lv.key}`">
                            <h5 class="mb-0 text-white">
                                <i class="bi bi-award-fill me-1"></i>{{ lv.label }}
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">حداقل امتیاز</label>
                                <input type="number" min="0" class="form-control" :value="numOf(`club.${lv.key}_min`)"
                                    @input="setValue(`club.${lv.key}_min`, $event.target.value)" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">درصد تخفیف</label>
                                <div class="input-group">
                                    <input type="number" min="0" max="100" step="0.1" class="form-control"
                                        :value="numOf(`club.${lv.key}_discount`)"
                                        @input="setValue(`club.${lv.key}_discount`, $event.target.value)" />
                                    <span class="input-group-text">٪</span>
                                </div>
                            </div>
                            <div>
                                <label class="form-label">ارسال رایگان در ماه</label>
                                <input type="number" min="0" class="form-control"
                                    :value="numOf(`club.${lv.key}_free_shipping`)"
                                    @input="setValue(`club.${lv.key}_free_shipping`, $event.target.value)" />
                                <small class="text-muted">تعداد دفعات مجاز در هر ماه</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== دکمه پایین ===== -->
            <div class="d-flex justify-content-end mt-3 mb-3">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-check2-circle me-1"></i>
                    ذخیره تغییرات
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;

const loading = ref(false);
const saving = ref(false);

// مقادیر کلیدها در حافظه
const values = ref({});

const levelCards = [
    { key: 'bronze', label: 'برنز' },
    { key: 'gold', label: 'گلد' },
    { key: 'platinum', label: 'پلاتینیوم' },
];

// ===== helpers =====
const numOf = (key) => values.value[key] ?? 0;
const boolOf = (key) => {
    const v = values.value[key];
    return v === true || v === '1' || v === 1;
};
const setValue = (key, val) => {
    values.value = { ...values.value, [key]: val };
};

// ===== دریافت تنظیمات =====
const load = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get("/club/settings");
        // data: { key: value, ... }
        values.value = data;
    } catch (e) {
        console.error(e);
        Swal.fire('خطا', 'دریافت تنظیمات با مشکل مواجه شد.', 'error');
    } finally {
        loading.value = false;
    }
};

// ===== ذخیره =====
const saveAll = async () => {
    saving.value = true;
    try {
        await axios.put("/club/settings", values.value);
        Swal.fire({
            icon: 'success',
            title: 'ذخیره شد',
            text: 'تنظیمات باشگاه با موفقیت به‌روزرسانی شد.',
            timer: 1600,
            showConfirmButton: false,
        });
        await load();
    } catch (e) {
        console.error(e);
        Swal.fire('خطا', e?.response?.data?.message || 'ذخیره تنظیمات با مشکل مواجه شد.', 'error');
    } finally {
        saving.value = false;
    }
};

onMounted(load);
</script>

<style scoped>
.header-card .card-header {
    padding: 16px 20px;
    background: transparent;
    border-bottom: 2px solid #f8f9fa;
}

.page-title {
    font-weight: 700;
    color: #2d3436;
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.switch-lg {
    width: 3rem !important;
    height: 1.6rem !important;
    cursor: pointer;
}

.level-card {
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.level-header {
    padding: 14px 16px;
}

.header-bronze {
    background: linear-gradient(135deg, #cd7f32, #e0a96d);
}

.header-gold {
    background: linear-gradient(135deg, #d4a017, #f5c542);
}

.header-platinum {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
}

.form-label {
    font-weight: 600;
    font-size: 0.88rem;
    color: #2d3436;
}

/* ===== موبایل ===== */
@media (max-width: 767.98px) {
    .page-title {
        font-size: 1.15rem;
        justify-content: center;
        text-align: center;
        width: 100%;
    }
}
</style>