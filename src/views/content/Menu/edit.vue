<template>
  <div class="container py-4 bg-gray mt-4" v-if="checkPermission(['menu_update'])">
    <h3 class=" p-2">
      <i class="bi bi-list-columns-reverse"></i>
      <span>ویرایش منو
      </span>
    </h3>
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
            <Treeselect :normalizer="normalizer" id="parent" v-model="form.parent_id" v-if="menuOptions.length"
              :options="menuOptions" placeholder="انتخاب منوی والد" />
            <small v-if="errors.parent_id" class="text-danger">{{ errors.parent_id[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Icon -->
        <b-col cols="12" md="12">
          <b-form-group label="آیکن" label-for="icon">
            <VueFileAgent @update:raw-model-value="imageLoaded" :raw-model-value="oldImage" :maxFiles="1"
              accept=".pdf,.jpg,.png" theme="grid" deletable sortable>
            </VueFileAgent>
            <small v-if="errors.icon" class="text-danger">{{ errors.icon[0] }}</small>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="mt-3">
        <b-button type="submit" :disabled="loading" variant="primary">
          <i class="bi bi-save2"></i>
          <span class="mx-2">
            ویرایش منو
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
import Treeselect from 'vue3-treeselect'
// import the styles
import 'vue3-treeselect/dist/vue3-treeselect.css'

import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'
import { useRoute } from 'vue-router'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute()

let loading = ref(false);
const form = reactive({
  title: '',
  link: '',
  parent_id: null,
  icon: '',
})

const errors = reactive({})
let menuOptions = ref([])
let oldImage = ref([])
onMounted(async () => {
  try {
    const menuRes = await axios.get(`/menus/${route.params.id}`)
    Object.assign(form, menuRes.data.data)
    if (menuRes.data.data.icon)
      oldImage.value =
        [{
          name: menuRes.data.data.icon.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: menuRes.data.data.icon.split('.').pop(),
          url: `${baseImageAddress}${menuRes.data.data.icon}`,
        }];
    fetchMenus()
  } catch {
    toast.error('خطا در دریافت اطلاعات منو ❌')
  }
})
async function fetchMenus() {
  const res = await axios.get('/menus')
  let menus = [{ id: "", title: "بدون والد" }]
  menus.push(...res.data.data)
  menuOptions.value = menus;

}
function imageLoaded(files) {
  if (files.length) {
    form.icon = files[0].file
  } else {
    form.icon = '';
  }
}
const normalizer = (node) => {
  // تبدیل کلیدها به فرمت استاندارد کامپوننت
  return {
    id: node.id,
    label: node.title,
    children: node.children
  }
}
const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {
    const formData = new FormData()
    for (const key in form) {
      if (key != 'icon') formData.append(key, form[key])
    }
    if (form.icon) {
      formData.append("icon", form.icon)
    }
    formData.append("_method", "PUT")
    await axios.post(`/menus/${route.params.id}`, formData)
    toast.success('منو با موفقیت ویرایش شد ✅')
    fetchMenus();
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