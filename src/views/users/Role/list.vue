<template>
  <div class="roles-page container mt-3 mt-md-4 px-2 px-md-3" v-if="checkPermission(['role_view'])">

    <!-- هدر -->
    <div class="card mb-2 header-card">
      <div class="card-header">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
          <h3 class="mb-0 page-title">
            <i class="bi bi-person-rolodex"></i>
            <span>مدیریت نقش</span>
          </h3>
          <router-link to="/users/roles/create" class="btn btn-success add-btn">
            <i class="bi bi-plus"></i>
            <span>افزودن نقش</span>
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
          <!-- ===== نمایش جدول در دسکتاپ ===== -->
          <div class="table-responsive d-none d-md-block">
            <table class="table table-bordered table-striped mb-0">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>نام نقش</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="role in roles" :key="role.id">
                  <td>{{ role.id }}</td>
                  <td>
                    {{ role.name }}
                    <span v-if="role.is_system" class="system-badge">
                      <i class="bi bi-shield-lock-fill"></i>
                      سیستمی
                    </span>
                  </td>
                  <td v-if="!role.is_system">
                    <div class="d-flex flex-wrap gap-1">
                      <router-link :to="`/users/roles/${role.id}/edit`" class="btn btn-sm btn-warning">
                        <i class="bi bi-pen"></i>
                        <span>ویرایش</span>
                      </router-link>

                      <button class="btn btn-sm btn-danger" @click="deleteRole(role.id)">
                        <i class="bi bi-trash3-fill"></i>
                        <span>حذف</span>
                      </button>

                      <button
                        class="btn btn-sm btn-success"
                        v-if="checkPermission(['role_permission'])"
                        @click="showModalPermission(role)"
                      >
                        <i class="bi bi-person-exclamation"></i>
                        <span>دسترسی‌ها</span>
                      </button>
                    </div>
                  </td>
                  <td v-else class="text-center text-muted">
                    <i class="bi bi-lock-fill"></i>
                    <span class="ms-1">نقش سیستمی</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ===== نمایش کارتی در موبایل ===== -->
          <div class="d-md-none role-cards">
            <div
              v-for="role in roles"
              :key="role.id"
              class="role-card"
              :class="{ 'is-system': role.is_system }"
            >
              <div class="role-card-header">
                <div class="role-id-badge">#{{ role.id }}</div>
                <div class="role-name">
                  {{ role.name }}
                  <span v-if="role.is_system" class="system-badge-sm">
                    <i class="bi bi-shield-lock-fill"></i>
                    سیستمی
                  </span>
                </div>
              </div>

              <!-- عملیات -->
              <div v-if="!role.is_system" class="role-card-actions">
                <router-link :to="`/users/roles/${role.id}/edit`" class="btn btn-sm btn-warning flex-fill">
                  <i class="bi bi-pen"></i>
                  <span>ویرایش</span>
                </router-link>

                <button class="btn btn-sm btn-danger flex-fill" @click="deleteRole(role.id)">
                  <i class="bi bi-trash3-fill"></i>
                  <span>حذف</span>
                </button>

                <button
                  class="btn btn-sm btn-success flex-fill"
                  v-if="checkPermission(['role_permission'])"
                  @click="showModalPermission(role)"
                >
                  <i class="bi bi-person-exclamation"></i>
                  <span>دسترسی‌ها</span>
                </button>
              </div>

              <!-- نقش سیستمی -->
              <div v-else class="role-card-system">
                <i class="bi bi-lock-fill"></i>
                <span>این نقش سیستمی است و قابل ویرایش یا حذف نیست</span>
              </div>
            </div>

            <!-- حالت خالی -->
            <div v-if="!roles || roles.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-1 d-block mb-2"></i>
              <p>نقشی یافت نشد</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- مودال دسترسی‌ها -->
    <Modal
      v-if="permissionModal"
      id="permissionModal"
      @closeModal="() => permissionModal = false"
      title="سطح دسترسی"
    >
      <b-form-group label="انتخاب دسترسی ها" label-for="permission_ids">
        <Treeselect
          id="permission_ids"
          v-if="allPermissions.length"
          :multiple="true"
          v-model="permission_ids"
          :normalizer="normalizer"
          :options="allPermissions"
          placeholder="انتخاب دسترسی ها"
          :clearable="true"
          :valueConsistsOf="'ALL'"
        />
      </b-form-group>
      <button @click="savePermissions()" class="btn btn-success w-100 w-sm-auto">
        <i class="bi bi-save"></i>
        <span>ذخیره دسترسی ها</span>
      </button>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "@/components/shared/modal.vue";
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { useAdmin } from '@/stores/modules/admin';
import { toast } from "vue3-toastify"
import "vue3-toastify/dist/index.css"

const store = useAdmin();
const checkPermission = store.checkPermission;
const roles = ref([]);
const loading = ref(false);
let currentUrl = "/roles";
let selectedRoleId = ref(null);
let permissionModal = ref(false);
let permission_ids = ref([]);

function showModalPermission(role) {
  selectedRoleId.value = role.id;
  permission_ids.value = role.permissions ? role.permissions.map(per => per.id) : [];
  permissionModal.value = true;
}

const normalizer = (node) => {
  return {
    id: node.id,
    label: node.label,
  }
}

async function savePermissions() {
  const fd = new FormData();
  fd.append("role_id", selectedRoleId.value);
  permission_ids.value.forEach((id, index) => {
    fd.append(`ids[${index}]`, id)
  });
  let res = await axios.post('/save-permissions', fd);
  permissionModal.value = false;
  if (res.data.success) {
    toast.success("با موفقیت ثبت شد ");
    getroles()
  } else {
    toast.error('خطایی در ثبت به وجود آمده است مجددا تلاش کنید')
  }
}

const getroles = async (url = currentUrl) => {
  loading.value = true;
  try {
    const { data } = await axios.get(url);
    roles.value = data.data;
    currentUrl = url;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

let allPermissions = ref([]);
async function getAllPermissions() {
  let res = await axios.get('/all-permissions');
  allPermissions.value = res.data.data;
}
getAllPermissions()

const deleteRole = (id) => {
  Swal.fire({
    title: "حذف نقش",
    text: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "بله، حذف شود",
    cancelButtonText: "انصراف",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`/roles/${id}`);
        Swal.fire("موفق", "نقش حذف شد", "success");
        getroles();
      } catch (err) {
        Swal.fire("خطا", "مشکلی در حذف پیش آمد", "error");
      }
    }
  });
};

onMounted(() => {
  getroles();
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

/* ===== بج نقش سیستمی ===== */
.system-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  margin-right: 8px;
  vertical-align: middle;
}

.system-badge-sm {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  margin-right: 6px;
  vertical-align: middle;
}

/* ===== کارت‌های موبایل ===== */
.role-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.role-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.role-card.is-system {
  background: linear-gradient(135deg, #f8f9ff, #f0f0ff);
  border-color: #e0e0ff;
}

.role-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 10px;
}

.role-id-badge {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.role-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-card-actions {
  display: flex;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.role-card-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.75rem;
  padding: 6px 8px;
  white-space: nowrap;
}

.role-card-system {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: #f0f0ff;
  border-radius: 8px;
  color: #6c5ce7;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 8px;
}

.role-card-system i {
  font-size: 1rem;
  flex-shrink: 0;
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

  .role-card {
    padding: 12px;
  }

  .role-name {
    font-size: 0.9rem;
  }

  .role-card-actions {
    flex-wrap: wrap;
  }

  .role-card-actions .btn {
    font-size: 0.7rem;
    padding: 5px 6px;
    flex: 1 1 calc(50% - 3px);
  }

  .role-card-actions .btn span {
    display: none;
  }

  .role-card-actions .btn i {
    font-size: 0.9rem;
  }

  .system-badge-sm {
    font-size: 0.6rem;
    padding: 2px 6px;
  }
}

/* ========================================= */
/* ===== دسکتاپ: مخفی کردن کارت‌ها ===== */
/* ========================================= */
@media (min-width: 768px) {
  .role-cards {
    display: none;
  }
}
</style>