<template>
  <div v-if="checkPermission(['article_update'])" class="container py-4">
    <b-card>
      <h5 class="mb-3">ویرایش مقاله</h5>
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

          <b-col cols="12" md="6">
            <b-form-group label="دسته‌بندی " label-for="category_ids">
              <Treeselect v-if="parentOptions.length" id="category_ids" :multiple="true" v-model="form.category_ids"
                :normalizer="normalizer" :options="parentOptions" placeholder="انتخاب دسته‌بندی " :clearable="true" />
              <small class="text-danger" v-if="errors.category_ids">{{ errors.category_ids[0]
              }}</small>
            </b-form-group>
          </b-col>
          <b-col cols="12" md="6">
            <b-form-group label="زمان مطالعه (دقیقه)" label-for="read_time">
              <b-form-input type="number" id="read_time" v-model="form.read_time"
                :state="errors.read_time ? false : null" />
              <small v-if="errors.read_time" class="text-danger">{{ errors.read_time[0] }}</small>
            </b-form-group>
          </b-col>
          <b-col cols="12" md="12">
            <b-form-group label="تصویر" label-for="image">
              <VueFileAgent @update:raw-model-value="imageLoaded" :raw-model-value="oldImage" :maxFiles="1"
                accept=".pdf,.jpg,.png" theme="grid" deletable sortable>
              </VueFileAgent>

              <small v-if="errors.image" class="text-danger">{{ errors.image[0] }}</small>
            </b-form-group>
          </b-col>

          <b-col cols="12">
            <b-form-group label="توضیح کوتاه">
              <b-form-textarea v-model="form.short_description" rows="2" />
              <small class="text-danger" v-if="errors.short_description">{{ errors.short_description[0]
              }}</small>
            </b-form-group>
          </b-col>

          <!-- Description (Editor) -->
          <b-col cols="12">
            <b-form-group label="توضیح کامل" label-for="description">
              <Editor v-model="form.description" />
              <small v-if="errors.description" class="text-danger">{{ errors.description[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Meta Title -->
          <b-col cols="12" md="6">
            <b-form-group label="Meta Title" label-for="meta_title">
              <b-form-input id="meta_title" v-model="form.meta_title" />
              <small v-if="errors.meta_title" class="text-danger">{{ errors.meta_title[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Meta Description -->
          <b-col cols="12" md="6">
            <b-form-group label="Meta Description" label-for="meta_description">
              <b-form-input id="meta_description" v-model="form.meta_description" />
              <small v-if="errors.meta_description" class="text-danger">{{ errors.meta_description[0] }}</small>
            </b-form-group>
          </b-col>

          <!-- Read Time -->

        </b-row>

        <div class="mt-3">
          <b-button type="submit" :disabled="loading" variant="primary">
            <i class="bi bi-save2"></i>
            <span class="mx-2">
              ویرایش
              مقاله
            </span>
          </b-button>
        </div>
      </b-form>
    </b-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import Editor from '@/components/shared/editor.vue';
import { useRoute } from 'vue-router'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
let loading = ref(false);
const route = useRoute();
const oldImage = ref([]);
const form = reactive({
  title: '',
  slug: '',
  image: [],
  short_description: '',
  description: '',
  meta_title: '',
  meta_description: '',
  read_time: '',
  category_ids: []

})
const normalizer = (node) => {
  // تبدیل کلیدها به فرمت استاندارد کامپوننت
  return {
    id: node.id,
    label: node.title,
    children: node.children
  }
}
const errors = reactive({})
const parentOptions = ref([])
function getParentOption() {
  axios.get("/article-categories-by-child").then((res) => {
    parentOptions.value = res.data.data
  })
}
onMounted(async () => {
  loading.value = true;
  try {
    // GET اطلاعات مقاله
    const res = await axios.get(`/articles/${route.params.id}`)
    if (res.data.data.image)
      oldImage.value =
        [{
          name: res.data.data.image.split('/').pop(),
          size: 0,
          type: 'image/jpeg',
          ext: res.data.data.image.split('.').pop(),
          url: `${baseImageAddress}${res.data.data.image}`,
        }];
    let ids = [];
    res.data.data.categories.forEach((item) => ids.push(item.id))
    form.category_ids = ids;
    delete res.data.data.categories;
    delete res.data.data.author;
    Object.assign(form, res.data.data);
    getParentOption()
  } catch (err) {
    console.log(err);
    toast.error('خطا در دریافت اطلاعات مقاله ❌')
  } finally {
    loading.value = false;
  }
})
function imageLoaded(files) {
  if (files.length) {
    form.image = files[0].file
  } else {
    form.image = '';
  }
}
const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  try {
    const formData = new FormData()
    for (const key in form) {
      if (key != 'image' && key != 'category_ids') formData.append(key, form[key])
    }
    formData.append("_method", "PUT");
    form.category_ids.forEach((id, index) => {
      formData.append(`category_ids[]`, id)
    })
    if (form.image) {
      formData.append("image", form.image);
    }
    await axios.post(`/articles/${route.params.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    toast.success('مقاله با موفقیت ویرایش شد ✅');
  } catch (err) {
    if (err.response?.status === 422) {
      Object.assign(errors, err.response.data.errors)
      toast.error('خطاهای فرم را بررسی کنید ❌')
    } else {
      toast.error('خطا در ارسال اطلاعات ❌')
    }
  }
}
</script>
