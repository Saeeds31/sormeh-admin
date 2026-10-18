<template>
    <div class="container mt-3 mt-md-4 px-2 px-md-3 channels-page" v-if="checkPermission(['channel_view'])">

        <!-- هدر -->
        <div class="card mb-3 header-card">
            <div class="card-header">
                <div
                    class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
                    <h3 class="mb-0 page-title">
                        <i class="bi bi-shop text-primary"></i>
                        <span>مدیریت کانال‌های فروش</span>
                    </h3>

                    <button @click="loadChannels" class="btn btn-outline-primary refresh-btn">
                        <i class="bi bi-arrow-clockwise"></i>
                        <span>بروزرسانی</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- لیست کانال‌ها -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else class="row g-3">
            <div v-for="channel in channels" :key="channel.id" class="col-12 col-lg-6">
                <ChannelCard :channel="channel" @toggle="toggleChannel" @open-settings="openSettings"
                    @open-products="openProducts" />
            </div>
        </div>

        <!-- Modal: تنظیمات کانال -->

        <Modal v-if="showSettingsModal" id="selectedChannel" @closeModal="() => closeSettings()"
            :title="` تنظیمات ${selectedChannel?.name}`">
            <ChannelSettingsModal :channel="selectedChannel" @saved="onSettingsSaved" />
        </Modal>


        <!-- Modal: مدیریت محصولات -->
        <Modal v-if="showProductsModal" id="showProductsModal" @closeModal="() => closeProducts()"
            :title="` محصولات ${selectedChannel?.name}`">
            <ChannelProductsModal :channel="selectedChannel" :show="showProductsModal" />
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAdmin } from '@/stores/modules/admin';
import { toast } from 'vue3-toastify';
import ChannelCard from './components/ChannelCard.vue';
import ChannelSettingsModal from './components/ChannelSettingsModal.vue';
import ChannelProductsModal from './components/ChannelProductsModal.vue';
import Modal from "@/components/shared/modal.vue";

const store = useAdmin();
const checkPermission = store.checkPermission;

const channels = ref([]);
const loading = ref(false);

const selectedChannel = ref(null);
const showSettingsModal = ref(false);
const showProductsModal = ref(false);

const loadChannels = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get('/channels');
        channels.value = data.data || [];
    } catch (e) {
        toast.error('خطا در دریافت کانال‌ها');
        channels.value = [];
    } finally {
        loading.value = false;
    }
};

const toggleChannel = async (channel) => {
    try {
        const { data } = await axios.put(`/channels/${channel.slug}/toggle`);
        toast.success(data.message);
        loadChannels();
    } catch (e) {
        toast.error(e.response?.data?.message || 'خطا در تغییر وضعیت');
    }
};

const openSettings = (channel) => {
    selectedChannel.value = channel;
    showSettingsModal.value = true;
};

const closeSettings = () => {
    showSettingsModal.value = false;
    selectedChannel.value = null;
};

const onSettingsSaved = () => {
    closeSettings();
    loadChannels();
};

const openProducts = (channel) => {
    selectedChannel.value = channel;
    showProductsModal.value = true;
};

const closeProducts = () => {
    showProductsModal.value = false;
    selectedChannel.value = null;
};

onMounted(loadChannels);
</script>

<style scoped>
.page-title {
    font-weight: 700;
    color: #2d3436;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 10px;
}

@media (max-width: 767.98px) {
    .page-title {
        font-size: 1.15rem;
        justify-content: center;
        width: 100%;
    }
}
</style>