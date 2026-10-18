<template>
    <div class="container mt-4 bg-gray" v-if="checkPermission(['manager_store'])">
        <h3 class=" p-2">
            <i class="bi bi-person-workspace"></i>
            <span>
                تخصیص نقش به کاربر </span>
        </h3>
        <form @submit.prevent="submitForm" class="row g-3">

            <!-- انتخاب کاربر با سرچ لحظه‌ای -->
            <div class="col-md-12">
                <label class="form-label">انتخاب کاربر</label>

                <multiselect @search-change="loadUsers" v-model="selectedUser" placeholder="انتخاب کاربر"
                    open-direction="bottom" :options="options" label="label" track-by="id" :searchable="true"
                    :multiple="false" :close-on-select="true" :show-labels="false">
                    <template slot="noOptions">
                        جستجو کنید
                    </template>
                    <template slot="noResult">
                        <span v-if="isRequesting" v-text="'در حال جستجو...'" />
                        <span v-else v-text="'موردی یافت نشد'"></span>
                    </template>
                </multiselect>
            </div>

            <!-- انتخاب نقش‌ها -->
            <div class="col-md-12">
                <label class="form-label">نقش‌ها</label>
                <Treeselect v-model="selectedRoles" :multiple="true" :options="roles" placeholder="انتخاب نقش‌ها"
                    label="label" value="id" />
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const selectedUser = ref(null)
const selectedRoles = ref([])

const roles = ref([]);
const options = ref([]);
const loading = ref(false)
let abortController = null;

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

// سرچ کاربران به صورت async
const loadUsers = async (searchQuery) => {
    if (abortController) {
        abortController.abort();
    }
    abortController = new AbortController();
    try {
        const { data } = await axios.get('/users?search=' + searchQuery ?? '', {
            signal: abortController.signal,
        })
        const ops = data.data.map(u => ({ id: u.id, label: `${u.full_name} (${u.mobile})` }))
        options.value = ops;

    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('درخواست قبلی کنسل شد:', error.message);
        } else {
            toast.error('خطا در جستجوی کاربران')
        }
    }
}

const submitForm = async () => {
    if (!selectedUser.value) {
        toast.error('لطفاً یک کاربر انتخاب کنید')
        return
    }
    if (!selectedRoles.value.length) {
        toast.error('لطفاً یک نقش انتخاب کنید')
        return
    }
    try {
        loading.value = true
        const formData = new FormData()
        formData.append('user_id', selectedUser.value ? selectedUser.value.id : "")
        selectedRoles.value.forEach(roleId => formData.append('roles[]', roleId))
        await axios.post('/user-managers/assign-roles', formData)
        toast.success('نقش‌ها با موفقیت تخصیص داده شد')
    } catch (e) {
        toast.error('خطا در ذخیره نقش‌ها')
    } finally {
        loading.value = false
    }
}

onMounted(fetchRoles)
</script>

<style scoped>
/* استایل دلخواه */
</style>