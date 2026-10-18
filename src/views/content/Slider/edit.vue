<template>
  <div class="container mt-4 bg-gray mt-4" v-if="checkPermission(['slider_update'])">
    <h3 class=" p-2">
      <i class="bi bi-sliders"></i>
      <span>
        ویرایش اسلایدر
      </span>
    </h3>
    <form @submit.prevent="updateForm" class="row g-3">
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
      <div class="col-8">
        <label class="form-label">توضیحات (اختیاری)</label>
        <Editor v-model="form.description" />
        <small v-if="errors.description" class="text-danger">{{ errors.description[0] }}</small>
      </div>

      <!-- تصویر -->
      <div class="col-md-4">
        <label class="form-label">انتخاب تصویر</label>
        <VueFileAgent @update:raw-model-value="imageLoaded" :raw-model-value="oldImage" :maxFiles="1"
          accept=".pdf,.jpg,.png" theme="grid" deletable sortable>
        </VueFileAgent>

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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Editor from '@/components/shared/editor.vue'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute()
const router = useRouter()
const form = ref({
  title: '',
  link: '',
  description: '',
  image: null,
  type: '',
  button_text: '',
})

function imageLoaded(files) {
  if (files.length) {
    form.image = files[0].file
  } else {
    form.image = '';
  }
}
const loading = ref(false)
let oldImage = ref([]);
const fetchData = async () => {
  try {
    const res = await axios.get(`/sliders/${route.params.id}`)
    Object.assign(form.value, res.data.data);
    if (res.data.data.image)
      oldImage.value =
        [{
          name: res.data.data.image.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: res.data.data.image.split('.').pop(),
          url: `${baseImageAddress}${res.data.data.image}`,
        }];
  } catch (e) {
    console.log(e);

    toast.error('خطا در دریافت اطلاعات اسلایدر')
  }
}

const updateForm = async () => {
  try {
    loading.value = true
    const formData = new FormData()
    for (let key in form.value) {
      if (form.value[key]) formData.append(key, form.value[key])
    }
    if (form.image) {
      formData.append("image", form.image);
    }
    formData.append("_method", "PUT");
    await axios.post(`/sliders/${route.params.id}`, formData)
    toast.success('اسلایدر با موفقیت بروزرسانی شد')
  } catch (e) {
    toast.error('خطا در بروزرسانی اسلایدر')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
/* استایل دلخواه */
</style>