<template>
  <div class="container mt-3 mt-md-4 px-2 px-md-3 sliders-page" v-if="checkPermission(['slider_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-sliders"></i>
            <span>مدیریت اسلایدرها</span>
          </h3>
          <router-link to="/content/sliders/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن اسلایدر</span>
          </router-link>
        </div>
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
          <div v-if="!sliders || sliders.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            <p>اسلایدری یافت نشد</p>
          </div>

          <template v-else>
            <!-- ===== جدول دسکتاپ ===== -->
            <div class="table-responsive d-none d-md-block">
              <table class="table table-bordered table-hover mb-0">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th class="text-center">نوع</th>
                    <th class="text-center">تصویر</th>
                    <th class="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="slider in sliders" :key="slider.id">
                    <td class="slider-title">{{ slider.title }}</td>
                    <td class="text-center">
                      <span
                        class="type-badge"
                        :class="slider.type == 'desktop' ? 'type-desktop' : 'type-mobile'"
                      >
                        <i class="bi" :class="slider.type == 'desktop' ? 'bi-display' : 'bi-phone'"></i>
                        {{ slider.type == "desktop" ? "دسکتاپ" : "موبایل" }}
                      </span>
                    </td>
                    <td class="text-center">
                      <img
                        v-if="slider.image"
                        :src="slider.image"
                        alt=""
                        class="slider-thumb"
                      >
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1 justify-content-center">
                        <router-link :to="`/content/sliders/${slider.id}/edit`" class="btn btn-sm btn-primary">
                          <i class="bi bi-pen"></i>
                          <span>ویرایش</span>
                        </router-link>
                        <button @click="deleteSlider(slider.id)" class="btn btn-sm btn-danger">
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
            <div class="d-md-none slider-cards">
              <div
                v-for="slider in sliders"
                :key="slider.id"
                class="slider-card"
              >
                <!-- تصویر اسلایدر -->
                <div class="slider-image-wrapper">
                  <img
                    v-if="slider.image"
                    :src="slider.image"
                    alt=""
                    class="slider-image"
                  >
                  <div v-else class="slider-no-image">
                    <i class="bi bi-image"></i>
                  </div>
                  <!-- بج نوع روی تصویر -->
                  <span
                    class="type-badge-overlay"
                    :class="slider.type == 'desktop' ? 'type-desktop' : 'type-mobile'"
                  >
                    <i class="bi" :class="slider.type == 'desktop' ? 'bi-display' : 'bi-phone'"></i>
                    {{ slider.type == "desktop" ? "دسکتاپ" : "موبایل" }}
                  </span>
                </div>

                <!-- عنوان -->
                <div class="slider-card-body">
                  <div class="slider-name">{{ slider.title }}</div>
                </div>

                <!-- دکمه‌ها -->
                <div class="slider-card-actions">
                  <router-link :to="`/content/sliders/${slider.id}/edit`" class="btn btn-sm btn-primary flex-fill">
                    <i class="bi bi-pen"></i>
                    <span>ویرایش</span>
                  </router-link>
                  <button @click="deleteSlider(slider.id)" class="btn btn-sm btn-danger flex-fill">
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
const sliders = ref({ data: [] });
const loading = ref(false);
const filters = ref({ search: "" });
let currentUrl = "/sliders";

const fetchData = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url, { params: filters.value });
    sliders.value = data.data.map(slide => ({ id: slide.id, title: slide.title, type: slide.type, image: baseImageAddress + slide.image, }));
  } finally {
    loading.value = false;
  }
};

const deleteSlider = async (id) => {
  const result = await Swal.fire({
    title: "آیا مطمئن هستید؟",
    text: "این عملیات قابل بازگشت نیست!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  });

  if (result.isConfirmed) {
    await axios.delete(`/sliders/${id}`);
    Swal.fire("حذف شد!", "اسلایدر با موفقیت حذف شد.", "success");
    fetchData();
  }
};

onMounted(() => {
  fetchData();
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

.slider-title {
  font-weight: 600;
  max-width: 250px;
  word-break: break-word;
}

/* تصویر جدول */
.slider-thumb {
  max-width: 100px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* بج نوع */
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.type-desktop {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
}

.type-mobile {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  color: #be185d;
}

/* ===== کارت‌های موبایل ===== */
.slider-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.slider-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  overflow: hidden;
}

.slider-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* تصویر */
.slider-image-wrapper {
  position: relative;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: #f8f9fa;
  margin-bottom: 10px;
}

.slider-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
  object-fit: cover;
}

.slider-no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #adb5bd;
  font-size: 2rem;
  background: #f8f9fa;
  border-radius: 10px;
}

/* بج نوع روی تصویر */
.type-badge-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* عنوان */
.slider-card-body {
  padding: 4px 4px 10px;
}

.slider-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 0.95rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* دکمه‌ها */
.slider-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.slider-card-actions .btn {
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

  .slider-card {
    padding: 10px;
  }

  .slider-name {
    font-size: 0.88rem;
  }

  .slider-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }

  .type-badge-overlay {
    font-size: 0.65rem;
    padding: 2px 8px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .slider-cards {
    display: none;
  }
}
</style>