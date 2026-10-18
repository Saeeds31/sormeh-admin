<template>
  <div class="container py-4 mt-4 bg-gray" v-if="checkPermission(['category_update'])">
    <h3 class=" p-2">
      <i class="bi bi-list-nested"></i>
      <span>
        ویرایش دسته بندی
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

        <!-- Slug -->
        <b-col cols="12" md="6">
          <b-form-group label="Slug" label-for="slug">
            <b-form-input id="slug" v-model="form.slug" />
            <small v-if="errors.slug" class="text-danger">{{ errors.slug[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Main Image -->
        <b-col cols="12" md="6">
          <b-form-group label="تصویر اصلی" label-for="main_image">
            <VueFileAgent @update:raw-model-value="imageLoaded" :raw-model-value="oldImage" :maxFiles="1"
              accept=".pdf,.jpg,.png" theme="grid" deletable sortable />

            <small v-if="errors.main_image" class="text-danger">{{ errors.main_image[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Icon -->
        <b-col cols="12" md="6">
          <b-form-group label="آیکن" label-for="icon">

            <VueFileAgent @update:raw-model-value="imageLoaded1" :raw-model-value="oldImage1" :maxFiles="1"
              accept=".pdf,.jpg,.png" theme="grid" deletable sortable />

            <small v-if="errors.icon" class="text-danger">{{ errors.icon[0] }}</small>
          </b-form-group>
        </b-col>


        <!-- Parent Category (Treeselect) -->
        <b-col cols="12" md="12">
          <b-form-group label="دسته‌بندی والد" label-for="parent_id">
            <Treeselect id="parent_id" v-if="categories.length" :normalizer="normalizer" v-model="form.parent_id"
              :options="categories" placeholder="انتخاب دسته‌بندی والد" :clearable="true" />
            <small v-if="errors.parent_id" class="text-danger">{{ errors.parent_id[0] }}</small>
          </b-form-group>
        </b-col>
        <!-- Description (Editor) -->
        <b-col cols="12">
          <b-form-group label="توضیح" label-for="description">
            <Editor v-model="form.description" />
            <small v-if="errors.description" class="text-danger">{{ errors.description[0] }}</small>
          </b-form-group>
        </b-col>


        <!-- Meta Title -->
        <b-col cols="12" md="6">
          <b-form-group label="Meta Title" label-for="meta_title">
            <b-form-input id="meta_title" v-model="form.meta_title" :state="errors.meta_title ? false : null" />
            <small v-if="errors.meta_title" class="text-danger">{{ errors.meta_title[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Meta Description -->
        <b-col cols="12" md="6">
          <b-form-group label="Meta Description" label-for="meta_description">
            <b-form-input id="meta_description" v-model="form.meta_description"
              :state="errors.meta_description ? false : null" />
            <small v-if="errors.meta_description" class="text-danger">{{ errors.meta_description[0] }}</small>
          </b-form-group>
        </b-col>
        <b-col cols="12" md="6">
          <b-form-group>
            <b-form-checkbox id="status" v-model="form.show_in_home" :true-value="1" :false-value="0">
              نمایش در صفحه اصلی
            </b-form-checkbox>
          </b-form-group>
        </b-col>

        <b-col cols="12" md="6">
          <b-form-group>
            <b-form-checkbox id="status" v-model="form.show_products_in_home" :true-value="1" :false-value="0">
              نمایش محصولات در صفحه اصلی
            </b-form-checkbox>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="mt-3">
        <b-button type="submit" :disabled="loading" variant="primary">
          <i class="bi bi-save2"></i>
          <span class="mx-2">

            ویرایش دسته‌بندی
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
import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'
import Treeselect from 'vue3-treeselect'
// import the styles
import 'vue3-treeselect/dist/vue3-treeselect.css'
import Editor from '@/components/shared/Editor.vue'
import { useRoute } from 'vue-router'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
let loading = ref(false);

const route = useRoute();
let oldImage = ref([])
let oldImage1 = ref([])
const form = reactive({
  title: '',
  slug: '',
  main_image: null,
  icon: null,
  meta_title: '',
  meta_description: '',
  description: '',
  show_in_home: false,
  show_products_in_home: false,
  parent_id: null,
})

const errors = reactive({})
const categories = ref([])

const normalizer = (node) => {
  // تبدیل کلیدها به فرمت استاندارد کامپوننت
  return {
    id: node.id,
    label: node.title,
    children: node.children
  }
}
onMounted(async () => {
  try {
    const res = await axios.get(`/categories/${route.params.id}`)
    Object.assign(form, res.data.data)
    form.show_in_home = Number(res.data.data.show_in_home)
    form.show_products_in_home = Number(res.data.data.show_products_in_home)
    if (res.data.data.main_image)
      oldImage.value =
        [{
          name: res.data.data.main_image.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: res.data.data.main_image.split('.').pop(),
          url: `${baseImageAddress}${res.data.data.main_image}`,
        }];
    if (res.data.data.icon)
      oldImage1.value =
        [{
          name: res.data.data.icon.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: res.data.data.icon.split('.').pop(),
          url: `${baseImageAddress}${res.data.data.icon}`,
        }];
    fetchCategories()
  } catch (err) {
    console.log(err);

    toast.error('خطا در دریافت اطلاعات ❌')
  }
})

function imageLoaded(files) {
  if (files.length) {
    form.main_image = files[0].file
  } else {
    form.main_image = '';
  }
}

function imageLoaded1(files) {
  if (files.length) {
    form.icon = files[0].file
  } else {
    form.icon = '';
  }
}
async function fetchCategories() {

  const categoriesRes = await axios.get('/categories')
  let cats = [{ id: "", title: "بدون والد" }];
  cats.push(...categoriesRes.data.data)
  categories.value = cats;

}
const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {
    const formData = new FormData()
    for (const key in form) {
      if (key == 'show_in_home' || key == 'show_products_in_home') {
        formData.append(key, Number(form[key]))
      } else if (key != 'icon' && key != "main_image") formData.append(key, form[key])
    }
    if (form.main_image) {
      formData.append("main_image", form.main_image)
    }
    if (form.icon) {
      formData.append("icon", form.icon)
    }
    formData.append("_method", "PUT")
    await axios.post(`/categories/${route.params.id}`, formData)
    toast.success('دسته‌بندی با موفقیت ویرایش شد ✅')
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