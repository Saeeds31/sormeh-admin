<template>
  <div class="container py-4" v-if="checkPermission(['coupon_store'])">
    <b-card>
      <h5 class="mb-3">ایجاد کوپن</h5>
      <b-form @submit.prevent="handleSubmit">
        <b-row>
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
              <b-form-select id="type" v-model="form.type" :options="typeOptions" :state="errors.type ? false : null" />
              <small v-if="errors.type" class="text-danger">{{ errors.type[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Value -->
          <b-col cols="12" md="6">
            <b-form-group label="مقدار" label-for="value">
              <b-form-input id="value" type="number" v-model="form.value" :state="errors.value ? false : null" />
              <small v-if="errors.value" class="text-danger">{{ errors.value[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Max Discount -->
          <b-col cols="12" md="6">
            <b-form-group label="حداکثر تخفیف" label-for="max_discount">
              <b-form-input id="max_discount" type="number" v-model="form.max_discount"
                :state="errors.max_discount ? false : null" />
              <small v-if="errors.max_discount" class="text-danger">{{ errors.max_discount[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Min Purchase -->
          <b-col cols="12" md="6">
            <b-form-group label="حداقل خرید" label-for="min_purchase">
              <b-form-input id="min_purchase" type="number" v-model="form.min_purchase"
                :state="errors.min_purchase ? false : null" />
              <small v-if="errors.min_purchase" class="text-danger">{{ errors.min_purchase[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Usage Limit -->
          <b-col cols="12" md="6">
            <b-form-group label="حداکثر استفاده کوپن" label-for="usage_limit">
              <b-form-input id="usage_limit" type="number" v-model="form.usage_limit"
                :state="errors.usage_limit ? false : null" />
              <small v-if="errors.usage_limit" class="text-danger">{{ errors.usage_limit[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- User Usage Limit -->
          <b-col cols="12" md="6">
            <b-form-group label="حداکثر استفاده کاربر" label-for="user_usage_limit">
              <b-form-input id="user_usage_limit" type="number" v-model="form.user_usage_limit"
                :state="errors.user_usage_limit ? false : null" />
              <small v-if="errors.user_usage_limit" class="text-danger">{{ errors.user_usage_limit[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Start Date -->
          <b-col cols="12" md="6">
            <b-form-group label="تاریخ شروع" label-for="start_date">
              <date-picker display-format="jYYYY/jMM/jDD" format="YYYY-MM-DD" v-model="form.start_date"></date-picker>
              <small v-if="errors.start_date" class="text-danger">{{ errors.start_date[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- End Date -->
          <b-col cols="12" md="6">
            <b-form-group label="تاریخ پایان" label-for="end_date">
              <date-picker display-format="jYYYY/jMM/jDD" format="YYYY-MM-DD" v-model="form.end_date"></date-picker>

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
          <b-button :disabled="loading" type="submit" variant="success">ایجاد کوپن</b-button>
        </div>
      </b-form>
    </b-card>
  </div>
</template>

<script setup>
import moment from 'moment-jalaali';
import { reactive,ref } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { BForm, BFormGroup, BFormInput, BFormSelect, BFormCheckbox, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
let loading = ref(false);

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

const errors = reactive({})
const typeOptions = [
  { value: 'percentage', text: 'درصدی' },
  { value: 'fixed', text: 'مقدار ثابت' }
]

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  const formData = new FormData()
  for (const key in form) {

    formData.append(key, form[key] ?? '')

  }

  loading.value = true;
  try {
    await axios.post('/coupons', formData)
    toast.success('کوپن با موفقیت ایجاد شد ✅')
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