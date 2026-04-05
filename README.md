# Pases Digitales - Guía Operativa

Bienvenido a la plataforma de **Pases Digitales**. Este sistema reemplaza los antiguos talonarios y formatos impresos por un modelo de seguimiento 100% digital, trazable y basado estrictamente en notificaciones para la autorización de incidencias del personal.

Esta guía explica cómo funciona el producto desde la perspectiva del usuario operativo y administrativo.

---

## 1. Ingreso, Registro y Niveles de Acceso

El acceso al sistema se realiza exclusivamente a través de **Autenticación Institucional (Google Workspace)**. Todo usuario que ingresa exitosamente con su correo es registrado automáticamente en el sistema y aparecerá en el módulo de "Usuarios".

Existen dos tipos de permisos:

*   **Usuario Estándar**: Su uso se limita estrictamente a la captura operativa. Pueden generar pases, buscar colaboradores, revisar el historial, inspeccionar detalles de los pases individuales y exportar reportes. No tienen acceso a configuración ni métricas globales.
*   **Administrador**: Tiene acceso total. Visualiza métricas, configura reglas de enrutamiento telefónico, gestiona el directorio de contactos y administra los privilegios de otros usuarios. (La cuenta `desarrollo.tecnologico@casitaiedis.edu.mx` nace con este permiso por defecto para garantizar el acceso inicial).

---

## 2. Emisión de Pases

El flujo de "Generar Pase" está diseñado para ser rápido y permitir la selección múltiple en caso de incidencias grupales.

1.  **Búsqueda del Colaborador**: Utiliza la barra para encontrar al colaborador por nombre. El sistema cruza información de los sistemas internos y Signia, trayendo automáticamente su puesto y plantel.
2.  **Prevención de Duplicados**: Si el colaborador ya tiene un pase registrado hoy, se mostrará una **alerta preventiva amarilla** en su expediente para evitar duplicidad de captura.
3.  **Selección Múltiple**: Puedes seguir buscando y agregando más personas a la misma emisión. Todos recibirán un pase independiente bajo la misma configuración de la incidencia.
4.  **Categoría y Formulario**: Selecciona el motivo (Salida Anticipada, Llegada Tarde, Ausencia, Incapacidad, etc.) y llena los datos correspondientes.
5.  **Generación**: Al dar clic en "Notificar y Generar", el pase nace en estado **Pendiente** y se disparan inmediatamente las notificaciones a los responsables.

---

## 3. Flujo Estricto de Autorización y Notificaciones

**La plataforma prohíbe auto-autorizaciones y atajos internos.** Un pase no puede aprobarse desde adentro del sistema de forma directa; todo ocurre de forma auditable mediante el flujo externo.

1.  **Enrutamiento Configurable**: Al generarse, el pase evalúa las "Reglas de Enrutamiento" de WhatsApp configuradas por los administradores. Si el puesto y plantel del empleado coinciden con una regla, se dirige a esa persona. De lo contrario, cae en el comportamiento base (se notifica a los contactos registrados en ese Plantel).
2.  **Notificación Global y Obligatoria**: Además de WhatsApp, todo requerimiento de autorización se documenta obligatoriamente en el grupo maestro de Telegram para visibilidad directiva.
3.  **Autorización Externa**: El responsable recibe un mensaje detallando el movimiento y un **enlace seguro y único**. Al abrir el enlace, entra a la "Vista de Autorización".
4.  **Segregación de Funciones**: Si la persona que abre el enlace fue quien capturó el pase o es el empleado afectado, el sistema le **denegará** la posibilidad de autorizarlo.
5.  **Resolución**: Una vez autorizado o rechazado, el pase se cierra. El registro guardará quién tomó la decisión y en qué momento preciso, volviéndose inalterable en este sentido.

---

## 4. Historial, Vistas de Detalle y Modificaciones

El **Historial** es el centro de auditoría y consulta.

*   **Inspección Individual**: Puedes hacer clic en el folio de cualquier pase (Ej. `#00124`) para abrir la **Vista de Detalle**. Esta pantalla centraliza de forma limpia y confiable toda la radiografía del movimiento: datos del empleado, justificación, estatus del flujo de autorización y la bitácora técnica de entrega de notificaciones (si falló el mensaje o se entregó correctamente).
*   **Edición y Anulación Restringida**: Si hubo un error en la captura (ej. fecha equivocada), el pase puede ser modificado o anulado.
    *   *Regla Estricta:* **Solamente el usuario que generó el pase puede editarlo o anularlo.** Ninguna otra persona tiene este privilegio sobre el registro ajeno.
    *   *Límite de Tiempo:* Esta acción solo es posible durante las primeras **48 horas** desde la fecha del evento, siempre y cuando el pase no esté cancelado ni rechazado previamente.
*   **Impresión Eliminada**: Como parte de la transformación digital, no hay funcionalidad para imprimir pases. La autorización digital es la única validación necesaria.

---

## 5. Gestión del Directorio y Enrutamiento (Administradores)

1.  **Directorio (Workspace)**: Vincula correos institucionales de los responsables con sus números telefónicos móviles y los agrupa por Plantel.
2.  **Reglas de Enrutamiento**: Permite crear rutas dinámicas. Ejemplo: *"Si el Puesto del empleado es Guardia y su Plantel es el 4, entonces enruta la solicitud de notificación a este número de WhatsApp en específico"*. Esto permite mapear la jerarquía real al producto.

---

## 6. Monitoreo de Usuarios (Administradores)

La sección **Usuarios** despliega a todas las personas que han entrado al sistema. Permite auditar cuántos pases han generado y cuántos han autorizado. Mediante un interruptor rápido, los administradores pueden otorgar o retirar el acceso privilegiado al panel de administración a cualquier operador logueado.