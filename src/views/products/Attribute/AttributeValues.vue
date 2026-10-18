<template>
  <div class="attribute-values-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['attributes_view'])">
    <div class="row g-3">

      <!-- ===== فرم (در موبایل بالا، در دسکتاپ چپ) ===== -->
      <div class="col-12 col-md-5 order-1 order-md-2">
        <div class="card form-card">
          <div class="card-header form-card-header">
            <h5 class="mb-0 form-title">
              <i class="bi" :class="form.id ? 'bi-pencil-square' : 'bi-plus-circle'"></i>
              {{ form.id ? "ویرایش مقدار" : "افزودن مقدار جدید" }}
            </h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveValue">
              <div class="mb-3">
                <label class="form-label">
                  <i class="bi bi-tag"></i>
                  مقدار
                </label>
                <input
                  v-model="form.value"
                  type="text"
                  class="form-control"
                  placeholder="مقدار ویژگی را وارد کنید"
                />
              </div>

              <div class="mb-3" v-if="attributeType">
                <label class="form-label">
                  <i class="bi" :class="attributeType == 'code' ? 'bi-palette' : 'bi-image'"></i>
                  {{ attributeType == 'code' ? "رنگ" : form.id ? "آپلود تصویر جدید" : "انتخاب تصویر" }}
                </label>

                <input
                  v-if="attributeType == 'code'"
                  v-model="form.extra_value"
                  type="color"
                  class="form-control color-input"
                />

                <VueFileAgent
                  v-else-if="attributeType == 'image'"
                  @select="imageLoaded"
                  :maxFiles="1"
                  accept=".pdf,.jpg,.png,.webp"
                  theme="grid"
                  deletable
                  sortable
                />
              </div>

              <div class="form-actions">
                <button :disabled="loading" type="submit" class="btn btn-primary flex-fill">
                  <i class="bi bi-save2"></i>
                  <span>{{ form.id ? "به‌روزرسانی" : "ثبت" }}</span>
                </button>
                <button
                  v-if="form.id"
                  type="button"
                  class="btn btn-secondary"
                  @click="resetForm"
                >
                  <i class="bi bi-x"></i>
                  <span>انصراف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ===== جدول (در موبایل پایین، در دسکتاپ راست) ===== -->
      <div class="col-12 col-md-7 order-2 order-md-1">
        <div class="card">
          <div class="card-header list-card-header">
            <h5 class="mb-0 list-title">
              <i class="bi bi-list-ul"></i>
              لیست مقادیر ویژگی
              <b class="attribute-name-badge">{{ attribute }}</b>
            </h5>
          </div>

          <div class="card-body p-2 p-md-3">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>

            <div v-else>
              <!-- ===== حالت خالی ===== -->
              <div v-if="values.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                <p>مقداری یافت نشد</p>
              </div>

              <!-- ===== نمایش جدول در دسکتاپ ===== -->
              <div v-else class="table-responsive d-none d-md-block">
                <table class="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>شناسه</th>
                      <th>مقدار</th>
                      <th v-if="attributeType">
                        {{ attributeType == 'code' ? 'رنگ' : 'تصویر' }}
                      </th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="val in values" :key="val.id">
                      <td>{{ val.id }}</td>
                      <td class="value-cell">{{ val.value }}</td>
                      <td v-if="attributeType">
                        <div
                          v-if="attributeType == 'code'"
                          class="colorcode"
                          :style="{ backgroundColor: val.extra_value }"
                        ></div>
                        <img
                          width="64"
                          :src="finderImage(val.extra_value)"
                          v-else-if="val.extra_value"
                          class="imageExtra"
                        />
                      </td>
                      <td>
                        <div class="d-flex flex-wrap gap-1">
                          <button class="btn btn-sm btn-warning" @click="editValue(val)">
                            <i class="bi bi-pen"></i>
                            <span>ویرایش</span>
                          </button>
                          <button class="btn btn-sm btn-danger" @click="deleteValue(val.id)">
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
              <div v-if="values.length > 0" class="d-md-none value-cards">
                <div
                  v-for="val in values"
                  :key="val.id"
                  class="value-card"
                >
                  <div class="value-card-header">
                    <div class="value-id-badge">#{{ val.id }}</div>
                    <div class="value-name">{{ val.value }}</div>

                    <!-- پیش‌نمایش رنگ/تصویر -->
                    <div v-if="attributeType" class="value-preview">
                      <div
                        v-if="attributeType == 'code'"
                        class="colorcode-sm"
                        :style="{ backgroundColor: val.extra_value }"
                        :title="val.extra_value"
                      ></div>
                      <img
                        v-else-if="val.extra_value"
                        :src="finderImage(val.extra_value)"
                        class="imageExtra-sm"
                        alt="تصویر"
                      />
                    </div>
                  </div>

                  <div class="value-card-actions">
                    <button class="btn btn-sm btn-warning flex-fill" @click="editValue(val)">
                      <i class="bi bi-pen"></i>
                      <span>ویرایش</span>
                    </button>
                    <button class="btn btn-sm btn-danger flex-fill" @click="deleteValue(val.id)">
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

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useRoute } from "vue-router";
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useAdmin } from '@/stores/modules/admin';

const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();
const attributeId = route.params.id;
const errors = reactive({})

const values = ref([]);
let loading = ref(false);

const form = ref({
  id: null,
  value: "",
  extra_value: ""
});

function finderImage(path) {
  return `${baseImageAddress}${path}`
}

function imageLoaded(files) {
  form.value.extra_value = files[0].file
}

let attribute = ref("");
let attributeType = ref("");
let currentUrl = `/attributes/${attributeId}/values`;

const getAttribute = async () => {
  const res = await axios.get(`/attributes/${attributeId}`)
  attribute.value = res.data.data.name
  attributeType.value = res.data.data.value_type
}
getAttribute();

const getValues = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url);
    values.value = data.data;
    currentUrl = url;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const saveValue = async () => {
  let formData = new FormData();
  formData.append("attribute_id", attributeId)
  formData.append("value", form.value.value)
  if (attributeType.value) {
    formData.append("extra_value", form.value.extra_value)
  }
  loading.value = true;
  try {
    if (form.value.id) {
      formData.append("_method", "PUT")
      await axios.post(`/attributes/${attributeId}/values/${form.value.id}`, formData);
      toast.success('مقدار ویرایش شد ✅')
      resetForm();
      getValues();
    } else {
      await axios.post(`/attributes/${attributeId}/values`, formData);
      toast.success('مقدار با موفقیت اضافه شد ✅')
      resetForm();
      getValues();
    }
  } catch (err) {
    if (err.response?.status === 422) {
      toast.error(err.response.data.message)
    }
  } finally {
    loading.value = false;
  }
};

const editValue = (val) => {
  console.log(val);
  form.value = { ...val };

  // ✅ اسکرول به فرم توی موبایل
  if (window.innerWidth < 768) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const resetForm = () => {
  form.value = { id: null, value: "" };
};

const deleteValue = (id) => {
  Swal.fire({
    title: "حذف مقدار",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/attributes/${attributeId}/values/${id}`);
        Swal.fire("موفق", "مقدار حذف شد", "success");
        getValues();
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

onMounted(() => {
  getValues();
});
</script>

<style scoped>
/* ===== کارت فرم ===== */
.form-card {
  border: none;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.form-card-header {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 14px 20px;
  border-bottom: none;
}

.form-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.form-card .card-body {
  padding: 20px;
}

.form-label {
  font-weight: 600;
  color: #2d3436;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.form-label i {
  color: #3b82f6;
}

.form-control {
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.color-input {
  height: 48px;
  padding: 4px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
}

.form-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
}

/* ===== کارت لیست ===== */
.list-card-header {
  padding: 14px 20px;
  background: transparent;
  border-bottom: 2px solid #f8f9fa;
}

.list-title {
  font-weight: 600;
  color: #2d3436;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 1rem;
}

.attribute-name-badge {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
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

.value-cell {
  max-width: 150px;
  word-break: break-word;
}

/* ===== پیش‌نمایش رنگ ===== */
.colorcode {
  width: 68px;
  height: 34px;
  border-radius: 8px;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.imageExtra {
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

/* ===== کارت‌های موبایل ===== */
.value-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.value-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.value-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.value-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.value-id-badge {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.value-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 0.95rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value-preview {
  flex-shrink: 0;
}

.colorcode-sm {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.imageExtra-sm {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.value-card-actions {
  display: flex;
  gap: 8px;
}

.value-card-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.78rem;
  padding: 8px 10px;
  font-weight: 600;
}

/* ========================================= */
/* ===== موبایل (کمتر از 768px) ===== */
/* ========================================= */
@media (max-width: 767.98px) {
  .form-card .card-body {
    padding: 14px;
  }

  .form-card-header,
  .list-card-header {
    padding: 12px 14px;
  }

  .form-title,
  .list-title {
    font-size: 0.95rem;
  }

  .form-actions .btn {
    padding: 9px 14px;
    font-size: 0.88rem;
  }
}

/* ========================================= */
/* ===== موبایل کوچک (کمتر از 400px) ===== */
/* ========================================= */
@media (max-width: 399.98px) {
  .form-title,
  .list-title {
    font-size: 0.88rem;
  }

  .attribute-name-badge {
    font-size: 0.78rem;
    padding: 3px 10px;
  }

  .value-card {
    padding: 10px;
  }

  .value-name {
    font-size: 0.88rem;
  }

  .value-card-actions .btn {
    font-size: 0.72rem;
    padding: 6px 8px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .value-cards {
    display: none;
  }
}
</style>