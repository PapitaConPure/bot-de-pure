![GitHub package.json dependency version (prod)](https://img.shields.io/node/v/package-json)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/discord.js)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/mongoose)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/canvas)
![GitHub deployments](https://img.shields.io/github/deployments/PapitaConPure/bot-de-pure/bot-de-pure?logo=GitHub)
![GitHub repo size](https://img.shields.io/github/repo-size/PapitaConPure/bot-de-pure)
![Twitter Follow](https://img.shields.io/twitter/follow/PapitaPure?label=%40PapitaPure&style=social&link=https://twitter.com/PapitaPure)

![portada](https://i.imgur.com/QNFStF8.png)
<h1 align="center">Bot de Puré</h1>
<p align="right"><sup><i>(La ilustración original le pertenece a <a href="https://www.pixiv.net/en/artworks/73482947">カンパ</a>, quien no forma parte de ni está relacionado con el proyecto de desarrollo de Bot de Puré)</i></sup></p>

Bot de entretenimiento, búsqueda de imágenes y utilidades generales varias para Discord. Utiliza comandos tradicionales con adiciones inspiradas en terminales como `--flags` o los nuevamente introducidos comandos estandarizados de /barra.<br>
Como personaje, es una robot torpe y agresiva en algunos casos, pero parece meterle ganas.

> [!IMPORTANT]
> Ejecutar una copia local te dará una experiencia más responsiva con Bot de Puré y te permitirá modificar su comportamiento a gusto.
> 
> Para aquellos que quieran ejecutar una copia local:
> * Introduce los archivos `./localenv.json` y `./remoteenv.json`, ambos con el siguiente formato (no compartas los datos con nadie):
>   ```js
>   {
>     "token": "<<El Token de la aplicación de Discord sobre la cual operarás el bot>>",
>     "dburi": "<<La URI de la Base de Datos de MongoDB que usarás>>",
>     "booruapikey": "<<La clave de API de una cuenta de Gelbooru>>",
>     "booruuserid": "<<La ID de usuario de la misma cuenta de Gelbooru>>",
>     "imgurclientid": "<<La ID de cliente de una cuenta de Imgur>>",
>     "aikey": "<<Una clave de API de Groq.com para comandos de IA>>"
>   }
>   ```
> * `localenv.json` se usa para un entorno de **desarrollo**, mientras que `remoteenv.json` se usa para un entorno de **producción**. Esta solución no es para nada elegante pero me ha estado funcionando bien de momento
> * Al ejecutar con Node, usas la bandera `-d` para usar el entorno de **desarrollo** y `-p` para el entorno de **producción**
>   ```cmd
>   node . -d
>   ```

## Índice
* [Tecnologías Principales](#tecnologías-principales)
* [Características](#características)
* [Convenciones de Desarrollo](#convenciones-de-desarrollo)
* [Integrantes](#integrantes)

<hr><br>

## Tecnologías Principales
* [Node.js](https://nodejs.org)
* [discord.js](https://discord.js.org)
* [MongoDB](https://www.mongodb.com) / [Mongoose](https://github.com/Automattic/mongoose)

## Características
* Personalización a nivel de servidor y usuario
* Soporte de comandos por mensaje (p!) y por uso de barra (/)
  Comando de Mensaje | Comando Slash
  -------------------|--------------
  ![mensaje](https://github.com/user-attachments/assets/900d1723-1215-45b9-94e8-4caf1f014dbf) | ![slash](https://github.com/user-attachments/assets/2e5ac62d-0d41-4921-8b3c-4b067a3d9927)


* Fácil y rápida automatización en servidores gracias al uso de Asistentes de Configuración:
  - Usa el Asistente PuréFeed para **programar el envío de imágenes de Gelbooru** en un canal, con las tags que quieras<br>
    ![purefeed](https://github.com/user-attachments/assets/680fb037-a08e-44cb-a992-1fcb2f4e2d46)
  - Usa el Asistente PuréVoice para configurar una categoría de **canales de voz dinámicos avanzados** (sesiones PuréVoice)<br>
    ![purevoice](https://github.com/user-attachments/assets/cdeb7d40-29f8-47bf-99ca-c469c6b65752)
  - Usa el Asistente de Confesiones para facilitar la distribución de confesiones anónimas, seguras y con protección contra abusos<br>
    ![confesion](https://github.com/user-attachments/assets/53ab6d7d-af77-4fe2-b7e5-14de714a9e74)
* Fáciles y rápidas configuraciones de usuario por medio del comando `p!yo` o `/yo`<br>
  ![userconfigs](https://github.com/user-attachments/assets/72bad62e-27e1-4b44-aa85-3dfea173d0c6)
  - Configura nombres automáticos de sesión y otras preferencias de usuario para sesiones de voz (PuréVoice)
  - Corrección automática de previsualizaciones de enlaces de **Twitter/X** (Puréet) y pixiv (Purépix)
  - Edita tus suscripciones a tags de Feeds de imágenes (PuréFeed)
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
> Empecé este proyecto con 0 conocimiento sobre JavaScript y para cuando me di cuenta creció demasiado, así que ando navegando unos 5 años de mi propia deuda técnica.

> [!NOTE]
> No esperes ningún tipo de madurez tanto emocional como intelectual si lees el código o usas a Bot de Puré
