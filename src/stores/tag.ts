import { defineStore } from 'pinia'
import type { Tag } from '@/types'
import { db } from '@/db'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [] as Tag[],
    loading: false
  }),

  getters: {
    tagMap(state): Map<string, Tag> {
      return new Map(state.tags.map((tag: Tag) => [tag.id, tag]))
    }
  },

  actions: {
    async loadTags() {
      this.$state.loading = true
      try {
        // Check if database is open
        if (!db.isOpen()) {
          try {
          await db.open()
          } catch (openError: any) {
            console.error('Failed to open database:', openError)
            
            // Handle QuotaExceededError
            if (openError.name === 'QuotaExceededError') {
              const { ElMessageBox } = await import('element-plus')
              ElMessageBox.alert(
                '浏览器存储空间已满！\n\n' +
                '请尝试以下方法：\n' +
                '1. 清空所有数据（设置页面）\n' +
                '2. 清除浏览器缓存和数据\n' +
                '3. 手动删除 IndexedDB（F12 → Application → IndexedDB）\n\n' +
                '或者刷新页面后点击右上角头像选择"重新抓取"',
                '存储空间不足',
                {
                  confirmButtonText: '我知道了',
                  type: 'error'
                }
              )
            }
            
            this.$state.tags = []
            this.$state.loading = false
            return
          }
        }
        
        const tags = await db.tags.toArray()
        
        // 去重：使用 Map 按 id 去重
        const tagMap = new Map<string, Tag>()
        tags.forEach(tag => {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, {
              ...tag,
              emoji: tag.emoji,
              repos: tag.repos || []
            })
          }
        })
        
        this.$state.tags = Array.from(tagMap.values())
        
        // 如果发现重复，清理数据库
        if (tags.length !== this.$state.tags.length) {
          await db.tags.clear()
          if (this.$state.tags.length > 0) {
            await db.tags.bulkAdd(this.$state.tags)
          }
        }
      } catch (error) {
        console.error('Failed to load tags:', error)
        // If error (like DatabaseClosedError), reset to empty array
        this.$state.tags = []
      } finally {
        this.$state.loading = false
      }
    },

    async createTag(name: string, color: string = '#409EFF', emoji?: string): Promise<Tag> {
      const tag: Tag = {
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        color,
        emoji,
        repos: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      try {
        // Check if database is open
        if (!db.isOpen()) {
          await db.open()
        }
        
        // Create clean copy for IndexedDB
        const cleanTag = {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          emoji: tag.emoji,
          repos: [],
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt
        }
        await db.tags.add(cleanTag)
        this.$state.tags.push(cleanTag)
        return cleanTag
      } catch (error) {
        console.error('Failed to create tag:', error)
        throw error
      }
    },

    async updateTag(tagId: string, updates: Partial<Tag>) {
      try {
        // Check if database is open
        if (!db.isOpen()) {
          await db.open()
        }
        
        const tag = this.$state.tags.find((t: Tag) => t.id === tagId)
        if (!tag) throw new Error('Tag not found')

        const updatedTag = {
          ...tag,
          ...updates,
          updatedAt: Date.now()
        }

        // Create clean copy for IndexedDB
        const cleanTag = {
          id: updatedTag.id,
          name: updatedTag.name,
          color: updatedTag.color,
          emoji: updatedTag.emoji,
          repos: Array.isArray(updatedTag.repos) ? [...updatedTag.repos] : [],
          createdAt: updatedTag.createdAt,
          updatedAt: updatedTag.updatedAt
        }

        await db.tags.update(tagId, cleanTag)
        const index = this.$state.tags.findIndex((t: Tag) => t.id === tagId)
        if (index !== -1) {
          // 使用新数组触发响应式更新
          this.$state.tags = [
            ...this.$state.tags.slice(0, index),
            cleanTag,
            ...this.$state.tags.slice(index + 1)
          ]
        }
      } catch (error) {
        console.error('Failed to update tag:', error)
        throw error
      }
    },

    async deleteTag(tagId: string) {
      try {
        // Check if database is open
        if (!db.isOpen()) {
          await db.open()
        }
        
        await db.tags.delete(tagId)
        this.$state.tags = this.$state.tags.filter((t: Tag) => t.id !== tagId)
      } catch (error) {
        console.error('Failed to delete tag:', error)
        throw error
      }
    },

    async updateAndSaveTags(tags: Tag[]) {
      try {
        // Check if database is open
        if (!db.isOpen()) {
          await db.open()
        }
        
        // Sanitize tags before saving to IndexedDB
        const cleanTags = tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          emoji: tag.emoji,
          repos: Array.isArray(tag.repos) ? [...tag.repos] : [],
          createdAt: tag.createdAt || Date.now(),
          updatedAt: Date.now()
        }))
        
        // Update all tags in IndexedDB
        await db.tags.clear()
        if (cleanTags.length > 0) {
          await db.tags.bulkAdd(cleanTags)
        }
        
        // If all tags have empty repos, clear repoTags table
        const hasAnyRepos = cleanTags.some(tag => tag.repos.length > 0)
        if (!hasAnyRepos && db.repoTags) {
          try {
            await db.repoTags.clear()
          } catch (error) {
            console.error('Failed to clear repoTags table:', error)
          }
        }
        
        this.$state.tags = cleanTags
      } catch (error) {
        console.error('Failed to update and save tags:', error)
        // If database is closed, just update state without saving
        if (error instanceof Error && error.name === 'DatabaseClosedError') {
          this.$state.tags = tags
          return
        }
        throw error
      }
    },

    async toggleTagForRepo(repoId: number, tagId: string) {
      try {
        const tag = this.$state.tags.find((t: Tag) => t.id === tagId)
        if (!tag) return

        const index = tag.repos.indexOf(repoId)
        if (index > -1) {
          tag.repos = tag.repos.filter(id => id !== repoId)
        } else {
          tag.repos.push(repoId)
        }

        await this.updateAndSaveTags([...this.$state.tags])
      } catch (error) {
        console.error('Failed to toggle tag for repo:', error)
        throw error
      }
    },

    async getRepoTags(repoId: number): Promise<Tag[]> {
      return this.$state.tags.filter((tag: Tag) => tag.repos.includes(repoId))
    },

    async addTagToRepo(repoId: number, tagId: string) {
      try {
        const tag = this.$state.tags.find((t: Tag) => t.id === tagId)
        if (!tag) {
          console.error(`Tag ${tagId} not found`)
          return
        }

        // 如果已存在，不重复添加
        if (tag.repos.includes(repoId)) {
          return
        }

        // 添加 repoId 到 tag.repos
        tag.repos.push(repoId)
        tag.updatedAt = Date.now()

        // 保存到数据库
        await this.updateAndSaveTags([...this.$state.tags])
      } catch (error) {
        console.error(`Failed to add tag ${tagId} to repo ${repoId}:`, error)
        throw error
      }
    },

    async removeTagFromRepo(repoId: number, tagId: string) {
      try {
        const tag = this.$state.tags.find((t: Tag) => t.id === tagId)
        if (!tag) {
          console.error(`Tag ${tagId} not found`)
          return
        }

        // 从 tag.repos 中移除 repoId
        const index = tag.repos.indexOf(repoId)
        if (index > -1) {
          tag.repos.splice(index, 1)
          tag.updatedAt = Date.now()

          // 保存到数据库
          await this.updateAndSaveTags([...this.$state.tags])
        }
      } catch (error) {
        console.error(`Failed to remove tag ${tagId} from repo ${repoId}:`, error)
        throw error
      }
    },

    async washTags(allRepoIds: Set<number>) {
      // Remove repo IDs that no longer exist
      const freshTags = this.$state.tags.map(tag => ({
        ...tag,
        repos: tag.repos.filter(id => allRepoIds.has(id))
      }))
      await this.updateAndSaveTags(freshTags)
    }
  }
})

