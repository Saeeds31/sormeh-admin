<template>
    <div class="card ">
        <div class="card-body">

            <!-- فیلترها -->
            <div class="row g-2 mb-3">
                <div class="col-12 col-md-4">
                    <input v-model="filters.search" @keyup.enter="loadProducts" type="text"
                        class="form-control form-control-sm" placeholder="جستجو در عنوان، SKU، بارکد" />
                </div>

                <div class="col-6 col-md-3">
                    <select v-model="filters.exclusion_status" @change="loadProducts"
                        class="form-select form-select-sm">
                        <option value="all">همه محصولات</option>
                        <option value="included">ارسال می‌شن</option>
                        <option value="excluded">مستثنی شده</option>
                    </select>
                </div>

                <div class="col-6 col-md-3">
                    <button @click="loadProducts" class="btn btn-sm btn-primary w-100">
                        <i class="bi bi-funnel"></i> فیلتر
                    </button>
                </div>
            </div>

            <!-- عملیات گروهی -->
            <div v-if="selectedProducts.length"
                class="alert alert-info d-flex align-items-center justify-content-between mb-2">
                <span>{{ selectedProducts.length }} محصول انتخاب شده</span>
                <div class="d-flex gap-2">
                    <button @click="bulkAction(true)" class="btn btn-sm btn-danger">
                        <i class="bi bi-x-circle"></i> مستثنی کن
                    </button>
                    <button @click="bulkAction(false)" class="btn btn-sm btn-success">
                        <i class="bi bi-check-circle"></i> برگردان
                    </button>
                </div>
            </div>

            <!-- لیست -->
            <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary"></div>
            </div>

            <div v-else class="table-responsive">
                <table class="table table-sm table-hover align-middle">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input type="checkbox" :checked="allSelected" @change="toggleAll" />
                            </th>
                            <th>#</th>
                            <th>عنوان</th>
                            <th>قیمت</th>
                            <th>موجودی</th>
                            <th>وضعیت ارسال</th>
                            <th style="width: 100px;">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="product in products.data" :key="product.id">
                            <td>
                                <input type="checkbox" :value="product.id" v-model="selectedProducts" />
                            </td>
                            <td>{{ product.id }}</td>
                            <td class="product-title">{{ product.title }}</td>
                            <td>{{ Number(product.price).toLocaleString('fa-IR') }}</td>
                            <td>
                                <span :class="product.stock > 0 ? 'text-success' : 'text-danger'">
                                    {{ product.stock }}
                                </span>
                            </td>
                            <td>
                                <span class="badge" :class="product.is_excluded ? 'bg-danger' : 'bg-success'">
                                    {{ product.is_excluded ? 'مستثنی' : 'ارسال می‌شه' }}
                                </span>
                            </td>
                            <td>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" :checked="!product.is_excluded"
                                        @change="toggleProduct(product)" />
                                </div>
                            </td>
                        </tr>

                        <tr v-if="!products.data?.length">
                            <td colspan="7" class="text-center text-muted py-4">
                                محصولی یافت نشد
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="products.last_page > 1" class="d-flex justify-content-center gap-1 mt-3">
                <button v-for="p in products.last_page" :key="p" @click="goToPage(p)" class="btn btn-sm"
                    :class="p === products.current_page ? 'btn-primary' : 'btn-outline-primary'">
                    {{ p }}
                </button>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
    channel: { type: Object, required: true },
    show: { type: Boolean, default: false },
});

defineEmits(['close']);

const loading = ref(false);
const products = ref({ data: [], current_page: 1, last_page: 1 });
const selectedProducts = ref([]);

const filters = ref({
    search: '',
    exclusion_status: 'all',
    page: 1,
    per_page: 20,
});

const allSelected = computed(() => {
    return products.value.data.length > 0
        && products.value.data.every(p => selectedProducts.value.includes(p.id));
});

const loadProducts = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get(`/channels/${props.channel.slug}/products`, {
            params: filters.value,
        });
        products.value = data.data;
        selectedProducts.value = [];
    } catch (e) {
        toast.error('خطا در دریافت محصولات');
    } finally {
        loading.value = false;
    }
};

const toggleProduct = async (product) => {
    try {
        await axios.put(
            `/channels/${props.channel.slug}/products/${product.id}/exclude`,
            { is_excluded: !product.is_excluded }
        );
        product.is_excluded = !product.is_excluded;
        toast.success('بروزرسانی شد');
    } catch (e) {
        toast.error('خطا در بروزرسانی');
    }
};

const bulkAction = async (isExcluded) => {
    try {
        await axios.post(
            `/channels/${props.channel.slug}/products/bulk-exclude`,
            {
                product_ids: selectedProducts.value,
                is_excluded: isExcluded,
            }
        );
        toast.success('بروزرسانی گروهی انجام شد');
        loadProducts();
    } catch (e) {
        toast.error('خطا در عملیات گروهی');
    }
};

const toggleAll = (e) => {
    if (e.target.checked) {
        selectedProducts.value = products.value.data.map(p => p.id);
    } else {
        selectedProducts.value = [];
    }
};

const goToPage = (page) => {
    filters.value.page = page;
    loadProducts();
};

onMounted(loadProducts);
</script>

<style scoped>
.product-title {
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>