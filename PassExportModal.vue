// En PassExportModal.vue (línea ~83)
} catch (error) {
  console.error('Export error:', error)
  const msg = error?.response?._data?.message || 'Ocurrió un error al intentar exportar los registros.'
  alert(msg)
} finally {