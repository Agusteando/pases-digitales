import { searchWorkspaceUsers } from '~/server/utils/googleWorkspace'
import { defineEventHandler, getQuery } from '#imports'

export default defineEventHandler(async (event) => {
  const q = getQuery(event).q as string
  if (!q || q.length < 2) return []
  return await searchWorkspaceUsers(q)
})