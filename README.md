# bot-de-pure
Bot de puré es un bot de entretenimiento, búsqueda de imágenes y utilidades generales varias. Utiliza comandos tradicionales con adiciones inspiradas en terminales como <code>--flags</code>.<br>
Como personaje, es una robot "mujer". Es torpe y agresiva en algunos casos, pero parece tener espíritu.

![portadabot](https://i.imgur.com/oVC8pMV.png)

## Índice
* [Convenciones de Desarrollo](#convenciones-de-desarrollo)
* [Convenciones de páginas de ayuda](#convenciones-de-páginas-de-ayuda-de-comandos)
* [Principales herramientas utilizadas](#principales-herramientas-utilizadas)
* [Tareas de refactorización](#tareas-de-refactorización)
* [Integrantes](#integrantes)


## Contenido
### Convenciones de Desarrollo
Con el fin de trabajar de forma más eficiente y organizada, se siguen las siguientes convenciones
* **Comandos**
  - deberían de ser los más intuitivos ya que forman parte del uso básico de la mayoría de comandos
  - se deben ingresar en orden a menos que el ordenarlos se vuelva más confuso para el comando en cuestión
* **Flags**
  - se deben de poder ingresar en cualquier orden
  - deben tener, si es posible, versiones cortas y largas
  - las versiones cortas deberían ser la inicial de la contraparte larga
  - las versiones largas solo deberían tener caracteres alfabéticos

### Convenciones de páginas de ayuda de comandos
WIP

### Principales herramientas utilizadas
Herramientas y paquetes ampliamente utilizados
* Node.js
* Discord.js
* Keyv
* SQLite
* Node Canvas
* Chalk

### Tareas de refactorización
- [x] Organizar archivos comunes en subdirectorios
- [ ] Preparar base de datos persistente
- [ ] Extraer algunos objetos de config.json en nuevos archivos
- [ ] Optimizar todo func.js
- [ ] Transferir arrays estructuras grandes en index.js a otros archivos

### Integrantes
Personas involucradas en el desarrollo de Bot de Puré, con sus tags de Discord.
* **Creador** Papita con Puré#6932 _(Programador, Editor, Diseñador, Decisor, Ideas, Testing)_
* **Participantes**
  - GoddamnBernkastel#6299 _(Editor, Decisor)_
  - Imagine Breaker#6299 _(Decisor, Ideas, Testing)_
  - Sassafras#3331  _(Decisor, Ideas, Testing)_
* **Colaboradores**
  - Rakkidei#4790 _(Artista | [pixiv](https://www.pixiv.net/en/users/58442175) [Twitter](https://twitter.com/rakkidei))_
  - Super Arathy's 12#8235 _(Ideas, Testing)_
  - Taton#0122 _(Editor)_