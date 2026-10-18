<template>
  <div class="container py-4" v-if="checkPermission(['city_update'])">

    <h3 class=" p-2">
      <i class="bi bi-pin-map"></i>
      <span>
        ویرایش شهر
      </span>
    </h3>
    <b-form @submit.prevent="handleSubmit">
      <b-row>
        <!-- Province -->
        <b-col cols="12" md="6">
          <b-form-group label="استان" label-for="province">

            <Treeselect id="parent_id" v-if="provinceOptions.length" v-model="form.province_id"
              :options="provinceOptions" placeholder="انتخاب استان" :clearable="true" />
            <small v-if="errors.province_id" class="text-danger">{{ errors.province_id[0] }}</small>
          </b-form-group>
        </b-col>

        <!-- Name -->
        <b-col cols="12" md="6">
          <b-form-group label="نام شهر" label-for="name">
            <b-form-input id="name" v-model="form.name" />
            <small v-if="errors.name" class="text-danger">{{ errors.name[0] }}</small>
          </b-form-group>
        </b-col>
      </b-row>

      <div class="mt-3">
        <b-button type="submit" :disabled="loading" variant="primary">
          <i class="bi bi-save2"></i>
          <span class="mx-2">
            ویرایش شهر
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
import 'vue3-treeselect/dist/vue3-treeselect.css'
import { BForm, BFormGroup, BFormInput, BButton, BCard, BRow, BCol } from 'bootstrap-vue-3'
import { useRoute } from 'vue-router'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();
let loading = ref(false);
const form = reactive({
  province_id: null,
  name: '',
})

const errors = reactive({})
const provinceOptions = reactive([])

onMounted(async () => {
  try {
    const cityRes = await axios.get(`/cities/${route.params.id}`)
    Object.assign(form, cityRes.data.data)
    const res = await axios.get('/provinces')
    provinceOptions.push(...res.data.data.map(p => ({ id: p.id, label: p.name, value: p.id })))
  } catch {
    toast.error('خطا در دریافت اطلاعات شهر ❌')
  }
})

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  loading.value = true;
  try {
    let fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("name", form.name);
    fd.append("province_id", form.province_id);

    await axios.post(`/cities/${route.params.id}`, fd)
    toast.success('شهر با موفقیت ویرایش شد ✅')
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