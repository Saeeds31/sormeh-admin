<template>
  <div class="channel-card" :class="{ 'connected': channel.is_connected }">

    <!-- هدر کارت -->
    <div class="channel-header">
      <div class="channel-icon">
        <i :class="channelIcon"></i>
      </div>

      <div class="channel-info">
        <h5 class="channel-name">{{ channel.name }}</h5>
        <div class="channel-type">
          {{ typeLabel }}
        </div>
      </div>

      <!-- Switch وصل/قطع -->
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          :checked="channel.is_connected"
          @change="$emit('toggle', channel)"
        />
      </div>
    </div>

    <!-- آمار -->
    <div class="channel-stats">
      <div class="stat-item">
        <div class="stat-label">محصولات فعال</div>
        <div class="stat-value">{{ channel.stats.included_products }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">مستثنی شده</div>
        <div class="stat-value text-danger">{{ channel.stats.excluded_products }}</div>
      </div>
      <div class="stat-item" v-if="channel.type === 'gateway' || channel.type === 'checkout'">
        <div class="stat-label">کمیسیون</div>
        <div class="stat-value text-primary">{{ channel.commission_percent }}٪</div>
      </div>
    </div>

    <!-- دکمه‌ها -->
    <div class="channel-actions">
      <button @click="$emit('open-settings', channel)" class="btn btn-sm btn-outline-primary">
        <i class="bi bi-gear"></i>
        <span>تنظیمات</span>
      </button>
      <button @click="$emit('open-products', channel)" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-box-seam"></i>
        <span>محصولات</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  channel: { type: Object, required: true },
});

defineEmits(['toggle', 'open-settings', 'open-products']);

const channelIcon = computed(() => {
  const map = {
    torob: 'bi bi-search',
    torob_pay: 'bi bi-credit-card',
    snapp_pay: 'bi bi-snapchat',
    emalls: 'bi bi-shop-window',
    basalam: 'bi bi-bag-check',
    shopino: 'bi bi-shop',
  };
  return map[props.channel.slug] || 'bi bi-shop';
});

const typeLabel = computed(() => {
  const map = {
    catalog: 'فقط ایندکس محصولات',
    checkout: 'فروشگاه کامل',
    gateway: 'درگاه پرداخت',
  };
  return map[props.channel.type] || props.channel.type;
});
</script>

<style scoped>
.channel-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 18px;
  transition: all 0.2s;
  height: 100%;
}

.channel-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.channel-card.connected {
  border-color: #10b981;
  background: #f0fdf4;
}

.channel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 14px;
}

.channel-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  flex-shrink: 0;
}

.channel-info {
  flex: 1;
  min-width: 0;
}

.channel-name {
  font-weight: 700;
  color: #2d3436;
  font-size: 1rem;
  margin: 0;
}

.channel-type {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 3px;
}

.channel-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  min-width: 80px;
  text-align: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-label {
  font-size: 0.7rem;
  color: #6c757d;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3436;
}

.channel-actions {
  display: flex;
  gap: 8px;
}

.channel-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  flex: 1;
}
</style>