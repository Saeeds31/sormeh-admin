<template>
    <div class="modalContainer" @click="closeModal" :id="id">
        <div class="modalContent">
            <div class="modalHeader">
                <h5>{{ title }}</h5>
                <button @click="closeModal(null)">
                    <i class="bi bi-x-lg"></i>
                    <span>
                        بستن
                    </span>
                </button>
            </div>
            <slot />
        </div>
    </div>
</template>
<script setup>
const props = defineProps({
    title: String,
    id: String
})
const emit = defineEmits(["closeModal"]);
function closeModal(e) {
    if (e) {
        if (e.target.id == props.id) {
            emit("closeModal")
        }
    } else {
        emit("closeModal")
    }
}
</script>
<style>
.modalContainer {
    position: fixed;
    inset: 0;
    background: #1213;
    z-index: 10000;
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modalContent {
    background: white;
    padding: 16px;
    min-width: max(320px, 50vw);
    min-height: 80vh;
    border-radius: 16px;
}

.modalHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 2px solid #1213;
    margin-bottom: 16px;
}

.modalHeader button {
    background: #d90000;
    color: white;
    border-radius: 0 8px 0 8px;
}
</style>