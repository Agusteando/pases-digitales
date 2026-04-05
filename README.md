# Pases Digitales - Guía Operativa

Bienvenido a la plataforma de **Pases Digitales**. Este sistema reemplaza los antiguos talonarios y formatos impresos por un modelo de seguimiento 100% digital, trazable y basado en notificaciones para la autorización de incidencias del personal.

Esta guía explica cómo funciona el producto desde la perspectiva del usuario operativo y administrativo.

---

## 1. Ingreso y Niveles de Acceso

El acceso al sistema se realiza exclusivamente a través de **Autenticación Institucional (Google Workspace)**. Al ingresar con tu cuenta de correo corporativo, el sistema identificará automáticamente tus permisos.

Existen dos tipos de usuario:

*   **Usuario Estándar**: Puede generar pases, buscar colaboradores, revisar el historial global, inspeccionar detalles de los pases y exportar reportes. No tiene acceso a configuración.
*   **Administrador**: Tiene acceso total. Además de las funciones estándar, puede visualizar métricas (Dashboard), configurar reglas de enrutamiento, gestionar el directorio telefónico (WhatsApp) y administrar los privilegios de otros usuarios del sistema.

*(Los usuarios que ingresan por primera vez se registran como estándar. Solo un administrador puede otorgar permisos administrativos en la sección "Usuarios").*

---

## 2. Emisión de Pases

El flujo principal ("Generar Pase") está diseñado para ser rápido y permitir la selección múltiple en caso de incidencias grupales.

1.  **Búsqueda del Colaborador**: En la pantalla principal, utiliza la barra de búsqueda para encontrar al colaborador por nombre o apellidos. El sistema cruzará información de los sistemas internos y Signia para asegurar que el perfil sea oficial y traerá su puesto y plantel actual.
2.  **Prevención de Duplicados**: Al seleccionar a un colaborador, aparecerá a la derecha su "Expediente". Si el colaborador ya tiene un pase registrado hoy, el sistema mostrará una **alerta amarilla** advirtiendo sobre la posible duplicidad.
3.  **Selección Múltiple**: Puedes seguir buscando y agregando más de un colaborador a la misma emisión. Todos recibirán un pase independiente bajo la misma configuración.
4.  **Categoría y Formulario**: Selecciona el motivo (Salida Anticipada, Llegada Tarde, Ausencia, Incapacidad, etc.) y llena los campos requeridos (fechas, horas, si regresan al plantel y justificación). En caso de Incapacidades, se solicitan datos médicos como Folio IMSS.
5.  **Generación**: Al hacer clic en "Notificar y Generar", se crearán los folios con estado **Pendiente** y se disparará el proceso de notificación.

---

## 3. Flujo de Autorización y Notificaciones

**La plataforma no permite auto-autorizaciones ni atajos internos.** Todo pase nace como "Pendiente" y debe ser autorizado por el responsable adecuado a través del flujo externo.

1.  **Enrutamiento**: Al generar el pase, el sistema revisa las "Reglas de Enrutamiento" configuradas. Determina a quién (qué número de WhatsApp o canal de Telegram) debe enviarse la solicitud de autorización, basándose en el Plantel y Puesto del colaborador.
2.  **Notificación Externa**: El responsable recibe un mensaje por WhatsApp / Telegram detallando el movimiento, junto con un enlace seguro y único (Token).
3.  **Autorización Remota**: Al hacer clic en el enlace, el responsable abre una vista dedicada donde visualizará los detalles completos y podrá **Autorizar** o **Rechazar** el movimiento.
    *   *Regla de Negocio:* El sistema bloqueará el intento si el creador del pase intenta autorizar su propio pase (Segregación de funciones).
4.  **Cierre del Flujo**: Una vez resuelto, el pase cambia su estado, registrando exactamente quién tomó la decisión y en qué momento. El pase ya está validado institucionalmente.

---

## 4. Historial, Modificaciones y Detalles

La vista de **Historial** es el centro de control operativo para auditoría y correcciones.

*   **Inspección Individual**: Puedes hacer clic en el folio de cualquier pase (Ej. `#00124`) para abrir la **Vista de Detalle del Pase**. Aquí podrás ver de forma visual toda la información cruzada: fechas, estado de entrega de notificaciones, registro de autorización (quién y cuándo) y evidencia adjunta.
*   **Modificaciones (Editar)**: Los pases pueden editarse si hubo un error de captura (ej. se puso mal la fecha o la hora).
    *   *Regla de Negocio:* Solo se pueden editar pases creados en las últimas **48 horas**. Pases antiguos se bloquean (candado de Solo Lectura).
    *   Solo el **creador** del pase o un **Administrador** pueden aplicar ediciones. Pases Cancelados o Rechazados no pueden ser editados.
*   **Anulación**: Si un pase no debía existir o la justificación cambió drásticamente, el creador o un administrador puede abrir el menú de edición y utilizar el botón rojo para **Anular Pase**. Esto lo marcará como `Cancelado` de manera permanente y no podrá reactivarse.

---

## 5. Gestión del Directorio y Enrutamiento (Solo Administradores)

La sección **Rutas** es donde la magia de las notificaciones ocurre. 

1.  **Directorio (Workspace)**: Es un espejo controlado del directorio telefónico. Permite vincular correos de responsables con sus números de teléfono reales. Aquí se define quién es el *Director* o *Administrativo* de cada plantel.
2.  **Reglas de Enrutamiento**: Si no hay reglas, el sistema enviará los pases a los contactos registrados en el Plantel del colaborador. Sin embargo, se pueden crear reglas avanzadas: *"Si el Puesto es Guardia y el Plantel es 4 - CT Fiscal, envía la notificación de autorización a esta persona específica"*. 

Este módulo permite modelar la estructura real de permisos de la institución directamente en las notificaciones del producto.

---

## 6. Usuarios del Sistema

La sección **Usuarios** (visible para administradores) lista a todas las personas que se han autenticado al menos una vez en Pases Digitales con Google.

Desde aquí se monitorea:
*   El último acceso de cada persona.
*   Cuántos pases ha generado en total.
*   Cuántos pases ha autorizado como responsable.
*   **Otorgar Privilegios**: Mediante un interruptor (checkbox), un administrador puede ascender a otro usuario a nivel administrador o revocarle el acceso administrativo de forma instantánea.

---
*Fin del documento operativo.*