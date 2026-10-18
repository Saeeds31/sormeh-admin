<template>
    <div class="container mt-4" v-if="checkPermission(['setting_view', 'setting_store'])">
        <!-- انتخاب گروه -->
        <div class="mb-3">
            <label class="form-label">انتخاب گروه</label>
            <treeselect v-model="selectedGroup" :options="groupOptions" placeholder="یک گروه انتخاب کنید" />
        </div>

        <!-- لودر -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
        </div>
        <!-- فرم تنظیمات -->
        <form v-else @submit.prevent="saveSettings">
            <div v-if="settings.length > 0" class="card p-3">
                <div v-for="(setting, index) in settings" :key="setting.id" class="mb-3">
                    <label class="form-label fw-bold">{{ setting.label }}</label>
                    <!-- input -->
                    <input v-if="setting.type === 'string'" type="text" class="form-control" v-model="setting.value" />
                    <!-- textarea -->
                    <textarea v-else-if="setting.type === 'text'" class="form-control" rows="3"
                        v-model="setting.value"></textarea>
                    <!-- editor -->
                    <editor v-else-if="setting.type === 'editor'" v-model="setting.value" />
                    <!-- number -->
                    <input v-else-if="setting.type === 'number'" type="number" class="form-control"
                        v-model="setting.value" />
                    <!-- boolean -->
                    <div v-else-if="setting.type === 'boolean'" class="form-check">
                        <input type="checkbox" class="form-check-input" v-model="setting.value" />
                        <label class="form-check-label">فعال</label>
                    </div>

                    <!-- پیشفرض -->
                    <input v-else type="text" class="form-control" v-model="setting.value" />
                </div>

                <!-- دکمه ذخیره -->
                <div class="text-end">
                    <button class="btn btn-primary" type="submit">
                        ذخیره تنظیمات
                    </button>
                </div>
            </div>

            <div v-else class="alert alert-info">
                تنظیمی برای این گروه یافت نشد.
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import Treeselect from 'vue3-treeselect'
// import the styles
import 'vue3-treeselect/dist/vue3-treeselect.css'
import editor from "@/components/shared/editor.vue";

import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

import { useAdmin } from '@/stores/modules/admin';
const store = useAdmin();
const checkPermission = store.checkPermission;
const selectedGroup = ref(null);
const groupOptions = ref([]);
const settings = ref([]);
const loading = ref(false);
watch(() => selectedGroup.value, () => {
    fetchSettings();
});
const fetchGroups = async () => {
    try {
        const { data } = await axios.get("/settings-groups");
        groupOptions.value = data.map((g) => ({ id: g, label: g }));
    } catch (err) {
        console.error(err);
    }
};

const fetchSettings = async () => {
    if (!selectedGroup.value) return;
    loading.value = true;
    try {
        const { data } = await axios.get("/settings-groups/" + selectedGroup.value);
        settings.value = data;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const saveSettings = async () => {
    try {
        await axios.post("/settings-save-group/" + selectedGroup.value, { settings: settings.value });
        toast.success('تنظیمات با موفقیت ذخیره شد ✅')
    } catch (err) {
        console.log(err);
        toast.success('مشکلی در ذخیره پیش آمد ✅')
    }
};

onMounted(() => {
    fetchGroups();
});
</script>