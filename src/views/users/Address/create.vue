<template>
    <div class="container bg-gray mt-4" v-if="checkPermission(['address_store'])">
        <h3>
            <i class="bi bi-house-add"></i>
            <span>
                افزودن آدرس جدید
            </span>
        </h3>
        <form @submit.prevent="submitForm" class="row g-3">
            <!-- انتخاب استان -->
            <div class="col-md-6">
                <label class="form-label">استان</label>
                <Treeselect v-model="province_id" :multiple="false" :options="porvinceOptions"
                    @search-change="loadProvinces" placeholder="انتخاب استان..." />
                <small v-if="errors.province_id" class="text-danger">{{ errors.province_id[0] }}</small>

            </div>

            <!-- انتخاب شهر -->
            <div class="col-md-6">
                <label class="form-label">شهر</label>
                <Treeselect v-model="form.city_id" :multiple="false" :options="cities" @search-change="loadCities"
                    placeholder="انتخاب شهر..." :disabled="!province_id" />
                <small v-if="errors.city_id" class="text-danger">{{ errors.city_id[0] }}</small>

            </div>

            <!-- نام گیرنده -->
            <div class="col-md-6">
                <label class="form-label">نام گیرنده</label>
                <input v-model="form.receiver_name" type="text" class="form-control" />
                <small v-if="errors.receiver_name" class="text-danger">{{ errors.receiver_name[0] }}</small>

            </div>

            <!-- کد پستی -->
            <div class="col-md-6">
                <label class="form-label">کد پستی</label>
                <input v-model="form.postal_code" type="text" class="form-control" />
                <small v-if="errors.postal_code" class="text-danger">{{ errors.postal_code[0] }}</small>

            </div>

            <!-- آدرس -->
            <div class="col-md-6">
                <label class="form-label">آدرس</label>
                <textarea v-model="form.address_line" class="form-control"></textarea>
                <small v-if="errors.address_line" class="text-danger">{{ errors.address_line[0] }}</small>

            </div>

            <!-- تلفن -->
            <div class="col-md-6">
                <label class="form-label">تلفن</label>
                <input v-model="form.phone" type="text" class="form-control" />
                <small v-if="errors.phone" class="text-danger">{{ errors.phone[0] }}</small>

            </div>

            <div class="col-12">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <i class="bi bi-save2"></i>
                    {{ loading ? 'در حال ذخیره...' : 'ذخیره' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { useRoute } from 'vue-router'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const form = ref({
    receiver_name: '',
    city_id: null,
    postal_code: '',
    address_line: '',
    phone: '',
})
const route = useRoute();
const porvinceOptions = ref([]);
const cities = ref([])
const loading = ref(false)
let province_id = ref(null);
const loadProvinces = async () => {
    try {
        const { data } = await axios.get('/provinces')
        porvinceOptions.value = data.data.map(p => ({ id: p.id, label: p.name, cities: p.cities }))
    } catch {
        toast.error('خطا در بارگذاری استان‌ها')
    }
}
loadProvinces()

watch(() => province_id.value, (newSelect) => {
    provinceChanged(newSelect)
})
const errors = reactive({})

const provinceChanged = async (province_id) => {
    form.city_id = null;
    if (!province_id) {
        cities.value = []
        form.city_id = null
        return
    }
    try {
        let province = porvinceOptions.value.find((prov) => prov.id === province_id)
        cities.value = province.cities.map(c => ({ id: c.id, label: c.name, value: c.id }))

    } catch (e) {
        console.log(e);
        toast.error('مشکلی در لود شهرها به وجود آمد')
    }
}

// Submit
const submitForm = async () => {
    loading.value = true
    try {
        const formData = new FormData()
        formData.append("province_id", province_id.value)
        formData.append("user_id", route.params.id)
        Object.keys(form.value).forEach(key => formData.append(key, form.value[key]))
        await axios.post(`/users/${route.params.id}/addresses`, formData)
        toast.success('آدرس با موفقیت ذخیره شد')
        // ریست فرم
        Object.keys(form.value).forEach(k => form.value[k] = k.includes('_id') ? null : '')
    } catch (err) {
        Object.assign(errors, err.response.data.errors)

        toast.error('خطا در ذخیره آدرس')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* استایل دلخواه */
</style>