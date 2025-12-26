import Dexie, { Table } from 'dexie'
import type { Repository, Tag, RepoTag } from '@/types'

/**
 * 共享的 Dexie 数据库实例
 * 用于存储 repositories、tags 和 repoTags
 */
class StarHubDatabase extends Dexie {
  repos!: Table<Repository, number>
  tags!: Table<Tag, string>
  repoTags!: Table<RepoTag, [number, string]>

  constructor() {
    super('StarHubDB')
    
    // Version 1 - Initial schema
    this.version(1).stores({
      repos: 'id, full_name, language, updated_at',
      tags: 'id, name, createdAt'
    })
    
    // Version 2 - Add repoTags table
    this.version(2).stores({
      repos: 'id, full_name, language, updated_at',
      tags: 'id, name, createdAt',
      repoTags: '[repoId+tagId], repoId, tagId'
    })
  }
}

export const db = new StarHubDatabase()

