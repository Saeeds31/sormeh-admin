<template>
  <div class="container py-4 bg-gray mt-4" v-if="checkPermission(['menu_store'])">
    <h3 class=" p-2">
      <i class="bi bi-list-columns-reverse"></i>
      <span>
        ایجاد منو
      </span>
    </h3>
    <h5 class="mb-3"></h5>
    <b-form @submit.prevent="handleSubmit">
      <b-row>
        <!-- Title -->
        <b-col cols="12" md="6">
          <b-form-group label="عنوان" label-for="title">
            <b-form-input id="title" v-model="form.title" />
            <small v-if="errors.title" class="text-danger">{{ errors.title[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Link -->
        <b-col cols="12" md="6">
          <b-form-group label="لینک" label-for="link">
            <b-form-input id="link" v-model="form.link" />
            <small v-if="errors.link" class="text-danger">{{ errors.link[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Parent -->
        <b-col cols="12" md="12">
          <b-form-group label="منوی والد" label-for="parent">
            <Treeselect :normalizer="normalizer" id="parent" v-model="form.parent_id" :options="menuOptions"
              placeholder="انتخاب منوی والد" />
            <small v-if="errors.parent_id" class="text-danger">{{ errors.parent_id[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Icon -->
        <b-col cols="12" md="12">
          <b-form-group label="آیکن" label-for="icon">
            <VueFileAgent @select="imageLoaded" :maxFiles="1" accept=".pdf,.jpg,.png" theme="grid" deletable sortable />
            <small v-if="errors.icon" class="text-danger">{{ errors.icon[0] }}</small>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="mt-3">
        <b-button type="submit" :disabled="loading" variant="success">
          <i class="bi bi-save2"></i>
          <span>
            ایجاد منو
          </span>
        </b-button>
      </div>
    </b-form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import Treeselect from 'vue3-treeselect'
// import the styles
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const form = reactive({
  title: '',
  link: '',
  parent_id: null,
  icon: '',
})
let loading = ref(false);
const errors = reactive({})
let menuOptions = ref([])
const normalizer = (node) => {
  // تبدیل کلیدها به فرمت استاندارد کامپوننت
  return {
    id: node.id,
    label: node.title,
    children: node.children
  }
}
async function fetchMenu() {
  try {
    const res = await axios.get('/menus')
    menuOptions.value = res.data.data
  } catch (e) {
    console.log(e);

    toast.error('خطا در دریافت منوها ❌')
  }
}

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {

    const formData = new FormData()
    for (const key in form) {
      formData.append(key, form[key] ?? '')
    }
    await axios.post('/menus', formData)
    toast.success('منو با موفقیت ایجاد شد ✅')
    fetchMenu()
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

function imageLoaded(files) {
  form.icon = files[0].file
}
onMounted(fetchMenu)

</script>