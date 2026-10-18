<template>
  <div class="attributes-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['attributes_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-list-check"></i>
            <span>لیست ویژگی‌ها</span>
          </h3>
          <router-link to="/products/attributes/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن ویژگی</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- جدول -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">در حال بارگذاری...</span>
          </div>
        </div>

        <div v-else>
          <!-- ===== حالت خالی ===== -->
          <div v-if="attributes.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>ویژگی‌ای یافت نشد</p>
          </div>

          <!-- ===== نمایش جدول در دسکتاپ ===== -->
          <div v-else class="table-responsive d-none d-md-block">
            <table class="table table-bordered table-striped mb-0">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>نام ویژگی</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="attr in attributes" :key="attr.id">
                  <td>{{ attr.id }}</td>
                  <td>{{ attr.name }}</td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <router-link :to="`/products/attributes/${attr.id}/edit`" class="btn btn-sm btn-warning">
                        <i class="bi bi-pen"></i>
                        <span>ویرایش</span>
                      </router-link>

                      <router-link :to="`/products/attributes/${attr.id}/values`" class="btn btn-sm btn-info">
                        <i class="bi bi-plus"></i>
                        <span>افزودن مقدار</span>
                      </router-link>

                      <button class="btn btn-sm btn-danger" @click="deleteAttribute(attr.id)">
                        <i class="bi bi-trash3-fill"></i>
                        <span>حذف</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ===== نمایش کارتی در موبایل ===== -->
          <div v-if="attributes.length > 0" class="d-md-none attribute-cards">
            <div
              v-for="attr in attributes"
              :key="attr.id"
              class="attribute-card"
            >
              <div class="attribute-card-header">
                <div class="attribute-icon">
                  <i class="bi bi-tag-fill"></i>
                </div>
                <div class="attribute-info">
                  <div class="attribute-name">{{ attr.name }}</div>
                  <div class="attribute-id">شناسه: #{{ attr.id }}</div>
                </div>
              </div>

              <div class="attribute-card-actions">
                <router-link :to="`/products/attributes/${attr.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                  <i class="bi bi-pen"></i>
                  <span>ویرایش</span>
                </router-link>

                <router-link :to="`/products/attributes/${attr.id}/values`" class="btn btn-sm btn-info flex-fill">
                  <i class="bi bi-plus-lg"></i>
                  <span>مقدار</span>
                </router-link>

                <button class="btn btn-sm btn-danger flex-fill" @click="deleteAttribute(attr.id)">
                  <i class="bi bi-trash3-fill"></i>
                  <span>حذف</span>
                </button>
              </div>
            </div>
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
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;
const attributes = ref([]);
const loading = ref(false);
let currentUrl = "/attributes";

const getAttributes = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url);
    attributes.value = data.data;
    currentUrl = url;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const deleteAttribute = (id) => {
  Swal.fire({
    title: "حذف ویژگی",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/attributes/${id}`);
        Swal.fire("موفق", "ویژگی حذف شد", "success");
        getAttributes();
      } catch (err) {
        Swal.fire("خطا", err.response?.data?.message || "مشکلی رخ داد", "error");
      }
    }
  });
};

onMounted(() => {
  getAttributes();
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

/* ===== کارت‌های موبایل ===== */
.attribute-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attribute-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.attribute-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.attribute-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.attribute-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #fdcb6e, #f39c12);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.25);
}

.attribute-info {
  flex: 1;
  min-width: 0;
}

.attribute-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attribute-id {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 2px;
}

.attribute-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.attribute-card-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.78rem;
  padding: 8px 6px;
  white-space: nowrap;
  font-weight: 600;
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

  .attribute-card {
    padding: 12px;
  }

  .attribute-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .attribute-name {
    font-size: 0.9rem;
  }

  .attribute-card-actions {
    flex-wrap: wrap;
  }

  .attribute-card-actions .btn {
    font-size: 0.7rem;
    padding: 6px 4px;
    flex: 1 1 calc(50% - 4px);
  }

  /* آخرین دکمه تمام عرض */
  .attribute-card-actions .btn:last-child {
    flex: 1 1 100%;
  }

  .attribute-card-actions .btn span {
    display: none;
  }

  .attribute-card-actions .btn i {
    font-size: 0.95rem;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .attribute-cards {
    display: none;
  }
}
</style>