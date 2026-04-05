import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin(() => {
  // Application schema creation logic has been fully removed to ensure
  // production-safe execution. Database schemas must be initialized
  // manually using standalone SQL scripts provided outside the application.
  console.log('Database initialization check bypassed. Assuming required schemas exist.')
})