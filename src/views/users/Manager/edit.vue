<template>
    <div class="container mt-4 bg-gray" v-if="checkPermission(['manager_update'])">
        <h3 class=" p-2">
            <i class="bi bi-person-workspace"></i>
            <span>
                تخصیص نقش به {{ user ? user.full_name : "کاربر" }}
            </span>
        </h3>
        <form @submit.prevent="submitForm" class="row g-3">
            <!-- انتخاب نقش‌ها -->
            <div class="col-md-12">
                <label class="form-label">نقش‌ها</label>
                <Treeselect v-model="selectedRoles" :multiple="true" v-if="roles.length" :options="roles"
                    placeholder="انتخاب نقش‌ها" label="name" value="id" />
            </div>

            <div class="col-12">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <i class="bi bi-save2"></i>
                    <span class="mx-2">

                        {{ loading ? 'در حال ذخیره...' : 'ذخیره نقش‌ها' }}
                    </span>
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { useRoute } from 'vue-router'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const selectedUser = ref(null)
const selectedRoles = ref([])
const route = useRoute();
const roles = ref([]);
const options = ref([]);
const loading = ref(false);
const user = ref({});
// بارگذاری نقش‌ها فقط یک بار
const fetchRoles = async () => {
    try {
        const { data } = await axios.get('/roles')
        roles.value = data.data.map(r => ({ id: r.id, label: r.name }))
    } catch (e) {
        console.log(e);
        toast.error('خطا در دریافت نقش‌ها')
    }
}
// بارگذاری نقش‌ها فقط یک بار
const fetchUser = async () => {
    try {
        const { data } = await axios.get(`/users/${route.params.id}`)
        user.value = data;
        selectedRoles.value = data.roles.map(role => role.id)
        fetchRoles();

    } catch (e) {
        console.log(e);
        toast.error('خطا در دریافت نقش‌ها')
    }
}

// سرچ کاربران به صورت async
const loadUsers = async (searchQuery) => {
    console.log(searchQuery);
    try {
        const { data } = await axios.get('/users?search=' + searchQuery ?? '')
        const ops = data.data.map(u => ({ id: u.id, label: `${u.full_name} (${u.mobile})` }))
        options.value = ops
    } catch (e) {
        console.log(e);
        toast.error('خطا در جستجوی کاربران')
    }
}

const submitForm = async () => {
    try {
        loading.value = true
        const formData = new FormData()
        formData.append('user_id', user.value.id);
        selectedRoles.value.forEach(roleId => formData.append('roles[]', roleId))
        await axios.post('/user-managers/assign-roles', formData)
        toast.success('نقش‌ها با موفقیت تخصیص داده شد')
    } catch (e) {
        toast.error('خطا در ذخیره نقش‌ها')
    } finally {
        loading.value = false
    }
}

onMounted(
    () => {
        fetchUser();
    }
)
</script>

<style scoped>
/* استایل دلخواه */
</style>