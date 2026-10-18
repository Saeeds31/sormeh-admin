<template>
  <div class="container py-4 bg-gray mt-3" v-if="checkPermission(['province_update'])">
    <h3 class=" p-2">
      <i class="bi bi-map"></i>
      <span>
        ویرایش استان
      </span>
    </h3>
    <b-form @submit.prevent="handleSubmit">
      <b-row>
        <b-col cols="12" md="6">
          <b-form-group label="نام استان" label-for="name">
            <b-form-input id="name" v-model="form.name" />
            <small v-if="errors.name" class="text-danger">{{ errors.name[0] }}</small>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="mt-3">
        <b-button type="submit" :disabled="loading" variant="primary">
          <i class="bi bi-save2"></i>
          <span class="mx-2">
            ویرایش استان
          </span>
        </b-button>
      </div>
    </b-form>
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
const route = useRoute();
const form = reactive({
  name: '',
})

const errors = reactive({})
let loading = ref(false);

onMounted(async () => {
  try {
    const res = await axios.get(`/provinces/${route.params.id}`)
    Object.assign(form, res.data.data)
  } catch (err) {
    toast.error('خطا در دریافت اطلاعات استان ❌')
  }
})

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {
    let fd = new FormData();
    fd.append("_method", "PUT")
    fd.append("name", form.name);
    await axios.post(`/provinces/${route.params.id}`, fd)
    toast.success('استان با موفقیت ویرایش شد ✅')
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