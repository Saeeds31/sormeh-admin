<template>
  <div class="categories-page container mt-3 mt-md-4 px-2 px-md-3">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-list-nested"></i>
            <span>دسته بندی محصولات</span>
          </h3>
          <router-link to="/products/categories/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن دسته‌بندی</span>
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
          <div v-if="!categories || categories.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>دسته‌بندی‌ای یافت نشد</p>
          </div>

          <!-- ===== نمایش جدول در دسکتاپ ===== -->
          <div v-else class="table-responsive d-none d-md-block">
            <table class="table table-bordered table-striped mb-0">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>عنوان</th>
                  <th>دسته والد</th>
                  <th>نمایش در صفحه اصلی</th>
                  <th>نمایش لیست در صفحه اصلی</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cat in categories" :key="cat.id">
                  <td>{{ cat.id }}</td>
                  <td>
                    <span class="category-title" :style="{ paddingRight: cat.level * 20 + 'px' }">
                      <i v-if="cat.level > 0" class="bi bi-arrow-return-left level-icon"></i>
                      <i v-else class="bi bi-folder-fill folder-icon"></i>
                      {{ cat.title }}
                    </span>
                  </td>
                  <td>
                    <span v-if="cat.parent" class="parent-badge">
                      <i class="bi bi-folder2"></i>
                      {{ cat.parent.title }}
                    </span>
                    <span v-else class="text-muted">---</span>
                  </td>
                  <td>
                    <span class="status-badge" :class="cat.show_in_home ? 'status-yes' : 'status-no'">
                      <i class="bi" :class="cat.show_in_home ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                      {{ cat.show_in_home ? "بله" : "خیر" }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" :class="cat.show_products_in_home ? 'status-yes' : 'status-no'">
                      <i class="bi" :class="cat.show_products_in_home ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                      {{ cat.show_products_in_home ? "بله" : "خیر" }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <router-link :to="`/products/categories/${cat.id}/edit`" class="btn btn-sm btn-warning">
                        <i class="bi bi-pen"></i>
                        <span>ویرایش</span>
                      </router-link>
                      <button class="btn btn-sm btn-danger" @click="deleteCategory(cat.id)">
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
          <div v-if="categories && categories.length > 0" class="d-md-none category-cards">
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="category-card"
              :class="[`level-${Math.min(cat.level, 2)}`]"
            >
              <!-- نشانگر سطح (برای زیرشاخه‌ها) -->
              <div v-if="cat.level > 0" class="level-indicator">
                <i class="bi bi-arrow-return-left"></i>
              </div>

              <div class="category-card-header">
                <div class="category-icon" :class="cat.level > 0 ? 'sub-icon' : 'main-icon'">
                  <i class="bi" :class="cat.level > 0 ? 'bi-folder2-open' : 'bi-folder-fill'"></i>
                </div>
                <div class="category-info">
                  <div class="category-name">{{ cat.title }}</div>
                  <div class="category-id">شناسه: #{{ cat.id }}</div>
                </div>
              </div>

              <div class="category-card-body">
                <!-- والد -->
                <div class="info-row">
                  <i class="bi bi-diagram-3"></i>
                  <span class="info-label">والد:</span>
                  <span v-if="cat.parent" class="parent-badge-sm">
                    {{ cat.parent.title }}
                  </span>
                  <span v-else class="info-value muted">---</span>
                </div>

                <!-- نمایش در صفحه اصلی -->
                <div class="info-row">
                  <i class="bi bi-house-door"></i>
                  <span class="info-label">نمایش در صفحه اصلی:</span>
                  <span class="status-badge-sm" :class="cat.show_in_home ? 'status-yes' : 'status-no'">
                    <i class="bi" :class="cat.show_in_home ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ cat.show_in_home ? "بله" : "خیر" }}
                  </span>
                </div>

                <!-- نمایش لیست در صفحه اصلی -->
                <div class="info-row">
                  <i class="bi bi-list-ul"></i>
                  <span class="info-label">نمایش لیست:</span>
                  <span class="status-badge-sm" :class="cat.show_products_in_home ? 'status-yes' : 'status-no'">
                    <i class="bi" :class="cat.show_products_in_home ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ cat.show_products_in_home ? "بله" : "خیر" }}
                  </span>
                </div>
              </div>

              <div class="category-card-actions">
                <router-link :to="`/products/categories/${cat.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                  <i class="bi bi-pen"></i>
                  <span>ویرایش</span>
                </router-link>
                <button class="btn btn-sm btn-danger flex-fill" @click="deleteCategory(cat.id)">
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
const categories = ref([]);
const loading = ref(false);
const filters = ref({ title: "" });
let currentUrl = "/categories";

const getCategories = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url, { params: filters.value });
    categories.value = flattenCategories(data.data);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// تابع برای مسطح کردن منوهای سلسله‌مراتبی
const flattenCategories = (categoryItems, level = 0, parent = null) => {
  let result = [];
  categoryItems.forEach((category) => {
    result.push({
      ...category,
      level,
      parent,
    });
    if (category.all_children && category.all_children.length > 0) {
      result = result.concat(
        flattenCategories(category.all_children, level + 1, category)
      );
    }
  });
  return result;
};

const deleteCategory = (id) => {
  Swal.fire({
    title: "حذف دسته‌بندی",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/categories/${id}`);
        Swal.fire("موفق", "دسته‌بندی حذف شد", "success");
        getCategories();
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

onMounted(() => {
  getCategories();
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

.category-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.folder-icon {
  color: #f39c12;
}

.level-icon {
  color: #6c757d;
  font-size: 0.8rem;
}

/* ===== بج والد ===== */
.parent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ===== بج وضعیت ===== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.status-yes {
  background: #dcfce7;
  color: #16a34a;
}

.status-no {
  background: #fee2e2;
  color: #dc2626;
}

/* ===== کارت‌های موبایل ===== */
.category-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  position: relative;
}

.category-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* سطح‌بندی کارت‌ها */
.category-card.level-1 {
  border-right: 4px solid #60a5fa;
  background: #f8faff;
}

.category-card.level-2 {
  border-right: 4px solid #a78bfa;
  background: #faf8ff;
  margin-right: 12px;
}

.level-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #94a3b8;
  font-size: 0.9rem;
}

.category-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.category-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.main-icon {
  background: linear-gradient(135deg, #f39c12, #fdcb6e);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.25);
}

.sub-icon {
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.25);
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-id {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 2px;
}

/* بدنه کارت */
.category-card-body {
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
  flex-wrap: wrap;
}

.info-row > i {
  color: #6c5ce7;
  font-size: 0.9rem;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.info-label {
  color: #6c757d;
  flex-shrink: 0;
  font-weight: 500;
}

.info-value.muted {
  color: #adb5bd;
}

.parent-badge-sm {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}

.status-badge-sm {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}

.status-badge-sm.status-yes {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge-sm.status-no {
  background: #fee2e2;
  color: #dc2626;
}

/* دکمه‌ها */
.category-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.category-card-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.8rem;
  padding: 8px 10px;
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

  .category-card {
    padding: 12px;
  }

  .category-card.level-2 {
    margin-right: 8px;
  }

  .category-icon {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }

  .category-name {
    font-size: 0.9rem;
  }

  .info-row {
    font-size: 0.75rem;
  }

  .info-row > i {
    font-size: 0.82rem;
    width: 14px;
  }

  .category-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .category-cards {
    display: none;
  }
}
</style>