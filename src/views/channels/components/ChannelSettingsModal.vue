<template>
    <div class="card">
        <div class="card-body">
            <!-- درصد کمیسیون -->
            <div class="mb-3">
                <label class="form-label">
                    درصد کمیسیون (٪)
                    <i class="bi bi-info-circle text-muted" title="این درصد به قیمت محصول اضافه می‌شه"></i>
                </label>
                <input v-model.number="form.commission_percent" type="number" min="0" max="100" step="0.5"
                    class="form-control" />
            </div>

            <!-- Credentials (داینامیک بر اساس نوع کانال) -->
            <div v-if="credentialFields.length" class="mb-3">
                <label class="form-label">اطلاعات احراز هویت</label>
                <div v-for="field in credentialFields" :key="field.key" class="mb-2">
                    <label class="small text-muted">{{ field.label }}</label>
                    <input v-model="form.credentials[field.key]" :type="field.type || 'text'"
                        :placeholder="field.placeholder" class="form-control form-control-sm" />
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
    channel: { type: Object, required: true },
    show: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'saved']);

const saving = ref(false);

const form = ref({
    commission_percent: 0,
    credentials: {},
});

watch(() => props.channel, (ch) => {
    form.value = {
        commission_percent: ch?.commission_percent ?? 0,
        credentials: { ...(ch?.credentials ?? {}) },
    };
}, { immediate: true });

// فیلدهای credential بر اساس نوع کانال
const credentialFields = computed(() => {
    const map = {
        torob: [], // ترب فقط public key داره، نیازی به credential نیست
        torob_pay: [
            { key: 'api_key', label: 'API Key', type: 'password' },
            { key: 'merchant_id', label: 'Merchant ID' },
        ],
        snapp_pay: [
            { key: 'api_key', label: 'API Key', type: 'password' },
            { key: 'vendor_id', label: 'Vendor ID' },
        ],
        basalam: [
            { key: 'access_token', label: 'Access Token', type: 'password' },
        ],
    };

    return map[props.channel.slug] || [];
});

const save = async () => {
    saving.value = true;
    try {
        const { data } = await axios.put(
            `/channels/${props.channel.slug}`,
            form.value
        );
        toast.success(data.message);
        emit('saved');
    } catch (e) {
        toast.error(e.response?.data?.message || 'خطا در ذخیره');
    } finally {
        saving.value = false;
    }
};
</script>