<template>
    <div class="container mt-4 bg-gray" v-if="checkPermission(['user_update'])">
        <h3 class="p-2">
            <i class="bi bi-people"></i>
            <span>
                ویرایش کاربر
            </span>
        </h3>
        <form @submit.prevent="updateForm" class="bg-light p-3 rounded row g-3">
            <!-- نام کامل -->
            <div class="col-md-6">
                <label class="form-label">نام کامل</label>
                <input v-model="form.full_name" type="text" class="form-control" required maxlength="255" />
                <small v-if="errors.full_name" class="text-danger">{{ errors.full_name[0] }}</small>
            </div>

            <!-- موبایل -->
            <div class="col-md-6">
                <label class="form-label">شماره موبایل</label>
                <input  v-model="form.mobile" type="text" class="form-control" required maxlength="11"
                    minlength="11" />
                <small v-if="errors.mobile" class="text-danger">{{ errors.mobile[0] }}</small>
            </div>

            <!-- رمز عبور -->
            <div class="col-md-6">
                <label class="form-label">رمز عبور (در صورت نیاز تغییر دهید)</label>
                <input v-model="form.password" type="password" class="form-control" minlength="6" />
                <small v-if="errors.password" class="text-danger">{{ errors.password[0] }}</small>
            </div>

            <!-- کد ملی -->
            <div class="col-md-6">
                <label class="form-label">کد ملی (اختیاری)</label>
                <input v-model="form.national_code" type="text" class="form-control" maxlength="10" minlength="10" />
                <small v-if="errors.national_code" class="text-danger">{{ errors.national_code[0] }}</small>
            </div>

            <!-- تاریخ تولد -->
            <div class="col-md-6">
                <label class="form-label">تاریخ تولد (اختیاری)</label>
                <date-picker display-format="jYYYY/jMM/jDD" format="YYYY-MM-DD" v-model="form.birth_date"></date-picker>

                <small v-if="errors.birth_date" class="text-danger">{{ errors.birth_date[0] }}</small>
            </div>

            <div class="col-12">
                <button type="submit" class="btn btn-success" :disabled="loading">
                    <i class="bi bi-save2"></i>
                    <span class="mx-2">
                        {{ loading ? 'در حال بروزرسانی...' : 'بروزرسانی' }}
                    </span>
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import moment from 'moment-jalaali';

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute()
const router = useRouter()
const errors = reactive({})

const form = ref({
    full_name: '',
    mobile: '',
    password: '',
    national_code: '',
    birth_date: '',
})

const loading = ref(false)

const fetchData = async () => {
    try {
        const { data } = await axios.get(`/users/${route.params.id}`)
        form.value.full_name = data.full_name
        form.value.mobile = data.mobile
        form.value.national_code = data.national_code
        form.value.birth_date = data.birth_date
    } catch (e) {
        toast.error('خطا در دریافت اطلاعات کاربر')
    }
}

const updateForm = async () => {
    Object.keys(errors).forEach(k => delete errors[k])

    try {
        loading.value = true
        const formData = new FormData()
        for (let key in form.value) {
            if (form.value[key]) formData.append(key, form.value[key])
        }
        formData.append("_method", "PUT")
        await axios.post(`/users/${route.params.id}`, formData)
        toast.success('کاربر با موفقیت بروزرسانی شد')
    } catch (e) {
        Object.assign(errors, e.response.data.errors)

        toast.error('خطا در بروزرسانی کاربر')
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)
</script>

<style scoped>
/* استایل دلخواه */
</style>