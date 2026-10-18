<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 duplicates-page">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div
          class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
          <h3 class="mb-0 page-title">
            <i class="bi bi-people-fill"></i>
            <span>کاربران تکراری</span>
          </h3>

          <div class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 header-actions">
            <input v-model="search" @keyup.enter="applySearch" type="text"
              class="form-control form-control-sm search-input" placeholder="جستجو در موبایل یا نام..." />
            <button @click="applySearch" class="btn btn-primary search-btn">
              <i class="bi bi-search"></i>
              <span>جستجو</span>
            </button>
            <button @click="loadDuplicates(currentPage)" class="btn btn-outline-secondary refresh-btn"
              :disabled="loading">
              <i class="bi bi-arrow-clockwise"></i>
              <span>بروزرسانی</span>
            </button>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <i class="bi bi-people"></i>
            <span>کل گروه‌ها:</span>
            <strong>{{ duplicates.total || 0 }}</strong>
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
          <div v-if="!duplicates.data || duplicates.data.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
            <p>هیچ کاربر تکراری یافت نشد 🎉</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered align-middle mb-0">
                <thead>
                  <tr>
                    <th style="width: 40px;">
                      <input type="checkbox" :checked="isAllPageSelected" :indeterminate.prop="isSomePageSelected"
                        @change="toggleSelectAllPage" class="form-check-input" />
                    </th>
                    <th style="width: 50px;">#</th>
                    <th>شماره نرمال‌شده</th>
                    <th>تعداد</th>
                    <th>کاربر اصلی</th>
                    <th>کاربران تکراری</th>
                    <th style="width: 200px;">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(group, idx) in duplicates.data" :key="group.normalized_mobile">
                    <!-- در tbody، بعد از td row-number -->
                    <td class="text-center">
                      <input type="checkbox" :value="group.normalized_mobile"
                        :checked="selectedGroups.includes(group.normalized_mobile)"
                        @change="toggleGroup(group.normalized_mobile)" class="form-check-input" />
                    </td>
                    <td class="row-number">
                      {{ (duplicates.current_page - 1) * duplicates.per_page + idx + 1 }}
                    </td>

                    <td class="mobile-cell">
                      <i class="bi bi-phone"></i>
                      <span dir="ltr">{{ group.normalized_mobile }}</span>
                    </td>

                    <td>
                      <span class="badge bg-warning text-dark">{{ group.total_users }} کاربر</span>
                    </td>

                    <td>
                      <div class="user-info primary-info">
                        <i class="bi bi-star-fill text-warning"></i>
                        <div>
                          <div class="user-name">{{ getPrimary(group).full_name || 'نامشخص' }}</div>
                          <div class="user-meta">
                            #{{ getPrimary(group).id }} •
                            <span dir="ltr">{{ getPrimary(group).mobile }}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div class="duplicates-list">
                        <div v-for="u in getDuplicates(group)" :key="u.id" class="user-info duplicate-info">
                          <i class="bi bi-person"></i>
                          <div>
                            <div class="user-name">{{ u.full_name || 'نامشخص' }}</div>
                            <div class="user-meta">
                              #{{ u.id }} •
                              <span dir="ltr">{{ u.mobile }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div class="d-flex gap-1">
                        <button @click="openMergeModal(group)" class="btn btn-sm btn-primary flex-fill merge-btn"
                          title="ادغام با انتخاب دستی">
                          <i class="bi bi-shuffle"></i>
                          <span>ادغام</span>
                        </button>
                        <button @click="quickMerge(group)" class="btn btn-sm btn-success flex-fill merge-btn"
                          :disabled="quickMerging === group.normalized_mobile" title="ادغام سریع همه تکراری‌ها">
                          <span v-if="quickMerging === group.normalized_mobile"
                            class="spinner-border spinner-border-sm"></span>
                          <i v-else class="bi bi-lightning-charge-fill"></i>
                          <span>سریع</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ===== کارت موبایل ===== -->
            <div class="d-md-none duplicate-cards">
              <div v-for="group in duplicates.data" :key="group.normalized_mobile" class="duplicate-card">
                <div class="card-header-row">
                  <div class="d-flex align-items-center gap-2">
                    <input type="checkbox" :value="group.normalized_mobile"
                      :checked="selectedGroups.includes(group.normalized_mobile)"
                      @change="toggleGroup(group.normalized_mobile)" class="form-check-input" />
                    <div class="mobile-badge">
                      <i class="bi bi-phone"></i>
                      <span dir="ltr">{{ group.normalized_mobile }}</span>
                    </div>
                  </div>
                  <span class="badge bg-warning text-dark">{{ group.total_users }}</span>
                </div>

                <div class="primary-section">
                  <div class="section-label">
                    <i class="bi bi-star-fill text-warning"></i>
                    کاربر اصلی
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ getPrimary(group).full_name || 'نامشخص' }}</div>
                    <div class="user-meta">
                      #{{ getPrimary(group).id }} • <span dir="ltr">{{ getPrimary(group).mobile }}</span>
                    </div>
                  </div>
                </div>

                <div class="duplicates-section">
                  <div class="section-label">
                    <i class="bi bi-people"></i>
                    تکراری‌ها ({{ getDuplicates(group).length }})
                  </div>
                  <div v-for="u in getDuplicates(group)" :key="u.id" class="user-info small">
                    <div class="user-name">{{ u.full_name || 'نامشخص' }}</div>
                    <div class="user-meta">
                      #{{ u.id }} • <span dir="ltr">{{ u.mobile }}</span>
                    </div>
                  </div>
                </div>

                <div class="d-flex gap-2 mt-2">
                  <button @click="openMergeModal(group)" class="btn btn-primary flex-fill">
                    <i class="bi bi-shuffle"></i>
                    <span>ادغام</span>
                  </button>
                  <button @click="quickMerge(group)" class="btn btn-success flex-fill"
                    :disabled="quickMerging === group.normalized_mobile">
                    <span v-if="quickMerging === group.normalized_mobile"
                      class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-lightning-charge-fill"></i>
                    <span>سریع</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <b-pagination v-model="currentPage" :total-rows="duplicates.total" v-if="duplicates.last_page > 1"
      :per-page="duplicates.per_page" @Update:modelValue="changePage" align="center" class="mt-3" />

    <!-- ===== مودال ===== -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header-custom">
          <h5>
            <i class="bi bi-shuffle"></i>
            ادغام کاربران
          </h5>
          <button @click="closeModal" class="btn-close-modal">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body-custom">
          <!-- شماره -->
          <div class="modal-section">
            <label class="modal-label">شماره نرمال‌شده:</label>
            <div class="mobile-display" dir="ltr">{{ selectedGroup?.normalized_mobile }}</div>
          </div>

          <!-- کاربر اصلی -->
          <div class="modal-section">
            <label class="modal-label">
              <i class="bi bi-star-fill text-warning"></i>
              انتقال اطلاعات به (کاربر اصلی):
            </label>
            <div class="primary-display">
              <div class="user-info">
                <div class="user-name">{{ getPrimary(selectedGroup)?.full_name || 'نامشخص' }}</div>
                <div class="user-meta">
                  #{{ getPrimary(selectedGroup)?.id }} •
                  <span dir="ltr">{{ getPrimary(selectedGroup)?.mobile }}</span>
                </div>
                <div class="user-stats">
                  <span><i class="bi bi-geo-alt"></i> {{ getPrimary(selectedGroup)?.addresses_count }} آدرس</span>
                  <span><i class="bi bi-bag"></i> {{ getPrimary(selectedGroup)?.orders_count }} سفارش</span>
                  <span v-if="getPrimary(selectedGroup)?.has_wallet">
                    <i class="bi bi-wallet2"></i>
                    {{ Number(getPrimary(selectedGroup)?.wallet_balance || 0).toLocaleString('fa-IR') }} تومان
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- تکراری‌ها -->
          <div class="modal-section">
            <label class="modal-label">
              <i class="bi bi-people"></i>
              کاربران تکراری که حذف می‌شوند (چندتایی قابل انتخاب):
            </label>

            <!-- دکمه انتخاب/حذف همه -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="text-muted">
                انتخاب شده: {{ selectedDuplicateIds.length }} از {{ getDuplicates(selectedGroup).length }}
              </small>
              <button v-if="selectedDuplicateIds.length < getDuplicates(selectedGroup).length"
                class="btn btn-sm btn-outline-primary" @click="selectAllDuplicates" type="button">
                <i class="bi bi-check-all"></i>
                انتخاب همه
              </button>
              <button v-else class="btn btn-sm btn-outline-secondary" @click="clearAllDuplicates" type="button">
                <i class="bi bi-x-lg"></i>
                حذف انتخاب همه
              </button>
            </div>

            <div class="duplicates-checkbox-list">
              <div v-for="u in getDuplicates(selectedGroup)" :key="u.id" class="duplicate-checkbox-item"
                :class="{ selected: selectedDuplicateIds.includes(u.id) }" @click="toggleDuplicate(u.id)">
                <input type="checkbox" :value="u.id" :checked="selectedDuplicateIds.includes(u.id)"
                  @click.stop="toggleDuplicate(u.id)" />
                <div class="user-info">
                  <div class="user-name">{{ u.full_name || 'نامشخص' }}</div>
                  <div class="user-meta">
                    #{{ u.id }} • <span dir="ltr">{{ u.mobile }}</span>
                  </div>
                  <div class="user-stats">
                    <span><i class="bi bi-geo-alt"></i> {{ u.addresses_count }} آدرس</span>
                    <span><i class="bi bi-bag"></i> {{ u.orders_count }} سفارش</span>
                    <span v-if="u.has_wallet">
                      <i class="bi bi-wallet2"></i>
                      {{ Number(u.wallet_balance).toLocaleString('fa-IR') }} تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- هشدار -->
          <div class="alert-warning-custom">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <div>
              <strong>هشدار:</strong>
              کاربران تکراری انتخاب‌شده حذف می‌شوند و تمام آدرس‌ها، سفارش‌ها، کیف پول و تراکنش‌هایشان
              به کاربر اصلی منتقل می‌شوند. این عملیات قابل بازگشت نیست.
            </div>
          </div>
        </div>

        <div class="modal-footer-custom">
          <button @click="closeModal" class="btn btn-outline-secondary" :disabled="merging">
            انصراف
          </button>
          <button @click="confirmMerge" class="btn btn-danger" :disabled="selectedDuplicateIds.length === 0 || merging">
            <span v-if="merging">
              <span class="spinner-border spinner-border-sm me-1"></span>
              در حال ادغام...
            </span>
            <span v-else>
              <i class="bi bi-check-lg"></i>
              تأیید و ادغام ({{ selectedDuplicateIds.length }})
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="toast-custom" :class="`toast-${toast.type}`">
      <i :class="toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
      <span>{{ toast.message }}</span>
    </div>
    <!-- ===== نوار عملیات گروهی ===== -->
    <transition name="slide-up">
      <div v-if="selectedGroups.length > 0" class="bulk-actions-bar">
        <div class="bulk-info">
          <i class="bi bi-check2-square"></i>
          <span>
            <strong>{{ selectedGroups.length }}</strong> گروه انتخاب شده
            ({{ totalSelectedUsers }} کاربر تکراری)
          </span>
        </div>
        <div class="bulk-buttons">
          <button @click="clearGroupSelection" class="btn btn-sm btn-outline-secondary" :disabled="bulkMerging">
            <i class="bi bi-x-lg"></i>
            لغو انتخاب
          </button>
          <button @click="bulkMerge" class="btn btn-sm btn-danger" :disabled="bulkMerging">
            <span v-if="bulkMerging">
              <span class="spinner-border spinner-border-sm me-1"></span>
              در حال ادغام گروهی...
            </span>
            <span v-else>
              <i class="bi bi-lightning-charge-fill"></i>
              ادغام گروهی ({{ selectedGroups.length }})
            </span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const duplicates = ref({ data: [], total: 0, per_page: 15, current_page: 1, last_page: 1 });
const loading = ref(false);
const search = ref("");
const currentPage = ref(1);

// مودال
const showModal = ref(false);
const selectedGroup = ref(null);
const selectedDuplicateIds = ref([]);
const merging = ref(false);
const quickMerging = ref(null);

// Toast
const toast = ref({ show: false, type: 'success', message: '' });

function showToast(message, type = 'success') {
  toast.value = { show: true, type, message };
  setTimeout(() => { toast.value.show = false; }, 3000);
}

function getPrimary(group) {
  if (!group || !group.users) return null;
  return group.users.find(u => u.is_primary) || group.users[0];
}

function getDuplicates(group) {
  if (!group || !group.users) return [];
  return group.users.filter(u => !u.is_primary);
}

async function loadDuplicates(page = 1) {
  loading.value = true;
  try {
    const resp = await axios.get("/users-duplicates", {
      params: {
        page,
        search: search.value || undefined,
        per_page: 15,
      },
    });
    duplicates.value = resp.data.data;
    currentPage.value = page;
  } catch (e) {
    showToast(e.response?.data?.message || "خطا در دریافت لیست", "error");
  } finally {
    loading.value = false;
  }
}

function applySearch() {
  currentPage.value = 1;
  loadDuplicates(1);
}

function changePage(page) {
  if (page) loadDuplicates(page);
}

function removeGroupFromList(normalizedMobile) {
  duplicates.value.data = duplicates.value.data.filter(
    g => g.normalized_mobile !== normalizedMobile
  );
  duplicates.value.total = Math.max(0, duplicates.value.total - 1);
}

function openMergeModal(group) {
  selectedGroup.value = group;

  const dups = getDuplicates(group);
  if (dups.length === 0) {
    showToast("کاربری برای ادغام یافت نشد.", "error");
    return;
  }

  selectedDuplicateIds.value = dups.map(u => u.id);
  showModal.value = true;
}

function closeModal() {
  if (merging.value) return;
  showModal.value = false;
  selectedGroup.value = null;
  selectedDuplicateIds.value = [];
}

function toggleDuplicate(id) {
  const idx = selectedDuplicateIds.value.indexOf(id);
  if (idx === -1) {
    selectedDuplicateIds.value.push(id);
  } else {
    selectedDuplicateIds.value.splice(idx, 1);
  }
}

function selectAllDuplicates() {
  const dups = getDuplicates(selectedGroup.value);
  selectedDuplicateIds.value = dups.map(u => u.id);
}

function clearAllDuplicates() {
  selectedDuplicateIds.value = [];
}

async function quickMerge(group) {
  const dups = getDuplicates(group);
  if (dups.length === 0) {
    showToast("کاربری برای ادغام یافت نشد.", "error");
    return;
  }

  quickMerging.value = group.normalized_mobile;

  try {
    const resp = await axios.post("/users-merge", {
      primary_id: getPrimary(group).id,
      duplicate_ids: dups.map(u => u.id),
    });

    if (resp.data.success) {
      showToast(resp.data.message || "ادغام با موفقیت انجام شد.", "success");
      removeGroupFromList(group.normalized_mobile);
    } else {
      showToast(resp.data.message || "خطا در ادغام", "error");
    }
  } catch (e) {
    showToast(e.response?.data?.message || "خطا در ادغام", "error");
  } finally {
    quickMerging.value = null;
  }
}

async function confirmMerge() {
  if (selectedDuplicateIds.value.length === 0 || !selectedGroup.value) return;

  merging.value = true;

  try {
    const resp = await axios.post("/users-merge", {
      primary_id: getPrimary(selectedGroup.value).id,
      duplicate_ids: selectedDuplicateIds.value,
    });

    if (resp.data.success) {
      showToast(resp.data.message || "ادغام با موفقیت انجام شد.", "success");
      const normalizedMobile = selectedGroup.value.normalized_mobile;
      closeModal();
      removeGroupFromList(normalizedMobile);
    } else {
      showToast(resp.data.message || "خطا در ادغام", "error");
    }
  } catch (e) {
    showToast(e.response?.data?.message || "خطا در ادغام", "error");
  } finally {
    merging.value = false;
  }
}

onMounted(() => {
  loadDuplicates(1);
});
// ===== انتخاب گروهی =====
const selectedGroups = ref([]);
const bulkMerging = ref(false);

// محاسبه تعداد کل کاربران تکراری در گروه‌های انتخاب‌شده
const totalSelectedUsers = computed(() => {
  return selectedGroups.value.reduce((sum, mobile) => {
    const group = duplicates.value.data.find(g => g.normalized_mobile === mobile);
    return sum + (group ? getDuplicates(group).length : 0);
  }, 0);
});

// آیا همه گروه‌های صفحه فعلی انتخاب شده‌اند؟
const isAllPageSelected = computed(() => {
  if (!duplicates.value.data.length) return false;
  return duplicates.value.data.every(g =>
    selectedGroups.value.includes(g.normalized_mobile)
  );
});

// آیا بعضی از گروه‌ها انتخاب شده‌اند؟ (برای indeterminate)
const isSomePageSelected = computed(() => {
  const count = duplicates.value.data.filter(g =>
    selectedGroups.value.includes(g.normalized_mobile)
  ).length;
  return count > 0 && count < duplicates.value.data.length;
});

// انتخاب/لغو انتخاب یک گروه
function toggleGroup(normalizedMobile) {
  const idx = selectedGroups.value.indexOf(normalizedMobile);
  if (idx === -1) {
    selectedGroups.value.push(normalizedMobile);
  } else {
    selectedGroups.value.splice(idx, 1);
  }
}

// انتخاب/لغو انتخاب همه گروه‌های صفحه
function toggleSelectAllPage() {
  if (isAllPageSelected.value) {
    // لغو انتخاب همه صفحه فعلی
    duplicates.value.data.forEach(g => {
      const idx = selectedGroups.value.indexOf(g.normalized_mobile);
      if (idx !== -1) selectedGroups.value.splice(idx, 1);
    });
  } else {
    // انتخاب همه صفحه فعلی
    duplicates.value.data.forEach(g => {
      if (!selectedGroups.value.includes(g.normalized_mobile)) {
        selectedGroups.value.push(g.normalized_mobile);
      }
    });
  }
}

// پاک کردن همه انتخاب‌ها
function clearGroupSelection() {
  selectedGroups.value = [];
}

// ===== ادغام گروهی =====
async function bulkMerge() {
  if (selectedGroups.value.length === 0) return;

  // ساخت payload
  const groupsPayload = selectedGroups.value
    .map(mobile => {
      const group = duplicates.value.data.find(g => g.normalized_mobile === mobile);
      if (!group) return null;
      const primary = getPrimary(group);
      const dups = getDuplicates(group);
      if (!primary || dups.length === 0) return null;
      return {
        primary_id: primary.id,
        duplicate_ids: dups.map(u => u.id),
      };
    })
    .filter(Boolean);

  if (groupsPayload.length === 0) {
    showToast("هیچ گروه معتبری برای ادغام یافت نشد.", "error");
    return;
  }

  // تأیید کاربر
  const confirmMsg = `آیا از ادغام ${groupsPayload.length} گروه (${totalSelectedUsers.value} کاربر تکراری) مطمئن هستید؟\nاین عملیات قابل بازگشت نیست.`;
  if (!window.confirm(confirmMsg)) return;

  bulkMerging.value = true;

  try {
    const resp = await axios.post("/users-bulk-merge", {
      groups: groupsPayload,
    });

    if (resp.data.success) {
      showToast(resp.data.message || "ادغام گروهی با موفقیت انجام شد.", "success");

      // حذف گروه‌های ادغام‌شده از لیست
      selectedGroups.value.forEach(mobile => removeGroupFromList(mobile));
      clearGroupSelection();
    } else {
      showToast(resp.data.message || "خطا در ادغام گروهی", "error");
    }
  } catch (e) {
    showToast(e.response?.data?.message || "خطا در ادغام گروهی", "error");
  } finally {
    bulkMerging.value = false;
  }
}
</script>

<style scoped>
/* ===== نوار عملیات گروهی ===== */
.bulk-actions-bar {
  position: sticky;
  bottom: 16px;
  z-index: 100;
  margin-top: 16px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #2d3436;
}

.bulk-info i {
  color: #667eea;
  font-size: 1.2rem;
}

.bulk-info strong {
  color: #667eea;
  font-weight: 700;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

.bulk-buttons .btn {
  flex: 1;
  font-weight: 600;
  border-radius: 10px;
}

@media (min-width: 576px) {
  .bulk-actions-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .bulk-buttons {
    flex: 0 0 auto;
  }

  .bulk-buttons .btn {
    flex: 0 0 auto;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ===== هدر ===== */
.header-card .card-header {
  padding: 16px 20px;
  background: transparent;
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
  min-width: 220px;
  border-radius: 10px;
  padding: 8px 14px;
  border: 1px solid #e0e0e0;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-btn,
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  border-radius: 10px;
  white-space: nowrap;
}

.search-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}

.stats-row {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  font-size: 0.85rem;
  color: #6c757d;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item strong {
  color: #667eea;
  font-weight: 700;
}

/* ===== جدول ===== */
.table thead th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2d3436;
  font-size: 0.82rem;
  white-space: nowrap;
}

.table tbody td {
  vertical-align: middle;
  font-size: 0.85rem;
}

.row-number {
  color: #6c757d;
  font-weight: 700;
  text-align: center;
}

.mobile-cell {
  font-weight: 700;
  color: #667eea;
  white-space: nowrap;
}

.mobile-cell i {
  margin-left: 4px;
}

/* ===== اطلاعات کاربر ===== */
.user-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
}

.user-info>i {
  color: #6c757d;
  margin-top: 2px;
}

.primary-info>i {
  color: #ffc107;
}

.user-name {
  font-weight: 600;
  color: #2d3436;
  font-size: 0.85rem;
}

.user-meta {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 2px;
}

.user-stats {
  display: flex;
  gap: 10px;
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 4px;
  flex-wrap: wrap;
}

.user-stats i {
  color: #667eea;
  margin-left: 2px;
}

.duplicates-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.duplicate-info {
  padding: 4px 8px;
  background: #fff8e1;
  border-radius: 8px;
  border-right: 3px solid #ffc107;
}

.merge-btn {
  font-weight: 600;
  border-radius: 8px;
}

/* ===== کارت موبایل ===== */
.duplicate-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.duplicate-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.mobile-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #667eea;
  font-size: 0.9rem;
}

.primary-section,
.duplicates-section {
  padding: 8px 0;
}

.section-label {
  font-size: 0.78rem;
  color: #6c757d;
  font-weight: 600;
  margin-bottom: 6px;
}

/* ===== مودال ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-box {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.modal-header-custom h5 {
  margin: 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body-custom {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-section {
  margin-bottom: 16px;
}

.modal-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 6px;
}

.mobile-display {
  font-size: 1.1rem;
  font-weight: 700;
  color: #667eea;
  background: #f8f9ff;
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  padding: 10px 14px;
  text-align: center;
  letter-spacing: 1px;
}

.primary-display {
  background: #fff8e1;
  border: 2px solid #ffc107;
  border-radius: 12px;
  padding: 12px 14px;
}

.duplicates-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.duplicate-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.duplicate-checkbox-item:hover {
  border-color: #c7d2fe;
  background: #f8f9ff;
}

.duplicate-checkbox-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.duplicate-checkbox-item input[type="checkbox"] {
  margin-top: 4px;
  accent-color: #667eea;
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.alert-warning-custom {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: #fff3cd;
  border-right: 4px solid #ffc107;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #664d03;
  line-height: 1.6;
}

.alert-warning-custom i {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.modal-footer-custom {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
  background: #f8f9fa;
}

/* ===== Toast ===== */
.toast-custom {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 3000;
  animation: slideUp 0.3s ease;
}

.toast-success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.toast-error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* ===== واکنش‌گرا ===== */
@media (max-width: 767.98px) {
  .page-title {
    font-size: 1.15rem;
    justify-content: center;
    width: 100%;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .search-input {
    min-width: 100%;
    width: 100%;
  }

  .search-btn,
  .refresh-btn {
    width: 100%;
  }

  .modal-box {
    max-height: 95vh;
  }

  .modal-header-custom,
  .modal-body-custom,
  .modal-footer-custom {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>