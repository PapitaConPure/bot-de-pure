![Bot de Puré](https://i.imgur.com/QNFStF8.png)

<p align="right"><sup><i>(La ilustración original le pertenece a <a href="https://www.pixiv.net/en/artworks/73482947">カンパ</a>, quien no forma parte de ni está relacionado con el proyecto de desarrollo de Bot de Puré)</i></sup></p>

![GitHub package.json dependency version (prod)](https://img.shields.io/node/v/package-json)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/discord.js)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/mongoose)
![GitHub deployments](https://img.shields.io/github/deployments/PapitaConPure/bot-de-pure/bot-de-pure?logo=GitHub)
![GitHub repo size](https://img.shields.io/github/repo-size/PapitaConPure/bot-de-pure)
![Twitter Follow](https://img.shields.io/twitter/follow/PapitaPure?label=%40PapitaPure&style=social&link=https://twitter.com/PapitaPure)

Bot de entretenimiento, búsqueda de imágenes y utilidades generales varias para Discord. Utiliza comandos tradicionales con adiciones inspiradas en terminales como `--flags` o los nuevamente introducidos comandos estandarizados de /barra.<br>
Como personaje, es una robot torpe y agresiva en algunos casos, pero parece meterle ganas.

> [!IMPORTANT]
> Ejecutar una copia local te dará una experiencia más responsiva con Bot de Puré y te permitirá modificar su comportamiento a gusto.
> 
> Revisa la sección de [Preparación](#preparación) y luego la de [Instalación y Configuración](#instalación-y-configuración) para más información.

## Índice
* [Tecnologías Principales](#tecnologías-principales)
* [Preparación](#preparación)
* [Instalación y Configuración](#instalación-y-configuración)
* [Características](#características)
* [Convenciones de Desarrollo](#convenciones-de-desarrollo)
* [Integrantes](#integrantes)

<hr><br>

## Tecnologías Principales
* [discord.js](https://discord.js.org)
* [MongoDB](https://www.mongodb.com) / [Mongoose](https://github.com/Automattic/mongoose)

## Preparación
#### Requerido
* Un runtime de JavaScript: **Bun 1.3.5+ (recomendado)** / NodeJS v20+ / Deno
* Un token de Discord. Obtenlo en el [portal de desarrolladores de Discord](https://discord.com/developers/applications)
* Una URI de base de datos de MongoDB. Obtenla en [su sitio](https://cloud.mongodb.com/v2/635277bf9f5c7b5620db28a4#clusters)

#### Optativo (para características adicionales)
* WIP

## Instalación y Configuración
### Descargar proyecto
Ejecuta esto en una terminal para clonar el repositorio:
```bash
git clone https://github.com/PapitaConPure/bot-de-pure.git
cd bot-de-pure
```

Alternativamente, si no te importa recibir actualizaciones, puedes descargar el último ZIP:
<p>
  <a href="https://github.com/PapitaConPure/bot-de-pure/archive/refs/heads/master.zip">
    <img src="https://img.shields.io/badge/Descargar-ZIP-blue?style=for-the-badge" alt="Descargar ZIP">
  </p>
</a>

### Instalar dependencias
<details open>
<summary>Bun</summary>

```bash
bun install
```
</details>
<details>
<summary>Node</summary>

```bash
npm install
```

</details>

<br>

### Configurar variables de entorno
Crea un archivo `.env.production` en la raíz del proyecto y ábrelo para editarlo. Completa los valores necesarios en base a esta referencia:

```env
DISCORD_TOKEN=
MONGODB_URI=
ENCRYPTION_KEY=
IV=
```

<details>
<summary>Ejemplo</summary>

```env
DISCORD_TOKEN=abcdefgh12345678ABCDEFGH.ABCDEF.abcdefghijklmn0123456789ABCDEFGHIJKLMN
MONGODB_URI=mongodb+srv://nombreusuario:contraseña@cluster.abc01.mongodb.net/botdepure?retryWrites=true&w=majority
ENCRYPTION_KEY=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789
IV=abcdef0123456789abcdef0123456789
```
</details>
<br>

Para funciones adicionales, puedes completar estos valores respectivos:
```env
GELBOORU_APIKEY=
GELBOORU_USERID=
IMGUR_CLIENT_ID=
GROQ_KEY=
```

<details>
<summary>Ejemplo</summary>

```env
GELBOORU_APIKEY=abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz01
GELBOORU_USERID=123456
IMGUR_CLIENT_ID=abcdefg12345678
GROQ_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRST
```
</details>
<br>

Alternativamente, si no te queda claro, puedes revisar el archivo `.env.example` a modo de referencia.

> [!WARNING]
> Los archivos `.env` son de naturaleza sensible, **nunca** los subas a Internet.
> 
> **NUNCA** completes el archivo `.env.example` con datos reales. Crea un nuevo archivo llamado `.env.production` en su lugar.

### Comprobar scripts y dependencias
**Puedes saltarte este paso si estás usando Bun.**

Si estás usando Node, abre el archivo `package.json` y edita las partes indicadas:
```jsonc
{
  // (...)
  "engines": {
    "node": "^20.x"
  },
  "main": "index.js",
  "scripts": {
    "dev": "node --env-file=.env.dev .",
    "prod": "node --env-file=.env.production .",
    // (...)
  },
  // (...)
}

Adicionalmente, desinstala `@types/bun`:
```bash
npm uninstall @types/bun
```

### Mensajes de estado
Crea un archivo `status.txt` en `systems/presence/` y ábrelo para editarlo.

Cada línea en este archivo es un texto que aparecerá periódicamente como el estado de tu bot.
Aprovéchalo para colocar información útil, frases de personaje o chistes.

Solo asegúrate de que las líneas no sean muy largas, pues hay un límite de caracteres.

### Prefijo
Los prefijos de Bot de Puré se almacenan como expresiones regulares. Por ende, para cambiar el prefijo por defecto de tu bot ("p!"), debes [escribir una expresión regular](https://regexr.com).

La definición de prefijos se encuentra en `data/globalProps.ts`, desde la fila ~`59` hasta la ~`67`. Para modificar el prefijo por defecto, edita las propiedades dentro de las llaves de `'0'`:
* `raw`: Cómo se muestra tu prefijo a otros usuarios en comandos de ayuda.
* `regex`: La expresión regular con la que el bot detecta tu prefijo.

```ts
export const prefixes: Record<string, PrefixPair> = {
	'0': {
		raw: 'p!',
		regex: /^p *!\s*/i,
	}
};
```

### Usar emojis personalizados
Sube los emojis personalizados que quieras usar en [la pestaña de Emojis de tu bot](https://discord.com/developers/applications).
Luego, reemplaza los markdowns y las IDs de emojis personalizados en el código.

## Características
* Personalización a nivel de servidor y usuario
* Soporte de comandos por mensaje (p!) y por uso de barra (/)
  Comando de Mensaje | Comando Slash
  -------------------|--------------
  ![mensaje](https://github.com/user-attachments/assets/900d1723-1215-45b9-94e8-4caf1f014dbf) | ![slash](https://github.com/user-attachments/assets/2e5ac62d-0d41-4921-8b3c-4b067a3d9927)


* Fácil y rápida automatización en servidores gracias al uso de Asistentes de Configuración:
  - Usa el Asistente Boorutato para **programar el envío de imágenes de Gelbooru** en un canal, con las tags que quieras<br>
    ![boorutato](https://github.com/user-attachments/assets/680fb037-a08e-44cb-a992-1fcb2f4e2d46)
  - Usa el Asistente PuréVoice para configurar una categoría de **canales de voz dinámicos avanzados** (sesiones PuréVoice)<br>
    ![purevoice](https://github.com/user-attachments/assets/cdeb7d40-29f8-47bf-99ca-c469c6b65752)
  - Usa el Asistente de Confesiones para facilitar la distribución de confesiones anónimas, seguras y con protección contra abusos<br>
    ![confesion](https://github.com/user-attachments/assets/53ab6d7d-af77-4fe2-b7e5-14de714a9e74)
* Fáciles y rápidas configuraciones de usuario por medio del comando `p!yo` o `/yo`<br>
  ![userconfigs](https://github.com/user-attachments/assets/72bad62e-27e1-4b44-aa85-3dfea173d0c6)
  - Configura nombres automáticos de sesión y otras preferencias de usuario para sesiones de voz (PuréVoice)
  - Corrección automática de previsualizaciones de enlaces de **Twitter/X** (Puréet) y pixiv (Purépix)
  - Edita tus suscripciones a tags de Feeds de imágenes (Boorutato)
  - Soporte de español, inglés y (parcialmente) japonés
* Fácil reproducción de música con sencilla gestión de colas de reproducción<br>
  ![puremusic](https://github.com/user-attachments/assets/9168f6fd-2c8c-409b-8745-b8f64cab3258)
* Soporte de **comandos personalizados** de servidor
  - Se los llama "Tubérculos", contienen una TuberID y una respuesta que ejecutan al ser invocados<br>
    ![tubers](https://github.com/user-attachments/assets/90d67499-5002-4b56-9d4e-530cbf78869c)
  - Los "Tubérculos simples" envían texto y/o archivos<br>
    ![simpletuber](https://github.com/user-attachments/assets/5175ccc6-7089-4cd4-a4d2-d26746eda544)
  - Los "Tubérculos avanzados" ejecutan una serie de instrucciones **PuréScript** para enviar respuestas más elaboradas<br>
    ![pstuber](https://github.com/user-attachments/assets/a434e3c5-8993-4672-bc04-5564c7418d7b)
  - Puedes leer la documentación detallada del lenguaje PuréScript [aquí](https://papitaconpure.github.io/ps-docs/)<br>
    ![psdocs](https://i.imgur.com/T6kxYxq.png)
* Herramientas de moderación y estadísticas (más por venir)
* Minijuegos (más por venir)
* Wiki de comandos y guías de uso básico por medio del comando `p!ayuda`
### Metas
* Brindar más herramientas de personalización a nivel de servidor, canal y usuario; que sean fáciles de entender y ejecutar
* Ofrecer potentes herramientas de automatización que empoderen a TODOS los usuarios y aumenten la actividad del servidor
* Ofrecer una amplia capacidad de moderación y auditoría en diferentes campos
* Sostener un ambiente relajado y casual con comandos de entretenimiento
* Tropezarse y aprender sobre la marcha
* Divertirse
### Objetivos actuales
* Terminar PuréScript
* Agregar ejemplos interactivos de comandos con p!ayuda
* Minijuegos individuales y tipo "fiesta"
* Agregar GIFs infográficos en comandos
* Crear página de ayuda Web para no limitarse a mensajes de Discord

## Convenciones de Desarrollo
Con el fin de trabajar de forma más eficiente y organizada, se siguen las siguientes convenciones
* **Comandos**
  - deben tener aliases siempre que sea posible
  - los aliases deberían ser sinónimos, versiones acortadas o las iniciales del nombre del comando
  - se deberían incluir aliases en inglés siempre que sea posible
  - siempre que sea aplicable, debería haber una versión por mensaje y una versión por "/" del comando
  - Deben tener una página de ayuda lo más descriptiva y breve posible
* **Parámetros**
  - deberían de ser los más intuitivos ya que forman parte del uso básico de la mayoría de comandos
  - se deben ingresar en un orden específico, a menos que:
    - el darles un orden vuelva muy confuso al comando en cuestión
    - el orden de los mismos sea por motivos demasiado abstractos
* **Banderas**
  - se deben de poder ingresar en cualquier orden
  - deben tener, si es posible, versiones cortas y largas
  - las versiones cortas deberían ser la inicial de la contraparte larga
  - las versiones largas solo deberían tener caracteres alfabéticos

## Integrantes
Personas involucradas en el desarrollo de Bot de Puré, con sus tags de Discord.
### Desarrolladores
* `papitaconpure` Papita con Puré#6932 <a href="https://discord.com/users/423129757954211880"><img title="Discord" src="https://i.imgur.com/KaQ0Ccd.png" height=16px></a> <a href="https://github.com/PapitaConPure"><img title="GitHub" src="https://i.imgur.com/dBRNLA7.png" height=16px></a>
### Participantes
* `imbreaker.` Imagine Breaker#6299
* `sassafras_doya` Sassafras#3331
### Colaboradores
* `rakkidei` Rakkidei#4790 <a href="https://www.pixiv.net/en/users/58442175"><img title="pixiv" src="https://i.imgur.com/fzpNfzD.png" height=16px></a> <a href="https://twitter.com/rakkidei"><img title="Twitter" src="https://companiesmarketcap.com/img/company-logos/256/TWTR.png" height=16px></a>
* `superarathys12` Super Arathy's 12#8235
* `taton` Taton#0122

<hr><br>

> [!NOTE]
> Empecé este proyecto con 0 conocimiento sobre JavaScript y para cuando me di cuenta creció demasiado, así que ando navegando unos 6 años de mi propia deuda técnica.
