<template>
    <div class="container mt-4 bg-gray" v-if="checkPermission(['article_store'])">
        <h3 class=" p-2">
            <i class="bi bi-book-half"></i>
            <span>
                ایجاد کاربر جدید
            </span>
        </h3>
        <b-form @submit.prevent="submitForm">
            <b-row>
                <!-- Title -->
                <b-col cols="12" md="6">
                    <b-form-group label="عنوان" label-for="title">
                        <b-form-input id="title" v-model="form.title" placeholder="عنوان مقاله" />
                        <small class="text-danger" v-if="errors.title">{{ errors.title[0] }}</small>
                    </b-form-group>
                </b-col>

                <!-- Slug -->
                <b-col cols="12" md="6">
                    <b-form-group label="Slug" label-for="slug">
                        <b-form-input id="slug" v-model="form.slug" placeholder="slug مقاله" />
                        <small class="text-danger" v-if="errors.slug">{{ errors.slug[0] }}</small>
                    </b-form-group>
                </b-col>
                <b-col cols="12" md="6">
                    <b-form-group label="دسته‌بندی " label-for="category_ids">
                        <Treeselect id="category_ids" :multiple="true" v-model="form.category_ids"
                            :normalizer="normalizer" :options="parentOptions" placeholder="انتخاب دسته‌بندی "
                            :clearable="true" :valueConsistsOf="'ALL'" />
                        <small class="text-danger" v-if="errors.category_ids">{{ errors.category_ids[0]
                            }}</small>
                    </b-form-group>
                </b-col>


                <!-- Read Time -->
                <b-col cols="12" md="6">
                    <b-form-group label="مدت زمان مطالعه ">
                        <b-form-input type="number" v-model="form.read_time" placeholder="مثال: 5" />
                        <small class="text-danger" v-if="errors.read_time">{{ errors.read_time[0]
                            }}</small>
                    </b-form-group>
                </b-col>

                <!-- Image -->
                <b-col cols="12" md="12">
                    <b-form-group label="تصویر (URL)">
                        <VueFileAgent @select="imageLoaded" :maxFiles="1" accept=".pdf,.jpg,.png" theme="grid" deletable
                            sortable />
                        <small class="text-danger" v-if="errors.image">{{ errors.image[0] }}</small>
                    </b-form-group>
                </b-col>
                <!-- Short Description -->
                <b-col cols="12">
                    <b-form-group label="توضیح کوتاه">
                        <b-form-textarea v-model="form.short_description" rows="2" />
                        <small class="text-danger" v-if="errors.short_description">{{ errors.short_description[0]
                            }}</small>
                    </b-form-group>
                </b-col>

                <!-- Description (CKEditor) -->
                <b-col cols="12">
                    <b-form-group label="توضیحات کامل">
                        <Editor v-model="form.description" />
                        <small class="text-danger" v-if="errors.description">{{ errors.description[0]
                            }}</small>
                    </b-form-group>
                </b-col>

                <!-- Meta Title -->
                <b-col cols="12" md="6">
                    <b-form-group label="Meta Title">
                        <b-form-input v-model="form.meta_title" />
                        <small class="text-danger" v-if="errors.meta_title">{{ errors.meta_title[0]
                            }}</small>
                    </b-form-group>
                </b-col>

                <!-- Meta Description -->
                <b-col cols="12" md="6">
                    <b-form-group label="Meta Description">
                        <b-form-input v-model="form.meta_description" />
                        <small class="text-danger" v-if="errors.meta_description">{{ errors.meta_description[0]
                            }}</small>
                    </b-form-group>
                </b-col>

            </b-row>

            <div class="mt-3">
                <b-button type="submit" :disabled="loading" variant="primary">
                    <i class="bi bi-save2">
                        ذخیره
                    </i>
                </b-button>
            </div>
        </b-form>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { BForm, BFormGroup, BFormInput, BFormTextarea, BButton, BCard, BRow, BCol, BFormInvalidFeedback } from 'bootstrap-vue-3'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'
import Editor from '@/components/shared/editor.vue';
import { displayError } from '@/composable/useError'
import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
let loading = ref(false);
const form = reactive({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    meta_title: '',
    meta_description: '',
    read_time: '',
    image: '',
    category_ids: []
})
const errors = reactive({})
function imageLoaded(files) {
    form.image = files[0].file
}
const normalizer = (node) => {
    // تبدیل کلیدها به فرمت استاندارد کامپوننت
    return {
        id: node.id,
        label: node.title,
        children: node.children
    }
}
const parentOptions = ref([])
function getParentOption() {
    axios.get("/article-categories-by-child").then((res) => {
        parentOptions.value = res.data.data
    })
}
getParentOption()
const submitForm = async () => {

    Object.keys(errors).forEach(key => delete errors[key])
    loading.value = true;
    try {
        const formData = new FormData()
        for (const key in form) {
            if (key != 'category_ids')
                formData.append(key, form[key] ?? '')
        }
        form.category_ids.forEach((id, index) => {
            formData.append(`category_ids[]`, id)
        })
        await axios.post('/articles', formData)
        toast.success('مقاله با موفقیت ذخیره شد ✅')
        Object.keys(form).forEach(key => (form[key] = key))
    } catch (err) {
        if (err.response && err.response.status === 422) {
            Object.assign(errors, err.response.data.errors)
            displayError(err.response.data.errors)
        } else {
            toast.error('خطا در ارسال اطلاعات ❌')
        }
    } finally {
        loading.value = false;
    }
}
</script>