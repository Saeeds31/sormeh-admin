<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 menus-page" v-if="checkPermission(['menu_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-list-columns-reverse"></i>
            <span>مدیریت منو</span>
          </h3>
          <router-link to="/content/menus/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن منو</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- جدول -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!flattenedMenus || flattenedMenus.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>منویی یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered table-striped mb-0">
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>عنوان</th>
                    <th>منو والد</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="menu in flattenedMenus" :key="menu.id">
                    <td>{{ menu.id }}</td>
                    <td>
                      <span class="menu-title" :style="{ paddingRight: `${menu.level * 20}px` }">
                        <i v-if="menu.level > 0" class="bi bi-arrow-return-left level-icon"></i>
                        <i v-else class="bi bi-folder-fill folder-icon"></i>
                        {{ menu.title }}
                      </span>
                    </td>
                    <td>
                      <span v-if="menu.parent" class="parent-badge">
                        <i class="bi bi-folder2"></i>
                        {{ menu.parent.title }}
                      </span>
                      <span v-else class="text-muted">---</span>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        <router-link :to="`/content/menus/${menu.id}/edit`" class="btn btn-sm btn-warning">
                          <i class="bi bi-pen"></i>
                          <span>ویرایش</span>
                        </router-link>
                        <button class="btn btn-sm btn-danger" @click="deleteMenu(menu.id)">
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
            <div class="d-md-none menu-cards">
              <div
                v-for="menu in flattenedMenus"
                :key="menu.id"
                class="menu-card"
                :class="[`level-${Math.min(menu.level, 2)}`]"
              >
                <!-- نشانگر سطح -->
                <div v-if="menu.level > 0" class="level-indicator">
                  <i class="bi bi-arrow-return-left"></i>
                </div>

                <div class="menu-card-header">
                  <div class="menu-icon" :class="menu.level > 0 ? 'sub-icon' : 'main-icon'">
                    <i class="bi" :class="menu.level > 0 ? 'bi-folder2-open' : 'bi-folder-fill'"></i>
                  </div>
                  <div class="menu-info">
                    <div class="menu-name">{{ menu.title }}</div>
                    <div class="menu-id">شناسه: #{{ menu.id }}</div>
                  </div>
                </div>

                <div class="menu-card-body">
                  <div class="info-row">
                    <i class="bi bi-diagram-3"></i>
                    <span class="info-label">والد:</span>
                    <span v-if="menu.parent" class="parent-badge-sm">
                      {{ menu.parent.title }}
                    </span>
                    <span v-else class="info-value muted">---</span>
                  </div>
                </div>

                <div class="menu-card-actions">
                  <router-link :to="`/content/menus/${menu.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                    <i class="bi bi-pen"></i>
                    <span>ویرایش</span>
                  </router-link>
                  <button class="btn btn-sm btn-danger flex-fill" @click="deleteMenu(menu.id)">
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
const menus = ref([]);
const flattenedMenus = ref([]);
const loading = ref(false);
const filters = ref({ title: "" });
let currentUrl = "/menus";

// تابع برای مسطح کردن منوهای سلسله‌مراتبی
const flattenMenus = (menuItems, level = 0, parent = null) => {
  let result = [];
  menuItems.forEach((menu) => {
    result.push({
      ...menu,
      level,
      parent,
    });
    if (menu.children && menu.children.length > 0) {
      result = result.concat(
        flattenMenus(menu.children, level + 1, menu)
      );
    }
  });
  return result;
};

// دریافت منوها
const getMenus = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url, { params: filters.value });
    menus.value = data.data;
    flattenedMenus.value = flattenMenus(data.data);
  } catch (err) {
    console.error(err);
    Swal.fire("خطا", "مشکلی در دریافت منوها پیش آمد", "error");
  } finally {
    loading.value = false;
  }
};

// حذف منو
const deleteMenu = (id) => {
  Swal.fire({
    title: "حذف منو",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/menus/${id}`);
        Swal.fire("موفق", "منو حذف شد", "success");
        getMenus();
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

onMounted(() => {
  getMenus();
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

/* عنوان منو با indent */
.menu-title {
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

/* بج والد */
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

/* ===== کارت‌های موبایل ===== */
.menu-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  position: relative;
}

.menu-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* سطح‌بندی کارت‌ها */
.menu-card.level-1 {
  border-right: 4px solid #60a5fa;
  background: #f8faff;
}

.menu-card.level-2 {
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

.menu-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.menu-icon {
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

.menu-info {
  flex: 1;
  min-width: 0;
}

.menu-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-id {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 2px;
}

/* بدنه کارت */
.menu-card-body {
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

/* دکمه‌ها */
.menu-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.menu-card-actions .btn {
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

  .menu-card {
    padding: 12px;
  }

  .menu-card.level-2 {
    margin-right: 8px;
  }

  .menu-icon {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }

  .menu-name {
    font-size: 0.9rem;
  }

  .info-row {
    font-size: 0.75rem;
  }

  .info-row > i {
    font-size: 0.82rem;
    width: 14px;
  }

  .menu-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .menu-cards {
    display: none;
  }
}
</style>