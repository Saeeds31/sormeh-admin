<template>
  <b-container fluid class="container bg-gray mt-3" v-if="checkPermission(['specifications_update'])">
    <h3 class=" p-2">
      <i class="bi bi-table"></i>
      <span>
        ویرایش مشخصات
      </span>
    </h3>
    <b-form @submit.prevent="submitForm">
      <b-row>
        <!-- نام ویژگی -->
        <b-col cols="12" md="6">
          <b-form-group label="عنوان ویژگی" label-for="title">
            <b-form-input id="title" v-model="form.title" placeholder="مثال: جنس، رنگ، سایز..." required />
          </b-form-group>
        </b-col>
      </b-row>

      <!-- لیست مقادیر -->
      <b-row class="mt-3">
        <b-col cols="12">
          <b-form-group label="مقادیر ویژگی">
            <div v-for="(value, index) in form.values" :key="index" class="d-flex mb-2">
              <b-form-input v-model="form.values[index]" placeholder="مقدار ویژگی (مثال: آهنی، آلومینیومی، چوبی)" />
              <b-button variant="danger" class="ms-2" @click="removeValue(index)">
                <i class="bi bi-trash3-fill"></i>
                <span>حذف</span>
              </b-button>
            </div>
            <b-button variant="success" @click="addValue">
              <i class="bi bi-plus"></i>
              <span class="mx-2">
                افزودن مقدار
              </span>
            </b-button>
          </b-form-group>
        </b-col>
      </b-row>

      <!-- دکمه ثبت -->
      <b-row>
        <b-col cols="12" class="text-end">
          <b-button :disabled="loading" variant="primary" type="submit">
            <i class="bi bi-save2"></i>
            <span class="mx-2">
              ثبت ویژگی
            </span>
          </b-button>
        </b-col>
      </b-row>
    </b-form>
  </b-container>
</template>

<script setup>
import { ref, onMounted } from "vue"
import axios from "axios"
import { toast } from "vue3-toastify"
import "vue3-toastify/dist/index.css"
import { useRouter, useRoute } from "vue-router"
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
let loading = ref(false);

const router = useRouter()
const route = useRoute()
const id = route.params.id

const form = ref({
  title: "",
  values: [],
})

const addValue = () => {
  form.value.values.push("")
}

const removeValue = (index) => {
  form.value.values.splice(index, 1)
}

// دریافت اطلاعات اولیه برای ویرایش
const loadSpecification = async () => {
  try {
    const { data } = await axios.get(`/specifications/${id}`)
    form.value.title = data.title
    form.value.values = data.values.length ? data.values.map(v => v.value) : [""]
  } catch (e) {
    console.log(e)
    toast.error("خطا در دریافت اطلاعات ویژگی")
  }
}

onMounted(() => {
  loadSpecification()
})

// ارسال فرم ویرایش
const submitForm = async () => {
  loading.value = true;
  try {
    let formData = new FormData()
    formData.append("title", form.value.title)
    for (const value of form.value.values) {
      if (value && value.trim() !== "") {
        formData.append("values[]", value)
      }
    }
    formData.append("_method", "PUT")
    await axios.post(`/specifications/${id}`, formData)
    toast.success("ویژگی با موفقیت به‌روز شد")
    router.push("/products/specification")
  } catch (e) {
    console.log(e)
    toast.error("خطا در به‌روزرسانی ویژگی")
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ms-2 {
  margin-inline-start: 0.5rem;
}
</style>
