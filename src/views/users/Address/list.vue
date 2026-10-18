<template>
    <div class="container addresses-page" v-if="checkPermission(['address_view'])">
        <!-- Header -->
        <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3>
                    <i class="bi bi-house-add"></i>
                    <span>مدیریت آدرس‌ها</span>
                </h3>
                <router-link :to="`/users/${route.params.id}/addresses/create`" class="btn btn-primary">
                    <i class="bi bi-plus"></i>
                    <span>افزودن آدرس</span>
                </router-link>
            </div>
        </div>

        <!-- کارت‌ها -->
        <div class="row g-3">
            <div v-if="loading" class="text-center my-5 col-12">
                <div class="spinner-border" role="status"></div>
                <p class="mt-2">در حال بارگذاری...</p>
            </div>

            <div v-else-if="addresses && addresses.length" v-for="address in addresses" :key="address.id" class="col-md-4">
                <div class="card address h-100">
                    <div class="card-body">
                        <!-- نمایش ID آدرس -->
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">{{ address.receiver_name }}</h5>
                            <span class="badge bg-secondary">شناسه: {{ address.id }}</span>
                        </div>
                        <p class="card-text">
                            <strong>استان:</strong> {{ address.province?.name ?? '-' }}<br>
                            <strong>شهر:</strong> {{ address.city?.name ?? '-' }}<br>
                            <strong>کدپستی:</strong> {{ address.postal_code }}<br>
                            <strong>آدرس:</strong> {{ address.address_line }}<br>
                            <strong>تلفن:</strong> {{ address.phone }}
                        </p>
                    </div>
                    <div class="card-footer d-flex justify-content-end gap-2">
                        <router-link :to="`/users/${route.params.id}/addresses/${address.id}/edit`"
                            class="btn btn-sm btn-info">
                            <i class="bi bi-pen"></i>
                            <span>ویرایش</span>
                        </router-link>

                        <!-- دکمه حذف دو مرحله‌ای -->
                        <button v-if="deleteConfirmId !== address.id" class="btn btn-sm btn-danger"
                            @click="deleteConfirmId = address.id">
                            <i class="bi bi-trash"></i>
                            <span>حذف</span>
                        </button>
                        <button v-else class="btn btn-sm btn-warning" @click="deleteAddress(address.id)"
                            :disabled="deleting">
                            <span v-if="deleting" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-check2"></i>
                            <span>تایید حذف</span>
                        </button>
                    </div>
                </div>
            </div>

            <p class="bg-warning-subtle p-4 text-center" v-else>
                <i class="bi bi-database-fill-exclamation"></i>
                <span>هیچ داده ای برای نمایش وجود ندارد</span>
            </p>
        </div>

        <!-- مودال ادغام آدرس -->
        <div v-if="mergeModal.show" class="modal-backdrop-custom" @click.self="closeMergeModal">
            <div class="modal-box">
                <div class="modal-header">
                    <h5>
                        <i class="bi bi-arrow-left-right"></i>
                        <span>ادغام آدرس</span>
                    </h5>
                    <button class="btn-close" @click="closeMergeModal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        <span>{{ mergeModal.message }}</span>
                    </div>
                    <p class="text-muted">لطفاً آدرس مقصد را برای ادغام انتخاب کنید:</p>

                    <div class="merge-list">
                        <div v-for="addr in mergeModal.availableAddresses" :key="addr.id"
                            class="merge-item" :class="{ 'active': mergeModal.selectedId === addr.id }"
                            @click="mergeModal.selectedId = addr.id">
                            <div class="d-flex justify-content-between">
                                <strong>{{ addr.receiver_name }}</strong>
                                <span class="badge bg-secondary">شناسه: {{ addr.id }}</span>
                            </div>
                            <small>
                                {{ addr.province?.name ?? '-' }} - {{ addr.city?.name ?? '-' }}<br>
                                {{ addr.address_line }}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeMergeModal">انصراف</button>
                    <button class="btn btn-primary" @click="mergeAddresses"
                        :disabled="!mergeModal.selectedId || merging">
                        <span v-if="merging" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-check2-circle"></i>
                        <span>ادغام</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";
import { useAdmin } from '@/stores/modules/admin';
import Swal from 'sweetalert2';

const store = useAdmin();
const checkPermission = store.checkPermission;
const route = useRoute();

const addresses = ref([]);
const loading = ref(false);
const deleting = ref(false);
const deleteConfirmId = ref(null);

const mergeModal = ref({
    show: false,
    message: '',
    oldAddressId: null,
    availableAddresses: [],
    selectedId: null,
});

const getAddresses = async () => {
    loading.value = true;
    try {
        const response = await axios.get(`/users/${route.params.id}/addresses`);
        addresses.value = response.data.data ?? response.data;
    } finally {
        loading.value = false;
    }
};

const deleteAddress = async (id) => {
    deleting.value = true;
    try {
        const response = await axios.delete(`/users/${route.params.id}/addresses/${id}`);
        Swal.fire({
            icon: 'success',
            title: 'موفق',
            text: response.data.message || 'آدرس با موفقیت حذف شد',
            timer: 2000,
            showConfirmButton: false,
        });
        deleteConfirmId.value = null;
        await getAddresses();
    } catch (error) {
        // اگر آدرس در سفارش استفاده شده بود → مودال ادغام باز کن
        if (error.response && error.response.status === 422) {
            const otherAddresses = addresses.value.filter(a => a.id !== id);
            if (otherAddresses.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'خطا',
                    text: 'این آدرس در سفارش استفاده شده و آدرس دیگری برای ادغام وجود ندارد.',
                });
            } else {
                mergeModal.value = {
                    show: true,
                    message: error.response.data.error || 'این آدرس در سفارش استفاده شده و قابل حذف نیست.',
                    oldAddressId: id,
                    availableAddresses: otherAddresses,
                    selectedId: null,
                };
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: error.response?.data?.error || 'خطایی رخ داد',
            });
        }
        deleteConfirmId.value = null;
    } finally {
        deleting.value = false;
    }
};

const mergeAddresses = async () => {
    merging.value = true;
    try {
        const response = await axios.post(
            `/users/${route.params.id}/addresses/${mergeModal.value.oldAddressId}/merge`,
            { new_address_id: mergeModal.value.selectedId }
        );
        Swal.fire({
            icon: 'success',
            title: 'موفق',
            text: response.data.message || 'ادغام با موفقیت انجام شد',
            timer: 2000,
            showConfirmButton: false,
        });
        closeMergeModal();
        await getAddresses();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطا',
            text: error.response?.data?.error || 'خطا در ادغام',
        });
    } finally {
        merging.value = false;
    }
};

const closeMergeModal = () => {
    mergeModal.value = {
        show: false,
        message: '',
        oldAddressId: null,
        availableAddresses: [],
        selectedId: null,
    };
};

const merging = ref(false);

onMounted(() => {
    getAddresses();
});
</script>

<style scoped>
.address {
    transition: transform 0.2s;
}
.address:hover {
    transform: translateY(-5px);
}

/* مودال */
.modal-backdrop-custom {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
}
.modal-box {
    background: #fff;
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 1rem;
}
.modal-header,
.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}
.modal-body {
    padding: 0.5rem 0;
}
.merge-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
}
.merge-item {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0.75rem;
    cursor: pointer;
    transition: 0.2s;
}
.merge-item:hover {
    background: #f5f5f5;
}
.merge-item.active {
    border-color: #0d6efd;
    background: #e7f1ff;
}
</style>