<template>
  <div class="container py-4 mt-4 bg-gray" v-if="checkPermission(['attributes_update'])">
    <h3 class=" p-2">
      <i class="bi bi-list-check"></i>
      <span>
        ویرایش ویژگی
      </span>
    </h3>
    <b-card>
      <b-form @submit.prevent="handleSubmit">
        <b-row>
          <!-- Name -->
          <b-col cols="12" md="12">
            <b-form-group label="نام ویژگی" label-for="name">
              <b-form-input id="name" v-model="form.name" />
              <small v-if="errors.name" class="text-danger">{{ errors.name[0] }}</small>
            </b-form-group>
            <b-form-group label="نوع ویژگی" label-for="value_type">
              <b-form-select name="value_type" v-model="form.value_type">
                <b-form-select-option value="code">کد رنگی</b-form-select-option>
                <b-form-select-option value="image">تصویر</b-form-select-option>
              </b-form-select>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mt-3">
          <b-button :disabled="loading" type="submit" variant="primary">
            <i class="bi bi-save2"></i>
            <span class="mx-2">
              ویرایش ویژگی

            </span>
          </b-button>
        </div>
      </b-form>
    </b-card>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'
import { useRoute } from 'vue-router'

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const props = defineProps({
  id: { type: Number, required: true }
})
let route = useRoute();
let loading = ref(false);

const form = reactive({
  name: '',
  value_type: ""

})
const errors = reactive({})

onMounted(async () => {
  try {
    const res = await axios.get(`/attributes/${route.params.id}`)
    form.name = res.data.data.name
    form.value_type = res.data.data.value_type
  } catch (err) {
    console.log(err);

    toast.error('خطا در دریافت اطلاعات ویژگی ❌')
  }
})

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {
    let formData = new FormData();
    formData.append("name", form.name)
    formData.append("value_type", form.value_type)
    formData.append("_method", "PUT")
    await axios.post(`/attributes/${route.params.id}`, formData)
    toast.success('ویژگی با موفقیت ویرایش شد ✅')
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
