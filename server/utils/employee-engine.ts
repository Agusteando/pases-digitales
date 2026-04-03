export async function getInternalEmployeeList() {
  // Try SOAP first...
  // Fallback to Signia if needed...
  // ALWAYS return stripped items.
  return employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    plantel: emp.plantel,
    email: emp.email
    // Note: NEVER append RFC/CURP here.
  }))
}