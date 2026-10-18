<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 article-categories-page" v-if="checkPermission(['articlecategory_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-list-stars"></i>
            <span>مدیریت دسته بندی</span>
          </h3>
          <router-link to="/articles/categories/create" class="btn btn-primary add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن دسته بندی</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- حالت لودینگ -->
    <div v-if="!categories.data || categories.data.length === 0" class="card">
      <div class="card-body text-center py-5 text-muted">
        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
        <p>دسته‌بندی‌ای یافت نشد</p>
      </div>
    </div>

    <template v-else>
      <!-- ===== جدول دسکتاپ (b-table) ===== -->
      <div class="card d-none d-md-block">
        <div class="card-body p-2 p-md-3">
          <div class="table-responsive">
            <b-table
              class="table table-bordered table-striped mb-0 category-table"
              striped
              hover
              :items="categories.data"
              :fields="fields"
            >
              <template #cell(parent)="data">
                <span v-if="data.item.parent" class="parent-badge">
                  <i class="bi bi-folder2"></i>
                  {{ data.item.parent.title }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>

              <template #cell(actions)="data">
                <div class="d-flex flex-wrap gap-1">
                  <router-link :to="`/articles/categories/${data.item.id}/edit`" class="btn btn-sm btn-warning">
                    <i class="bi bi-pen"></i>
                    <span>ویرایش</span>
                  </router-link>
                  <button class="btn btn-sm btn-danger" @click="confirmDelete(data.item.id)">
                    <i class="bi bi-trash3-fill"></i>
                    <span>حذف</span>
                  </button>
                </div>
              </template>
            </b-table>
          </div>
        </div>
      </div>

      <!-- ===== کارت موبایل ===== -->
      <div class="d-md-none category-cards">
        <div
          v-for="category in categories.data"
          :key="category.id"
          class="category-card"
        >
          <div class="category-card-header">
            <div class="category-icon">
              <i class="bi bi-folder-fill"></i>
            </div>
            <div class="category-info">
              <div class="category-name">{{ category.title }}</div>
              <div class="category-id">شناسه: #{{ category.id }}</div>
            </div>
          </div>

          <div class="category-card-body">
            <div class="info-row">
              <i class="bi bi-link-45deg"></i>
              <span class="info-label">اسلاگ:</span>
              <span class="info-value slug-value">{{ category.slug || '---' }}</span>
            </div>

            <div class="info-row">
              <i class="bi bi-diagram-3"></i>
              <span class="info-label">والد:</span>
              <span v-if="category.parent" class="parent-badge-sm">
                {{ category.parent.title }}
              </span>
              <span v-else class="info-value muted">---</span>
            </div>
          </div>

          <div class="category-card-actions">
            <router-link :to="`/articles/categories/${category.id}/edit`" class="btn btn-sm btn-warning flex-fill">
              <i class="bi bi-pen"></i>
              <span>ویرایش</span>
            </router-link>
            <button class="btn btn-sm btn-danger flex-fill" @click="confirmDelete(category.id)">
              <i class="bi bi-trash3-fill"></i>
              <span>حذف</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Pagination -->
    <b-pagination
      v-model="currentPage"
      :total-rows="categories.total"
      v-if="categories.last_page != 1"
      :per-page="categories.per_page"
      @Update:modelValue="fetchCategories"
      align="center"
      class="mt-3 pagination-responsive"
    ></b-pagination>
  </div>
</template>

<script setup>
/* ===== بدون هیچ تغییری در منطق ===== */
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useRoute, useRouter } from 'vue-router'
let router = useRouter();
let route = useRoute();
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;

const categories = ref({
    data: [],
    total: 0,
    per_page: 10,
    current_page: 1,
})
const currentPage = ref(1)

const fields = [
    { key: 'id', label: 'شناسه' },
    { key: 'title', label: 'عنوان' },
    { key: 'slug', label: 'اسلاگ' },
    { key: 'parent', label: 'والد' },
    { key: 'actions', label: 'عملیات' },
]

const fetchCategories = async (page = 1) => {
    try {
        router.replace({ name: route.name, query: { page: page } })
        const res = await axios.get(`/article-categories?page=${page}`)
        categories.value = res.data.data
        currentPage.value = res.data.data.current_page
    } catch (error) {
        console.error(error)
    }
}

const confirmDelete = (id) => {
    Swal.fire({
        title: 'آیا مطمئن هستید?',
        text: "این عملیات بازگشت پذیر نیست!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'بله انجام شود!',
        cancelButtonText: 'لغو',
    }).then((result) => {
        if (result.isConfirmed) {
            deleteCategory(id)
        }
    })
}

const deleteCategory = async (id) => {
    try {
        await axios.delete(`/article-categories/${id}`)
        Swal.fire('پاک شد!', 'با موفقیت حذف شد.', 'success')
        fetchCategories(currentPage.value)
    } catch (error) {
        console.error(error)
        Swal.fire('Error!', error.response.data.message ?? 'خطایی در حذف رخ داد', 'error')
    }
}

onMounted(() => {
    fetchCategories()
})
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

/* ===== جدول دسکتاپ ===== */
.category-table {
  margin-bottom: 0;
}

.category-table :deep(thead th) {
  background: #f8f9fa;
  font-weight: 600;
  color: #2d3436;
  white-space: nowrap;
  font-size: 0.9rem;
  vertical-align: middle;
}

.category-table :deep(tbody td) {
  vertical-align: middle;
  font-size: 0.9rem;
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
.category-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.category-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
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
  background: linear-gradient(135deg, #f39c12, #fdcb6e);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.25);
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
  font-size: 0.85rem;
}

.info-row > i {
  color: #6c5ce7;
  font-size: 0.95rem;
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

.slug-value {
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-family: 'Courier New', monospace;
  direction: ltr;
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
  margin-right: auto;
}

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

  .category-card {
    padding: 12px;
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
    font-size: 0.78rem;
  }

  .category-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}
</style>