<template>
  <el-dialog
    v-model="visible"
    :title="t('batchTag.title')"
    width="600px"
    @close="handleCancel"
    :close-on-click-modal="false"
    class="batch-tag-dialog"
  >
    <div class="tag-select-content">
      <!-- 顶部信息卡片 -->
      <div class="info-card">
        <div class="info-icon">
          <el-icon :size="24"><Collection /></el-icon>
        </div>
        <div class="info-content">
          <div class="info-title">
            {{ t('batchTag.selected') }} 
            <span class="repo-count">{{ repoCount }}</span> 
            {{ t('home.repos') }}
          </div>
          <div class="info-subtitle">{{ t('batchTag.selectCategories') }}</div>
        </div>
      </div>
      
      <!-- 操作模式选择 -->
      <div class="operation-mode">
        <div class="mode-label">{{ t('batchTag.operationMode') || '操作模式' }}</div>
        <el-radio-group v-model="operationMode" size="default">
          <el-radio-button label="add">
            <el-icon style="margin-right: 4px;"><Plus /></el-icon>
            {{ t('batchTag.addMode') }}
          </el-radio-button>
          <el-radio-button label="replace">
            <el-icon style="margin-right: 4px;"><Refresh /></el-icon>
            {{ t('batchTag.replaceMode') }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 搜索框 -->
      <div class="search-box" v-if="tags.length > 5">
        <el-input
          v-model="searchQuery"
          :placeholder="t('batchTag.searchTags') || '搜索分类...'"
          clearable
          :prefix-icon="Search"
        />
      </div>
      
      <!-- 标签列表 -->
      <div class="tag-list">
        <div
          v-for="tag in filteredTags"
          :key="tag.id"
          class="tag-item"
          :class="{ selected: selectedTagIds.includes(tag.id) }"
          @click="toggleTag(tag.id)"
        >
          <div class="tag-checkbox">
            <el-checkbox
              :model-value="selectedTagIds.includes(tag.id)"
              @update:model-value="(val) => toggleTag(tag.id, val)"
              @click.stop
              size="large"
            />
          </div>
          <div class="tag-info">
            <div class="tag-main">
              <span
                class="tag-color"
                :style="{ backgroundColor: tag.color }"
              ></span>
              <span v-if="tag.emoji" class="tag-emoji">{{ tag.emoji }}</span>
              <span class="tag-name">{{ tag.name }}</span>
            </div>
            <div class="tag-meta" v-if="tag.repos?.length">
              <el-icon :size="14"><Folder /></el-icon>
              <span>{{ tag.repos.length }}</span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredTags.length === 0 && searchQuery" class="empty-search">
          <el-icon :size="48"><Search /></el-icon>
          <p>{{ t('batchTag.noSearchResults') || '未找到匹配的分类' }}</p>
          <p class="empty-subtitle">{{ t('batchTag.tryDifferentKeyword') || '尝试使用其他关键词' }}</p>
        </div>
        
        <div v-if="tags.length === 0" class="empty-tags">
          <el-icon :size="48"><Collection /></el-icon>
          <p>{{ t('batchTag.noTags') }}</p>
          <p class="empty-subtitle">{{ t('batchTag.noTagsTip') }}</p>
        </div>
      </div>
      <!-- 已选择的标签预览 -->
      <transition name="slide-fade">
        <div v-if="selectedTagIds.length > 0" class="selected-tags-preview">
          <div class="preview-header">
            <span class="preview-label">
              <el-icon><Select /></el-icon>
              {{ t('batchTag.selectedTags') || '已选择' }} ({{ selectedTagIds.length }})
            </span>
            <el-button 
              text 
              size="small" 
              @click="clearSelection"
              v-if="selectedTagIds.length > 0"
            >
              {{ t('common.clear') || '清空' }}
            </el-button>
          </div>
          <div class="preview-tags">
          <el-tag
            v-for="tagId in selectedTagIds"
            :key="tagId"
            closable
            @close="toggleTag(tagId)"
            size="large"
            class="preview-tag"
            effect="light"
          >
            <template v-if="tags.find(t => t.id === tagId)">
              <span 
                v-if="tags.find(t => t.id === tagId)?.emoji" 
                class="preview-emoji"
              >
                {{ tags.find(t => t.id === tagId)?.emoji }}
              </span>
              {{ tags.find(t => t.id === tagId)?.name }}
            </template>
          </el-tag>
          </div>
        </div>
      </transition>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">
          {{ t('common.cancel') }}
        </el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :disabled="selectedTagIds.length === 0"
          size="large"
        >
          <el-icon style="margin-right: 4px;"><Check /></el-icon>
          {{ t('common.confirm') }}
          <span v-if="selectedTagIds.length > 0" class="confirm-count">
            ({{ selectedTagIds.length }})
          </span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Collection, Plus, Refresh, Search, Folder, Select, Check } from '@element-plus/icons-vue'
import type { Tag } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  repoCount: number
  tags: Tag[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [tagIds: string[], mode: 'add' | 'replace']
}>()

const visible = ref(props.modelValue)
const selectedTagIds = ref<string[]>([])
const operationMode = ref<'add' | 'replace'>('add')
const searchQuery = ref('')

// 过滤标签
const filteredTags = computed(() => {
  if (!searchQuery.value) return props.tags
  const query = searchQuery.value.toLowerCase()
  return props.tags.filter(tag => 
    tag.name.toLowerCase().includes(query)
  )
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (!val) {
    selectedTagIds.value = []
    operationMode.value = 'add'
    searchQuery.value = ''
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const toggleTag = (tagId: string, checked?: boolean) => {
  const index = selectedTagIds.value.indexOf(tagId)
  if (checked !== undefined) {
    if (checked && index === -1) {
      selectedTagIds.value.push(tagId)
    } else if (!checked && index > -1) {
      selectedTagIds.value.splice(index, 1)
    }
  } else {
    if (index > -1) {
      selectedTagIds.value.splice(index, 1)
    } else {
      selectedTagIds.value.push(tagId)
    }
  }
}

const clearSelection = () => {
  selectedTagIds.value = []
}

const handleConfirm = () => {
  emit('confirm', [...selectedTagIds.value], operationMode.value)
  visible.value = false
}

const handleCancel = () => {
  visible.value = false
  selectedTagIds.value = []
  operationMode.value = 'add'
  searchQuery.value = ''
}
</script>

<style scoped lang="scss">
.batch-tag-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }
}

.tag-select-content {
  // 顶部信息卡片
  .info-card {
    display: flex;
    align-items: center;
    padding: 16px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #409EFF 0%, #53a8ff 100%);
    border-radius: 0;
    color: white;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);

    .info-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      margin-right: 16px;
      backdrop-filter: blur(10px);
    }

    .info-content {
      flex: 1;

      .info-title {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 6px;

        .repo-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 24px;
          padding: 0 8px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
        }
      }

      .info-subtitle {
        font-size: 0.875rem;
        opacity: 0.9;
      }
    }
  }

  // 操作模式
  .operation-mode {
    margin-bottom: 20px;

    .mode-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    :deep(.el-radio-group) {
      width: 100%;
      display: flex;

      .el-radio-button {
        flex: 1;

        .el-radio-button__inner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }

  // 搜索框
  .search-box {
    margin-bottom: 16px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: box-shadow 0.3s;

      &:hover,
      &.is-focus {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }
    }
  }

  // 标签列表
  .tag-list {
    max-height: 360px;
    overflow-y: auto;
    padding: 4px;
    margin: 0 -4px;

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;

      &:hover {
        background: var(--el-border-color-darker);
      }
    }
  }

  .tag-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    margin-bottom: 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);
    background-color: var(--bg-secondary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

    &:hover {
      background-color: var(--el-fill-color-light);
      border-color: var(--el-border-color);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    &.selected {
      background-color: rgba(64, 158, 255, 0.15);
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    }

    .tag-checkbox {
      display: flex;
      align-items: center;
      margin-right: 12px;
    }

    .tag-info {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 0;

      .tag-main {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 0;

        .tag-color {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .tag-emoji {
          font-size: 1.125rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .tag-name {
          flex: 1;
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .tag-meta {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        color: var(--text-secondary);
        font-size: 0.8125rem;
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 8px;

        .el-icon {
          opacity: 0.7;
        }
      }
    }
  }

  // 暗黑模式下的标签徽章优化
  @at-root {
    html.dark .tag-meta {
      background-color: rgba(255, 255, 255, 0.1) !important;
    }
  }

  // 空状态
  .empty-tags,
  .empty-search {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-tertiary);

    .el-icon {
      opacity: 0.4;
      margin-bottom: 16px;
      color: var(--text-tertiary);
    }

    p {
      margin: 8px 0 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .empty-subtitle {
      font-size: 0.875rem;
      color: var(--text-tertiary);
      margin-top: 4px;
    }
  }

  // 已选择标签预览
  .selected-tags-preview {
    margin-top: 20px;
    padding: 16px;
    background-color: rgba(64, 158, 255, 0.08);
    border-radius: 12px;
    border: 1px solid rgba(64, 158, 255, 0.3);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .preview-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

      .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .preview-tag {
        display: inline-flex;
        align-items: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s;
        background-color: rgba(64, 158, 255, 0.15) !important;
        border-color: rgba(64, 158, 255, 0.3) !important;
        color: var(--el-color-primary) !important;

        &:hover {
          transform: scale(1.05);
        }

        .preview-emoji {
          margin-right: 4px;
        }

        :deep(.el-tag__content) {
          display: flex;
          align-items: center;
          color: inherit;
        }

        :deep(.el-tag__close) {
          color: inherit;
          
          &:hover {
            background-color: rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
  }
}

// 底部按钮区域
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .confirm-count {
    margin-left: 4px;
    padding: 0 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    font-weight: 700;
  }
}

// 动画效果
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>

