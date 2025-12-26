<template>
  <div class="empty-state">
    <div class="empty-content">
      <el-icon :size="120" class="empty-icon">
        <Document />
      </el-icon>
      <h2 class="empty-title">{{ t('home.selectRepo') }}</h2>
      <p class="empty-description">
        {{ t('home.selectRepoDesc') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Document } from '@element-plus/icons-vue'

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
}

.empty-content {
  text-align: center;
  padding: $spacing-xxl;
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.3;
  margin-bottom: $spacing-lg;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: $spacing-md;
}

.empty-description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>

