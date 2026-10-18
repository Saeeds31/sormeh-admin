<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 cities-page" v-if="checkPermission(['province_view'])">

    <!-- فیلتر و هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
          <h3 class="mb-0 page-title">
            <i class="bi bi-pin-map"></i>
            <span>مدیریت شهرها</span>
          </h3>
          <router-link to="/location/cities/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن شهر</span>
          </router-link>
        </div>
      </div>

      <div class="card-body p-2 p-md-3">
        <form @submit.prevent="getCities()">
          <div class="row g-2">
            <div class="col-12 col-sm-6 col-md-4">
              <input
                v-model="filters.search"
                type="text"
                class="form-control search-input"
                placeholder="جستجو بر اساس نام شهر"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-4">
              <select v-model="filters.province_id" class="form-select">
                <option value="">همه استان‌ها</option>
                <option v-for="prov in provinces" :key="prov.id" :value="prov.id">
                  {{ prov.name }}
                </option>
              </select>
            </div>
            <div class="col-12 col-md-2">
              <button class="btn btn-primary w-100 search-btn" type="submit">
                <i class="bi bi-search"></i>
                <span>جستجو</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- لیست -->
    <div class="card">
      <div class="card-body p-2 p-md-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>

        <div v-else>
          <!-- حالت خالی -->
          <div v-if="!cities.data || cities.data.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>شهری یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered table-striped mb-0">
                <thead>
                  <tr>
                    <th>شناسه</th>
                    <th>نام شهر</th>
                    <th>استان</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="city in cities.data" :key="city.id">
                    <td class="city-id">{{ city.id }}</td>
                    <td class="city-name">
                      <i class="bi bi-geo-alt-fill"></i>
                      {{ city.name }}
                    </td>
                    <td>
                      <span v-if="city.province" class="province-badge">
                        <i class="bi bi-map"></i>
                        {{ city.province.name }}
                      </span>
                      <span v-else class="text-muted">---</span>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        <router-link :to="`/location/cities/${city.id}/edit`" class="btn btn-sm btn-warning">
                          <i class="bi bi-pen"></i>
                          <span>ویرایش</span>
                        </router-link>
                        <button class="btn btn-sm btn-danger" @click="deleteCity(city.id)">
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
            <div class="d-md-none city-cards">
              <div
                v-for="city in cities.data"
                :key="city.id"
                class="city-card"
              >
                <div class="city-card-header">
                  <div class="city-icon">
                    <i class="bi bi-geo-alt-fill"></i>
                  </div>
                  <div class="city-info">
                    <div class="city-name">{{ city.name }}</div>
                    <div class="city-id">شناسه: #{{ city.id }}</div>
                  </div>
                </div>

                <div class="city-card-body">
                  <div class="info-row">
                    <i class="bi bi-map"></i>
                    <span class="info-label">استان:</span>
                    <span v-if="city.province" class="province-badge-sm">
                      {{ city.province.name }}
                    </span>
                    <span v-else class="info-value muted">---</span>
                  </div>
                </div>

                <div class="city-card-actions">
                  <router-link :to="`/location/cities/${city.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                    <i class="bi bi-pen"></i>
                    <span>ویرایش</span>
                  </router-link>
                  <button class="btn btn-sm btn-danger flex-fill" @click="deleteCity(city.id)">
                    <i class="bi bi-trash3-fill"></i>
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- صفحه بندی -->
          <b-pagination
            v-model="currentPage"
            :total-rows="cities.total"
            v-if="cities.last_page != 1"
            :per-page="cities.per_page"
            @Update:modelValue="changePage"
            align="center"
            class="mt-3 pagination-responsive"
          ></b-pagination>
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
const cities = ref({ data: [], meta: null });
const provinces = ref([]);
const loading = ref(false);
const filters = ref({ search: "", province_id: "" });
let currentUrl = "/cities";

const getCities = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url, { params: filters.value });
    cities.value = data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const getProvinces = async () => {
  try {
    const { data } = await axios.get("/provinces");
    provinces.value = data.data;
  } catch (err) {
    console.error(err);
  }
};

const changePage = (page) => {
  if (page) getCities(`${currentUrl}?page=${page}`);
  else currentUrl = "/cities"
};

const deleteCity = (id) => {
  Swal.fire({
    title: "حذف شهر",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/cities/${id}`);
        Swal.fire("موفق", "شهر حذف شد", "success");
        getCities();
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

onMounted(() => {
  getProvinces();
  getCities();
});
</script>

<style scoped>
/* ===== هدر ===== */
.header-card .card-header {
  padding: 16px 20px 8px;
  background: transparent;
  border-bottom: none;
}

.header-card .card-body {
  padding: 8px 20px 16px;
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

.search-input {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
}

.search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
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

.city-id {
  font-weight: 700;
  color: #6c757d;
}

.city-name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.city-name i {
  color: #6c5ce7;
  font-size: 0.9rem;
}

/* بج استان */
.province-badge {
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
.city-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.city-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.city-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.city-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.city-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.25);
}

.city-info {
  flex: 1;
  min-width: 0;
}

.city-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city-id {
  font-size: 0.72rem;
  color: #6c757d;
  margin-top: 2px;
}

.city-card-body {
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
}

.info-value.muted {
  color: #adb5bd;
}

.province-badge-sm {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 20px;
  margin-right: auto;
}

.city-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.city-card-actions .btn {
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
    padding: 12px 14px 6px;
  }

  .header-card .card-body {
    padding: 6px 14px 14px;
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

  .city-card {
    padding: 12px;
  }

  .city-icon {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }

  .city-name {
    font-size: 0.9rem;
  }

  .info-row {
    font-size: 0.78rem;
  }

  .city-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .city-cards {
    display: none;
  }
}
</style>