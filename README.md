# Pases Digitales - Guía Operativa

Bienvenido a la plataforma de **Pases Digitales**. Este sistema automatiza la emisión y autorización de incidencias del personal mediante un flujo de aprobación externo vía notificaciones, eliminando los formatos impresos.

## 1. Ingreso y Usuarios
*   El acceso requiere una cuenta institucional de Google Workspace.
*   Todo usuario que inicie sesión exitosamente se registra automáticamente en el sistema.
*   La cuenta `desarrollo.tecnologico@casitaiedis.edu.mx` es Administrador principal por defecto para asegurar el acceso inicial de configuración.
*   **Permisos Estándar**: Permitido emitir pases, visualizar historial, inspeccionar detalle de pases y exportar reportes.
*   **Permisos de Administrador**: Acceso a configuración de rutas, directorio operativo, métricas y gestión de otros usuarios. Los administradores pueden otorgar o revocar permisos de administrador a cualquier otro operador directamente desde el módulo "Usuarios".

## 2. Emisión de Pases
*   Se pueden seleccionar uno o múltiples colaboradores buscando por nombre (con integración ultrarrápida a la base de datos de empleados y Signia).
*   Si el colaborador ya tiene un pase en el día actual, el sistema despliega una alerta preventiva visual en su expediente.
*   Al emitir la justificación, el pase nace en estado **Pendiente** y se envían de inmediato las notificaciones para su resolución.
*   **Restricción Estricta**: No existen atajos internos. Toda autorización debe realizarse exclusivamente a través del enlace seguro enviado mediante la notificación oficial.

## 3. Flujo de Notificaciones y Autorización
*   **Telegram**: Notificación global y obligatoria para cada pase emitido. Se envía al grupo maestro operativo para control directivo.
*   **WhatsApp**: Enrutamiento dinámico. Las notificaciones viajan directamente al WhatsApp del responsable designado, según las configuraciones del sistema.
*   **Segregación de Funciones**: Por seguridad operativa, un pase **nunca** podrá ser autorizado por la misma persona que lo capturó, ni por el colaborador al que se le asigna dicho pase.
*   **Estado Final**: Una vez que el responsable abre el enlace y autoriza o rechaza el requerimiento, el registro se vuelve definitivo, grabando inalterablemente quién tomó la decisión y a qué hora.

## 4. Directorio y Reglas (Administradores)
*   **Directorio (Workspace)**: Los contactos encargados de recibir notificaciones se vinculan directamente mediante una búsqueda real en Google Workspace. Se asignan a un Plantel con un nivel de responsabilidad (`PRINCIPAL`, `ADMON`, `OTRO`). Cada plantel debe mantener siempre un responsable principal o administrador activo. El número de teléfono del contacto es bidireccional; si se edita aquí, se sincroniza en el directorio oficial de Google.
*   **Reglas de WhatsApp**: El motor de reglas de notificaciones utiliza el catálogo real de **Puestos** (obtenido de Signia) y la selección de **Planteles**. Si el empleado afectado encaja en las condiciones de la regla, la alerta se dirige al responsable indicado. En caso contrario, la notificación recurre a contactar a los responsables generales del plantel.

## 5. Historial, Modificaciones y Auditoría
*   **Visualización Rápida**: El expediente lateral despliega de manera visual el recuento de eventos y la cronología segmentada por ciclo escolar.
*   **Modificación / Anulación**: Si hubo error de captura, **sólo el creador original** del pase tiene permisos para editarlo o anularlo permanentemente.
*   **Tiempo Límite**: El sistema concede una ventana de 48 horas desde la fecha de inicio del evento para realizar modificaciones, siempre que el pase no se encuentre ya rechazado o anulado.
*   **Impresión**: La acción de impresión fue eliminada sistemáticamente para asegurar un seguimiento puramente digital y validado.