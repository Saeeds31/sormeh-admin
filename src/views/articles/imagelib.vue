<template>
    <div class="container mt-4" v-if="checkPermission(['article_view'])">

        <!-- هدر -->
        <div class="card mb-2">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="mb-0">
                    <i class="bi bi-images"></i>
                    <span>مدیریت تصاویر</span>
                </h3>
                <button class="btn btn-success" @click="openUploadModal">
                    <i class="bi bi-plus"></i>
                    <span>آپلود تصویر جدید</span>
                </button>
            </div>
        </div>

        <!-- بخش جستجو -->
        <div class="card mb-3">
            <div class="card-body">
                <b-row class="g-2">
                    <b-col cols="12" md="6">
                        <b-form-input v-model="search" placeholder="جستجو بر اساس نام فایل..." />
                    </b-col>
                    <b-col cols="12" md="3">
                        <b-form-select v-model="sortBy" :options="sortOptions" />
                    </b-col>
                </b-row>
            </div>
        </div>

        <!-- گالری -->
        <div class="card">
            <div class="card-body">
                <!-- لودینگ -->
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">در حال بارگذاری...</span>
                    </div>
                </div>

                <!-- خالی -->
                <div v-else-if="filteredImages.length === 0" class="text-center py-5 text-muted">
                    <i class="bi bi-image" style="font-size: 3rem;"></i>
                    <p class="mt-2">تصویری یافت نشد</p>
                </div>

                <!-- گرید تصاویر -->
                <div v-else class="row g-3">
                    <div class="col-6 col-md-4 col-lg-3" v-for="img in filteredImages" :key="img.path">
                        <div class="image-card card h-100">
                            <div class="image-wrapper">
                                <img :src="img.url" :alt="img.name" loading="lazy" />
                            </div>
                            <div class="card-body p-2">
                                <div class="image-name" :title="img.name">{{ img.name }}</div>
                                <div class="image-meta">
                                    <small class="text-muted">{{ img.size_human }}</small>
                                    <small class="text-muted">{{ img.modified }}</small>
                                </div>
                                <div class="d-flex gap-1 mt-2">
                                    <button class="btn btn-sm btn-outline-primary flex-fill" @click="copyUrl(img.url)"
                                        title="کپی لینک">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info flex-fill" @click="preview(img)"
                                        title="پیش‌نمایش">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger flex-fill" @click="deleteImage(img)"
                                        title="حذف">
                                        <i class="bi bi-trash3"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal آپلود -->
        <Modal v-if="uploadModal" id="detailModal" @closeModal="() => uploadModal = false" title="آپلود تصویر جدید">
            <VueFileAgent ref="fileAgent" @select="imageLoaded" :maxFiles="1" accept=".gif,.jpg,.jpeg,.png,.webp"
                theme="grid" deletable sortable />
            <div class="mt-3 text-end">
                <b-button variant="secondary" class="me-2" @click="closeUploadModal">انصراف</b-button>
                <b-button variant="primary" :disabled="uploading || !uploadFile" @click="uploadImage">
                    <span v-if="uploading" class="spinner-border spinner-border-sm me-1"></span>
                    <i class="bi bi-cloud-upload"></i>
                    آپلود
                </b-button>
            </div>
        </Modal>

        <!-- Modal پیش‌نمایش -->
        <Modal v-if="previewModal" id="detailModal" @closeModal="() => previewModal = false" :title="previewImage?.name"
            size="lg">
            <div class="text-center">
                <img :src="previewImage?.url" class="img-fluid rounded" :alt="previewImage?.name" />
            </div>
            <div class="mt-3 d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    {{ previewImage?.size_human }} — {{ previewImage?.modified }}
                </small>
                <b-button variant="outline-primary" size="sm" @click="copyUrl(previewImage.url)">
                    <i class="bi bi-clipboard"></i> کپی لینک
                </b-button>
            </div>
        </Modal>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { BRow, BCol, BFormInput, BFormSelect, BButton, BModal } from 'bootstrap-vue-3'
import Modal from '@/components/shared/modal.vue'

import { useAdmin } from '@/stores/modules/admin'

const store = useAdmin()
const checkPermission = store.checkPermission

const images = ref([])
const loading = ref(false)
const search = ref('')
const sortBy = ref('newest')
const sortOptions = [
    { value: 'newest', text: 'جدیدترین' },
    { value: 'oldest', text: 'قدیمی‌ترین' },
    { value: 'name', text: 'نام (A-Z)' },
    { value: 'size', text: 'حجم (بزرگ‌ترین)' },
]

const uploadModal = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)
const fileAgent = ref(null)

const previewModal = ref(false)
const previewImage = ref(null)

// ---------- Computed ----------
const filteredImages = computed(() => {
    let list = [...images.value]

    if (search.value.trim()) {
        const q = search.value.trim().toLowerCase()
        list = list.filter(i => i.name.toLowerCase().includes(q))
    }

    switch (sortBy.value) {
        case 'oldest': list.sort((a, b) => new Date(a.modified) - new Date(b.modified)); break
        case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break
        case 'size': list.sort((a, b) => b.size - a.size); break
        default: list.sort((a, b) => new Date(b.modified) - new Date(a.modified))
    }

    return list
})

// ---------- API ----------
async function getImages() {
    loading.value = true
    try {
        const { data } = await axios.get('/article-lib/images')
        images.value = data.data || []
    } catch (err) {
        toast.error('خطا در دریافت تصاویر ❌')
        console.error(err)
    } finally {
        loading.value = false
    }
}

function imageLoaded(files) {
    uploadFile.value = files[0]?.file ?? null
}

async function uploadImage() {
    if (!uploadFile.value) return
    uploading.value = true

    const formData = new FormData()
    formData.append('file', uploadFile.value)

    try {
        const { data } = await axios.post('/article-lib/images', formData)
        toast.success('تصویر با موفقیت آپلود شد ✅')
        // اضافه کردن مستقیم به لیست
        images.value.unshift(data.data)
        closeUploadModal()
    } catch (err) {
        if (err.response?.status === 422) {
            const errors = err.response.data.errors
            const firstError = Object.values(errors)[0]?.[0] || 'خطای اعتبارسنجی'
            toast.error(firstError)
        } else {
            toast.error('خطا در آپلود تصویر ❌')
        }
    } finally {
        uploading.value = false
    }
}

function deleteImage(img) {
    Swal.fire({
        title: 'حذف تصویر',
        html: `آیا از حذف <b>${img.name}</b> مطمئن هستید؟`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'بله، حذف شود',
        cancelButtonText: 'انصراف',
        confirmButtonColor: '#d33',
    }).then(async (result) => {
        if (!result.isConfirmed) return
        try {
            await axios.delete(`/article-lib/images/${encodeURIComponent(img.name)}`)
            images.value = images.value.filter(i => i.path !== img.path)
            toast.success('تصویر حذف شد ✅')
        } catch (err) {
            toast.error('خطا در حذف تصویر ❌')
        }
    })
}

async function copyUrl(url) {
    try {
        await navigator.clipboard.writeText(url)
        toast.success('لینک کپی شد ✅')
    } catch {
        // fallback برای مرورگرهای قدیمی
        const el = document.createElement('textarea')
        el.value = url
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        toast.success('لینک کپی شد ✅')
    }
}

// ---------- Modal helpers ----------
function openUploadModal() {
    uploadFile.value = null
    uploadModal.value = true
}

function closeUploadModal() {
    uploadModal.value = false
    uploadFile.value = null
    fileAgent.value?.clear?.()
}

function preview(img) {
    previewImage.value = img
    previewModal.value = true
}

onMounted(() => {
    getImages()
})
</script>

<style scoped>
.image-card {
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;
}

.image-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.image-wrapper {
    height: 160px;
    background: #f4f4f4;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.image-wrapper img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.image-name {
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    direction: ltr;
    text-align: left;
}

.image-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    margin-top: 2px;
}
.img-fluid{
    width: 50%;
}
</style>