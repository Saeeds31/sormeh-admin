<template>
  <div class="container mt-4 bg-gray mt-4" v-if="checkPermission(['slider_store'])">
    <h3 class=" p-2">
      <i class="bi bi-sliders"></i>
      <span>
        ایجاد اسلایدر جدید
      </span>
    </h3>
    <form @submit.prevent="submitForm" class="row g-3">
      <!-- عنوان -->
      <div class="col-md-6">
        <label class="form-label">عنوان</label>
        <input v-model="form.title" type="text" class="form-control" maxlength="255" />
        <small v-if="errors.title" class="text-danger">{{ errors.title[0] }}</small>

      </div>

      <!-- لینک -->
      <div class="col-md-6">
        <label class="form-label">لینک (اختیاری)</label>
        <input v-model="form.link" type="text" class="form-control" maxlength="255" />
        <small v-if="errors.link" class="text-danger">{{ errors.link[0] }}</small>
      </div>

      <!-- توضیحات -->
      <div class="col-12 col-md-8">
        <label class="form-label">توضیحات (اختیاری)</label>
        <Editor v-model="form.description" />
        <small v-if="errors.description" class="text-danger">{{ errors.description[0] }}</small>
      </div>

      <!-- تصویر -->
      <div class="col-12 col-md-4">
        <label class="form-label">انتخاب تصویر</label>
        <VueFileAgent @select="imageLoaded" :maxFiles="1" accept=".pdf,.jpg,.png" theme="grid" deletable sortable />
        <small v-if="errors.image" class="text-danger">{{ errors.image[0] }}</small>
      </div>

      <!-- نوع -->
      <div class="col-md-6">
        <label class="form-label">نوع اسلایدر</label>
        <select v-model="form.type" class="form-select">
          <option value="">انتخاب کنید</option>
          <option value="desktop">دسکتاپ</option>
          <option value="mobile">موبایل</option>
        </select>
        <small v-if="errors.type" class="text-danger">{{ errors.type[0] }}</small>
      </div>

      <!-- متن دکمه -->
      <div class="col-md-6">
        <label class="form-label">متن دکمه (اختیاری)</label>
        <input v-model="form.button_text" type="text" class="form-control" maxlength="100" />
        <small v-if="errors.button_text" class="text-danger">{{ errors.button_text[0] }}</small>
      </div>

      <div class="col-12">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <i class="bi bi-save2"></i>
          <span class="mx-2">
            {{ loading ? 'در حال ذخیره...' : 'ذخیره' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Editor from '@/components/shared/editor.vue'

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const form = ref({
  title: '',
  link: '',
  description: '',
  image: null,
  type: '',
  button_text: '',
})
const errors = reactive({})

function imageLoaded(files) {
  form.value.image = files[0].file
}
const loading = ref(false)

const submitForm = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  try {
    loading.value = true
    const formData = new FormData()
    for (let key in form.value) {
      if (form.value[key]) formData.append(key, form.value[key])
    }
    await axios.post('/sliders', formData)
    toast.success('اسلایدر با موفقیت ایجاد شد')
    form.value = {
      title: '',
      link: '',
      description: '',
      image: null,
      type: '',
      button_text: '',
    }
  } catch (err) {
    Object.assign(errors, err.response.data.errors)

    toast.error('خطا در ایجاد اسلایدر')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* استایل دلخواه */
</style>