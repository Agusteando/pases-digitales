# Pases Digitales - Manual Operativo

Plataforma institucional de **Pases Digitales** diseñada para la gestión, emisión y autorización remota de justificaciones de incidencias laborales. El sistema elimina los procesos manuales y centraliza el control mediante notificaciones distribuidas individualizadas.

## 1. Modelo de Autorización Descentralizada (Sin Login)
El sistema emplea un esquema de seguridad de vanguardia diseñado para la fricción cero en las jefaturas. 
*   **Aprobación Directa**: Cuando se emite un pase, el motor de enrutamiento genera un **enlace criptográfico único y firmado (JWT)** exclusivo para cada responsable notificado. 
*   **Fricción Cero**: El director o responsable que recibe el WhatsApp **no necesita iniciar sesión** en la plataforma. Al hacer clic en el enlace, el sistema valida la firma del token para saber de manera irrefutable qué persona está accediendo a la solicitud.
*   **Trazabilidad Intacta**: Al autorizar o rechazar, el registro se graba permanentemente a nombre de ese destinatario, manteniendo un expediente de auditoría perfecto sin requerir gestión de contraseñas.
*   **Regla de Seguridad**: El sistema detecta y bloquea matemáticamente los intentos de "auto-aprobación" (si el creador del pase o el empleado afectado intenta abrir el enlace, el acceso será denegado).

## 2. Flujo de Notificaciones (WhatsApp y Telegram)
Cada pase generado se distribuye automáticamente según el modelo de responsabilidades del plantel:
*   **Notificaciones Individualizadas (WhatsApp)**: Por defecto, el sistema localiza a los responsables vinculados al plantel del colaborador en el *Directorio Operativo*. Si existen 3 directivos, se envían 3 mensajes individuales por separado, cada uno con su propio token de autorización personalizado.
*   **Enrutamiento Inteligente (Reglas)**: Se pueden definir reglas de excepción. Ej. "Si el puesto es 'Vigilante', además de los directores, notificar específicamente al Coordinador de Operaciones". Las reglas y el directorio se combinan de forma inteligente.
*   **Auditoría Global (Telegram)**: Simultáneamente, se envía una notificación maestra de solo-lectura al canal directivo de Telegram para mantener un registro histórico global.

## 3. Directorio Operativo y Workspace
*   El directorio es la columna vertebral del enrutamiento. Se organiza estrictamente por **Plantel**.
*   **Vinculación Workspace**: Los contactos se agregan buscándolos directamente en la base de datos de correos institucionales de Google Workspace. Esto garantiza que las identidades y fotografías sean oficiales.
*   **Formato Chat ID**: El sistema requiere que el teléfono se configure como un ID de destino para la API de WhatsApp (`521XXXXXXXXXX@c.us`). La plataforma asiste al usuario auto-formateando números estándar a este protocolo técnico de manera automática.

## 4. Usuarios y Acceso al Dashboard
*   La captura y emisión de pases (acceso al panel web) sí requiere autenticación obligatoria mediante **Google Sign-In** con cuenta institucional.
*   Todo colaborador que ingresa con éxito se registra en la base de datos de usuarios. 
*   **Expedientes Visuales**: La plataforma cruza continuamente los datos con el catálogo de *Signia* y *Google Workspace* para inferir cumpleaños, roles y obtener fotografías reales, haciendo que la experiencia administrativa sea altamente visual y humana.