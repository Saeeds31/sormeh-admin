<template>
  <div class="container mt-3 py-4 bg-gray" v-if="checkPermission(['role_update'])">
    <h3 class=" p-2">
      <i class="bi bi-person-rolodex"></i>
      <span>ویرایش نقش</span>
    </h3>
    <b-card>
      <b-form @submit.prevent="handleSubmit">
        <b-row>
          <!-- Name -->
          <b-col cols="12" md="6">
            <b-form-group label="نام نقش" label-for="name">
              <b-form-input id="name" v-model="form.name" :state="errors.name ? false : null" />
              <small v-if="errors.name" class="text-danger">{{ errors.name[0] }}</small>
            </b-form-group>
          </b-col>

          <b-col cols="12" md="6">
            <b-form-group label="به انگلیسی" label-for="slug">
              <b-form-input id="slug" v-model="form.slug" :state="errors.slug ? false : null"
                placeholder="ترجمه انگلیسی نقش" />
              <small v-if="errors.slug" class="text-danger">{{ errors.slug[0] }}</small>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mt-3">
          <b-button type="submit" :disabled="loading" variant="primary">
            <i class="bi bi-save2"></i>
            <span class="mx-2">

              ذخیره
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

const form = reactive({ name: '', slug: '' })
const errors = reactive({})
let loading = ref(false);

onMounted(async () => {
  try {
    const res = await axios.get(`/roles/${route.params.id}`)
    form.name = res.data.data.name
    form.slug = res.data.data.slug
  } catch (err) {
    console.log(err);

    toast.error('خطا در دریافت اطلاعات نقش ❌')
  }
})

const handleSubmit = async () => {
  loading.value = true;
  Object.keys(errors).forEach(k => delete errors[k])
  try {
    let formData = new FormData();
    formData.append("name", form.name)
    formData.append("slug", form.slug.replaceAll(" ", '-'))

    formData.append("_method", "PUT")
    await axios.post(`/roles/${route.params.id}`, formData)
    toast.success('نقش با موفقیت ویرایش شد ✅')
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
