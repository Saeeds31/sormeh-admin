<template>
    <div class="container py-4" v-if="checkPermission(['coupon_update'])">
        <b-card>
            <h5 class="mb-3">ویرایش کوپن</h5>
            <b-form @submit.prevent="handleSubmit">
                <b-row>
                    <!-- همان فیلدها مانند Create -->
                    <!-- Code -->
                    <b-col cols="12" md="6">
                        <b-form-group label="کد کوپن" label-for="code">
                            <b-form-input id="code" v-model="form.code" :state="errors.code ? false : null" />
                            <small v-if="errors.code" class="text-danger">{{ errors.code[0] }}</small>
                        </b-form-group>
                    </b-col>

                    <!-- Type -->
                    <b-col cols="12" md="6">
                        <b-form-group label="نوع" label-for="type">
                            <b-form-select id="type" v-model="form.type" :options="typeOptions"
                                :state="errors.type ? false : null" />
                            <small v-if="errors.type" class="text-danger">{{ errors.type[0] }}</small>
                        </b-form-group>
                    </b-col>

                    <!-- سایر فیلدها مشابه Create ... -->
                    <!-- Value, Max Discount, Min Purchase, Usage Limits, Start/End Date, Status -->
                    <b-col cols="12" md="6" v-for="field in numberFields" :key="field.key">
                        <b-form-group :label="field.label" :label-for="field.key">
                            <b-form-input :id="field.key" type="number" v-model="form[field.key]"
                                :state="errors[field.key] ? false : null" />
                            <small v-if="errors[field.key]" class="text-danger">{{ errors[field.key][0] }}</small>
                        </b-form-group>
                    </b-col>
                    <b-col cols="12" md="6">
                        <b-form-group label="تاریخ شروع" label-for="start_date">
                            <date-picker display-format="jYYYY/jMM/jDD" format="YYYY-MM-DD"
                                v-model="form.start_date"></date-picker>
                            <small v-if="errors.start_date" class="text-danger">{{ errors.start_date[0] }}</small>
                        </b-form-group>
                    </b-col>

                    <!-- End Date -->
                    <b-col cols="12" md="6">
                        <b-form-group label="تاریخ پایان" label-for="end_date">
                            <date-picker display-format="jYYYY/jMM/jDD" format="YYYY-MM-DD"
                                v-model="form.end_date"></date-picker>

                            <small v-if="errors.end_date" class="text-danger">{{ errors.end_date[0] }}</small>
                        </b-form-group>
                    </b-col>

                    <!-- Status -->
                    <b-col cols="12" md="6">
                        <b-form-group label="وضعیت" label-for="status">
                            <b-form-checkbox id="status" v-model="form.status" :true-value="1" :false-value="0">
                                فعال
                            </b-form-checkbox>
                        </b-form-group>
                    </b-col>
                </b-row>

                <div class="mt-3">
                    <b-button  :disabled="loading"  type="submit" variant="primary">ویرایش کوپن</b-button>
                </div>
            </b-form>
        </b-card>
    </div>
</template>

<script setup>
import { reactive, onMounted ,ref} from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { BForm, BFormGroup, BFormInput, BFormSelect, BFormCheckbox, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'
import { useRoute } from 'vue-router'
import moment from 'moment-jalaali';

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();
const form = reactive({
    code: '',
    type: 'percentage',
    value: 0,
    max_discount: null,
    min_purchase: null,
    usage_limit: null,
    user_usage_limit: null,
    start_date: '',
    end_date: '',
    status: 1,
})
let loading = ref(false);

const errors = reactive({})
const typeOptions = [
    { value: 'percentage', text: 'درصدی' },
    { value: 'fixed', text: 'مقدار ثابت' }
]

const numberFields = [
    { key: 'value', label: 'مقدار' },
    { key: 'max_discount', label: 'حداکثر تخفیف' },
    { key: 'min_purchase', label: 'حداقل خرید' },
    { key: 'usage_limit', label: 'حداکثر استفاده کوپن' },
    { key: 'user_usage_limit', label: 'حداکثر استفاده کاربر' },
]

onMounted(async () => {
    try {
        const res = await axios.get(`/coupons/${route.params.id}`)
        Object.assign(form, res.data.data)
        form.status = Number(res.data.data.status)
    } catch (err) {
        toast.error('خطا در دریافت اطلاعات کوپن ❌')
    }
})

const handleSubmit = async () => {
    Object.keys(errors).forEach(k => delete errors[k])
    loading.value = true;
    let formData = new FormData();
    formData.append("_method", "PUT")
    for (const key in form) {
        formData.append(key, key == 'status' ? Number(form[key]) : form[key] ?? '')
    }
    try {
        await axios.post(`/coupons/${route.params.id}`, formData)
        toast.success('کوپن با موفقیت ویرایش شد ✅')
    } catch (err) {
        if (err.response?.status === 422) {
            Object.assign(errors, err.response.data.errors)
            toast.error('خطاهای فرم را بررسی کنید ❌')
        } else {
            toast.error('خطا در ارسال اطلاعات ❌')
        }
    } finally {
        loading.value = false;
    }
}
</script>