<template>
  <div class="home-page">
    <HomeLayout>
      <template #sidebar>
        <SideMenu />
      </template>
      <template #main>
        <div class="home-content">
          <RepoList
            :repos="filteredRepos"
            :loading="loading"
            :syncing="syncing"
            :activeRepo="selectedRepo"
            @repo-click="handleRepoClick"
          />
          <DetailView
            v-if="selectedRepo"
            :repo="selectedRepo"
            @close="handleCloseDetail"
          />
          <EmptyState v-else />
        </div>
      </template>
    </HomeLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRepoStore } from '@/stores/repo'
import { useTagStore } from '@/stores/tag'
import HomeLayout from '@/layouts/HomeLayout.vue'
import SideMenu from './components/SideMenu.vue'
import RepoList from './components/RepoList.vue'
import DetailView from './components/DetailView.vue'
import EmptyState from './components/EmptyState.vue'
import type { Repository } from '@/types'

const repoStore = useRepoStore()
const tagStore = useTagStore()

const selectedRepo = ref<Repository | null>(null)

const filteredRepos = computed(() => repoStore.filteredRepos)
const loading = computed(() => repoStore.isFetching)
const syncing = computed(() => repoStore.isSyncing)

const handleRepoClick = (repo: Repository) => {
  selectedRepo.value = repo
}

const handleCloseDetail = () => {
  selectedRepo.value = null
}

onMounted(async () => {
  try {
    // Load repos if not already loaded or if empty
    if (repoStore.repos.length === 0) {
      await repoStore.loadRepos()
    }
    
    // Clean up tags for non-existent repos
    const allRepoIds = new Set(repoStore.repos.map((r: Repository) => r.id))
    await tagStore.washTags(allRepoIds)
  } catch (error) {
    console.error('Error loading repos:', error)
  }
})
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.home-content {
  display: flex;
  height: 100%;
  position: relative;
}
</style>

