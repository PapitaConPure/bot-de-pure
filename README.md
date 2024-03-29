# bot-de-pure
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/discord.js)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/mongoose)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/pm2)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/PapitaConPure/bot-de-pure/canvas)
![GitHub deployments](https://img.shields.io/github/deployments/PapitaConPure/bot-de-pure/bot-de-pure?logo=GitHub)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/PapitaConPure/bot-de-pure)
![GitHub repo size](https://img.shields.io/github/repo-size/PapitaConPure/bot-de-pure)
![Discord](https://img.shields.io/discord/1107831054791876690?color=%235865F2&logo=Discord&label=Saki%20Scans&logoColor=%23fff&link=https://discord.gg/Pzk4PBWkez)
![Twitter Follow](https://img.shields.io/twitter/follow/PapitaPure?label=%40PapitaPure&style=social&link=https://twitter.com/PapitaPure)

Bot de entretenimiento, búsqueda de imágenes y utilidades generales varias para Discord. Utiliza comandos tradicionales con adiciones inspiradas en terminales como <code>--flags</code>.<br>
Como personaje, es una robot torpe y agresiva en algunos casos, pero parece tener espíritu.

![portadabot](https://i.imgur.com/oVC8pMV.png)

## Índice
* [Tecnologías](#tecnologías)
* [Características](#características)
* [Convenciones de Desarrollo](#convenciones-de-desarrollo)
* [Tareas de refactorización](#tareas-de-refactorización)
* [Integrantes](#integrantes)

## Tecnologías
* [Node.js](https://nodejs.org) 16.14.2
* [MongoDB](https://nodejs.org), [Mongoose](https://github.com/Automattic/mongoose)

## Características
* Bot multipropósito que se desempeña eficientemente en mayoría de sus funciones
* Personalización a nivel de servidor y usuario
* Fácil y rápida automatización de múltiples aspectos de un servidor gracias al uso de Asistentes de Configuración:
  - Usa el Asistente de Feeds de Imágenes para programar envío de imágenes de Gelbooru en un canal, con las tags que quieras
  - Usa el Asistente PuréVoice para configurar una categoría que crea y elimina canales de voz a medida que se vaya necesitando
* Soporte de comandos por mensaje y uso de barra diagonal "/"
* Soporte de comandos personalizados de servidor:
  - Se los llama "Tubérculos", contienen una TuberID y una respuesta que ejecutan al ser invocados
  - Los "Tubérculos simples" envían texto y/o archivos
  - Los "Tubérculos PuréScript" ejecutan una serie de instrucciones PuréScript para enviar respuestas más elaboradas
  - Puedes leer la documentación detallada del lenguaje PuréScript en [este PDF](https://drive.google.com/drive/folders/1wv2-n4J5SSZNH9oQ5gNEPpptm7rNFEnV?usp=share_link)
* Comandos altamente dinámicos
* Páginas de ayuda normalizadas y súper detalladas
### Metas
* Brindar más herramientas de personalización a nivel de servidor, canal y usuario; que sean fáciles de entender y ejecutar
* Ofrecer potentes herramientas de automatización que empoderen a TODOS los usuarios y aumenten la actividad del servidor
* Ofrecer una amplia capacidad de moderación en diferentes campos
* Sostener un ambiente relajado y casual con comandos de entretenimiento
* Divertirse
### Objetivos actuales
*Terminar PuréScript
* Hacer p!ajedrez
* Agregar ejemplos interactivos de comandos con p!ayuda
* Restaurar comandos Drawmaku
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

## Tareas de refactorización
Empecé este proyecto con 0 conocimiento sobre JavaScript y para cuando me di cuenta creció demasiado.
Es de esperarse que mi primera vez con un nuevo lenguaje no sea la mejor, sin mencionar las diferencias de experiencia. Esto repercutió principalmente en los archivos de index.js, func.js y config.json.
Esta lista de objetivos busca darle legibilidad y mantenibilidad a todo lo que conforma la estructura principal de Bot de Puré, además de volver mucho más eficiente la creación de nuevos comandos y más accesible la adición de nuevas características.
- [x] Preparar archivos de comando para búsqueda por metadata
- [x] Organizar archivos comunes en subdirectorios
- [x] Preparar base de datos persistente
- [ ] Optimizar todos los comandos
- [ ] Optimizar todo func.js
- [ ] Extraer algunos objetos de config.json en nuevos archivos
- [x] Deshacer el desastre de index.js en muchos archivos. Revisar lógica

## Integrantes
Personas involucradas en el desarrollo de Bot de Puré, con sus tags de Discord.
### Desarrolladores
* [Papita con Puré#6932](https://github.com/PapitaConPure)
### Participantes
* Imagine Breaker#6299
* Sassafras#3331
### Colaboradores
* Rakkidei#4790 <a href="https://www.pixiv.net/en/users/58442175"><img title="pixiv" src="https://static-s.aa-cdn.net/img/ios/337248563/2489b082849b6de4e4ebd8992f788952?v=1" width=16px height=16px></a> <a href="https://twitter.com/rakkidei"><img title="Twitter" src="https://companiesmarketcap.com/img/company-logos/256/TWTR.png" width=16px height=16px></a>
* Super Arathy's 12#8235
* Taton#0122