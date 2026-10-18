<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 specifications-page" v-if="checkPermission(['specifications_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-table"></i>
            <span>مدیریت مشخصه</span>
          </h3>
          <router-link to="/products/specification/create" class="btn btn-primary add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن مشخصه</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- جدول -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!specifications.data || specifications.data.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>هیچ مشخصه‌ای یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered align-middle mb-0">
                <thead>
                  <tr>
                    <th class="text-center">#</th>
                    <th>عنوان مشخصه</th>
                    <th class="text-center">تعداد مقادیر</th>
                    <th class="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="spec in specifications.data" :key="spec.id">
                    <td class="text-center spec-id">{{ spec.id }}</td>
                    <td class="spec-title">{{ spec.title }}</td>
                    <td class="text-center">
                      <span class="values-count">
                        <i class="bi bi-list-ul"></i>
                        {{ spec.values.length }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1 justify-content-center">
                        <router-link :to="`/products/specification/${spec.id}/edit`" class="btn btn-sm btn-info">
                          <i class="bi bi-pen"></i>
                          <span>ویرایش</span>
                        </router-link>
                        <button class="btn btn-sm btn-danger" @click="confirmDelete(spec.id)">
                          <i class="bi bi-trash3-fill"></i>
                          <span>حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ===== کارت موبایل ===== -->
            <div class="d-md-none spec-cards">
              <div
                v-for="spec in specifications.data"
                :key="spec.id"
                class="spec-card"
              >
                <div class="spec-card-header">
                  <div class="spec-icon">
                    <i class="bi bi-table"></i>
                  </div>
                  <div class="spec-info">
                    <div class="spec-name">{{ spec.title }}</div>
                    <div class="spec-id">شناسه: #{{ spec.id }}</div>
                  </div>
                </div>

                <div class="spec-card-body">
                  <div class="info-row">
                    <i class="bi bi-list-ul"></i>
                    <span class="info-label">تعداد مقادیر:</span>
                    <span class="info-value">{{ spec.values.length }}</span>
                  </div>
                </div>

                <div class="spec-card-actions">
                  <router-link :to="`/products/specification/${spec.id}/edit`" class="btn btn-sm btn-info flex-fill">
                    <i class="bi bi-pen"></i>
                    <span>ویرایش</span>
                  </router-link>
                  <button class="btn btn-sm btn-danger flex-fill" @click="confirmDelete(spec.id)">
                    <i class="bi bi-trash3-fill"></i>
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <b-pagination v-model="currentPage" :total-rows="specifications.total" v-if="specifications.last_page != 1"
      :per-page="specifications.per_page" @Update:modelValue="changePage" align="center" class="mt-3 pagination-responsive"></b-pagination>

  </div>
</template>

<script setup>
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;

const specifications = ref({ data: [] });
const loading = ref(false);
const filters = ref({ search: "" });
const currentPage = ref(1);

const getSpecifications = async (page = 1) => {
  loading.value = true;
  try {
    const response = await axios.get("/specifications", {
      params: {
        page,
        search: filters.value.search,
      },
    });
    specifications.value = response.data.data;
    currentPage.value = page;
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page) getSpecifications(page);
  else currentUrl = "/specifications"
};

const confirmDelete = (id) => {
  Swal.fire({
    title: "حذف مشخصه",
    text: "آیا از حذف این مشخصه مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await axios.delete(`/specifications/${id}`);
      getSpecifications(currentPage.value);
      Swal.fire("حذف شد!", "مشخصه با موفقیت حذف گردید.", "success");
    }
  });
};

onMounted(() => {
  getSpecifications();
});
</script>

<style scoped>
/* ===== هدر ===== */
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

.add-btn {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
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

.spec-id {
  font-weight: 700;
  color: #6c757d;
}

.spec-title {
  font-weight: 600;
}

/* بج تعداد مقادیر */
.values-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  color: #4f46e5;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}

/* ===== کارت‌های موبایل ===== */
.spec-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.spec-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.spec-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.spec-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.spec-info {
  flex: 1;
  min-width: 0;
}

.spec-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec-id {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 2px;
}

.spec-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.info-row > i {
  color: #3b82f6;
  font-size: 0.95rem;
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
  font-weight: 700;
  margin-right: auto;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  color: #4f46e5;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
}

.spec-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.spec-card-actions .btn {
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
  .header-card .card-header {
    padding: 12px 14px;
  }

  .page-title {
    font-size: 1.15rem;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

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

  .spec-card {
    padding: 12px;
  }

  .spec-icon {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }

  .spec-name {
    font-size: 0.9rem;
  }

  .info-row {
    font-size: 0.78rem;
  }

  .spec-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .spec-cards {
    display: none;
  }
}
</style>