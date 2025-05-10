import Main from '@/components/layout/Main'
import Section from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { faDiscord } from '@fortawesome/free-brands-svg-icons'
import {
  faBan,
  faBookBookmark,
  faChartDiagram,
  faCircleNodes,
  faClipboardCheck,
  faCode,
  faCogs,
  faCouch,
  faGrinTongueWink,
  faHeadphonesAlt,
  faHexagonNodes,
  faImage,
  faList,
  faMusic,
  faRobot,
  faScrewdriver,
  faScrewdriverWrench,
  faServer,
  faShieldAlt,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <Main>
      <section className="grid max-h-[75vh] min-h-[75vh] grid-rows-[1fr_max-content_1fr] items-center px-8 sm:items-start sm:px-10 md:px-8 lg:px-10 xl:px-12">
        <div className="row-start-2 flex flex-col-reverse items-center justify-center gap-6 sm:gap-10 md:flex-row md:gap-20 lg:gap-20 xl:gap-26">
          <div className="flex flex-col items-center gap-2 md:items-start md:gap-[32px]">
            <h1 className="mb-1 max-w-74 text-center text-2xl font-extrabold tracking-[-.01em] sm:mb-2 sm:max-w-84 sm:text-[27px] md:-mb-2 md:max-w-94 md:text-left md:text-3xl lg:max-w-150 lg:text-5xl xl:max-w-188 xl:text-6xl">
              Dale a tu servidor el gusto que se merece
            </h1>
            <p className="text-center text-xs sm:text-left sm:text-sm md:max-w-94 md:text-base lg:max-w-150 lg:text-lg xl:max-w-188">
              Transforma tu servidor con herramientas avanzadas y
              personalización única.
            </p>

            <div className="mt-6 flex w-3/4 flex-col items-center gap-4 sm:w-5/6 md:mt-0 md:w-full md:flex-row">
              <a
                className="bg-discord hover:bg-discord/80 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-solid border-transparent px-4 text-sm font-medium text-white transition-colors sm:h-12 sm:text-base md:w-auto md:px-5"
                href="https://discord.com/oauth2/authorize?client_id=651250669390528561"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faDiscord} />
                <span className="hidden lg:inline">Agregar Aplicación</span>
                <span className="inline lg:hidden">Agregar App</span>
              </a>
              <Link
                href="/learn"
                className="flex w-full items-center justify-center md:w-[117px] lg:w-auto"
              >
                <Button
                  variant="outline"
                  className="hover:bg-foreground/5 h-10 w-full rounded-md border border-solid px-4 text-sm font-medium transition-colors sm:h-12 sm:text-base md:px-5"
                >
                  <span className="inline sm:hidden lg:inline">
                    Aprender Más
                  </span>
                  <span className="hidden sm:inline lg:hidden">Ayuda</span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative h-48 min-w-48 sm:h-64 sm:min-w-64 md:h-72 md:min-w-72 lg:h-88 lg:min-w-88 xl:h-112 xl:min-w-112">
            <div className="shadow-primary/60 bg-primary/60 absolute inset-0 h-48 animate-[pulse_16s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full mix-blend-multiply shadow-[0_0_600px] blur-lg transition-all sm:h-64 md:h-72 lg:h-88 xl:h-112 dark:scale-120 dark:mix-blend-lighten dark:blur-2xl" />
            <div className="border-primary/30 absolute inset-0 h-48 animate-[ping_3s_cubic-bezier(0,0,0.3,1)_infinite] rounded-full border mix-blend-multiply transition-transform motion-reduce:hidden sm:h-64 md:h-72 lg:h-88 xl:h-112 dark:mix-blend-lighten" />
            <Image
              src="./boticon.webp"
              alt="Logo de Bot de Puré"
              priority
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 639px) 192px, (max-width: 767px) 256px, (max-width: 1023px) 288px, (max-width: 1279px) 352px, 448px"
              className="border-foreground/10 relative h-48 rounded-full border drop-shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 sm:h-64 md:h-72 lg:h-88 xl:h-112 dark:border-0 dark:drop-shadow-none"
            />
          </div>
        </div>
      </section>
      <Section variant={'delimited'} className="my-0 border-t-foreground/6 flex w-full flex-col gap-y-6 border-t px-8 py-4 sm:px-10 sm:py-6 lg:px-14 lg:py-10 xl:px-16 xl:py-12">
        <div className="flex flex-col flex-nowrap gap-x-6 gap-y-6 md:flex-row md:justify-center">
          <div className="bg-secondary/20 flex min-w-5/6 flex-col gap-y-6 self-start rounded-md px-6 pt-4 pb-6 sm:w-2/3 md:w-1/2 md:min-w-0 md:self-auto lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              Utilidad Ante Todo
            </h1>
            <ul className="mx-auto flex flex-col gap-y-6 text-xs sm:text-left sm:text-sm md:gap-y-5 lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faClipboardCheck}
                />
                <span>Simplifica tareas por defecto.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faCouch} />
                <span>Brinda cómodo acceso a servicios comunes.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faRobot} />
                <span>Ofrece poderosos sistemas automáticos.</span>
              </li>
            </ul>
          </div>
          <div className="bg-secondary/20 flex min-w-5/6 flex-col gap-y-6 self-end rounded-md px-6 pt-4 pb-6 sm:w-2/3 md:w-1/2 md:min-w-0 md:self-auto lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              Moderación
            </h1>
            <ul className="mx-auto flex flex-col gap-y-6 text-xs sm:text-left sm:text-sm md:gap-y-5 lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faList} />
                <span>Especifica reglas flojas o estrictas.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faScrewdriverWrench}
                />
                <span>Define acceso y permisos con precisión.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faBan} />
                <span>Castiga miembros rápidamente.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col flex-nowrap gap-x-6 gap-y-6 md:flex-row md:justify-center">
          <div className="bg-secondary/20 flex min-w-5/6 flex-col gap-y-6 self-start rounded-md px-6 pt-4 pb-6 sm:w-2/3 md:w-1/2 md:min-w-0 md:self-auto lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              Entretenimiento
            </h1>
            <ul className="mx-auto flex flex-col gap-y-6 text-xs sm:text-left sm:text-sm md:gap-y-5 lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faGrinTongueWink}
                />
                <span>Comandos de memes, respuestas y emotes.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faImage} />
                <span>Búsqueda de multimedia de anime y manga.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faMusic} />
                <span>Reproducción de música fácil y sin rodeos.</span>
              </li>
            </ul>
          </div>
          <div className="bg-secondary/20 flex min-w-5/6 flex-col gap-y-6 self-end rounded-md px-6 pt-4 pb-6 sm:w-2/3 md:w-1/2 md:min-w-0 md:self-auto lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              Personalización de Usuario
            </h1>
            <ul className="mx-auto flex flex-col gap-y-6 text-xs sm:text-left sm:text-sm md:gap-y-5 lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faUser} />
                <span>Todas tus preferencias en un solo lugar.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faServer} />
                <span>Interoperabilidad con sistemas de servidor.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faScrewdriver}
                />
                <span>Configuración directa, intuitiva y fácil.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col flex-nowrap gap-x-6 gap-y-6 md:flex-row md:place-content-evenly md:content-evenly md:justify-center">
          <div className="bg-secondary/20 flex min-w-5/6 flex-col gap-y-6 self-start rounded-md px-6 pt-4 pb-6 sm:w-2/3 md:w-1/2 md:min-w-0 md:self-auto lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              Personalización de Servidor
            </h1>
            <ul className="mx-auto flex flex-col gap-y-6 text-xs sm:text-left sm:text-sm md:gap-y-5 lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faChartDiagram}
                />
                <span>Comandos personalizados de servidor.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faCogs} />
                <span>Mecanismos absurdamente configurables.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faShieldAlt}
                />
                <span>Medidas de seguridad cuando las necesites.</span>
              </li>
            </ul>
          </div>
          <div className="bg-secondary/20 flex min-w-5/6 flex-col gap-y-6 self-end rounded-md px-6 pt-4 pb-6 sm:w-2/3 md:w-1/2 md:min-w-0 md:self-auto lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              Funcionalidad Avanzada
            </h1>
            <ul className="mx-auto flex flex-col gap-y-6 text-xs sm:text-left sm:text-sm md:gap-y-5 lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon className="text-accent w-4" icon={faCode} />
                <span>Crea comandos avanzados con PuréScript.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faHeadphonesAlt}
                />
                <span>Despliega sesiones de voz dinámicamente.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon
                  className="text-accent w-4"
                  icon={faBookBookmark}
                />
                <span>Documentación extensiva y detallada.</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>
      <Section size={'full'} variant={'accent'} className="my-4 flex w-full flex-col gap-y-6 px-8 py-4 sm:my-6 sm:px-10 sm:py-6 md:py-8 lg:my-10 lg:px-14 lg:py-16 xl:my-12 xl:px-16 xl:py-24">
        <div className="flex flex-col items-center gap-x-16 gap-y-4 md:flex-row md:justify-between lg:justify-center lg:gap-x-32 xl:gap-x-48">
          <div className="bg-accent text-accent-foreground md:text-primary-foreground/25 flex h-16 w-16 items-center justify-center rounded-full md:h-full md:min-h-full md:w-auto md:flex-col md:bg-inherit">
            <div className="md:hidden">
              <FontAwesomeIcon icon={faCircleNodes} size="3x" />
            </div>
            <div className="hidden md:block">
              <FontAwesomeIcon icon={faCircleNodes} size="10x" />
            </div>
          </div>
          <div>
            <h2 className="text-center text-3xl font-extrabold sm:text-4xl md:w-max md:min-w-full md:text-right">
              Simplicidad Por Defecto
            </h2>
            <div className="mt-4 flex flex-col gap-y-2 md:max-w-100">
              <p>
                La mejor forma de no cometer errores es evitar que puedas cometerlos en primer lugar.
              </p>
              <p>
                Por esto, las funcionalidades más comunes de Bot de Puré suelen requerir pocos y sencillos pasos.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-x-16 gap-y-4 md:mt-20 md:flex-row-reverse md:justify-between lg:justify-center lg:gap-x-32 xl:gap-x-48">
          <div className="bg-accent text-accent-foreground md:text-primary-foreground/25 flex h-16 w-16 items-center justify-center rounded-full md:h-full md:min-h-full md:w-auto md:flex-col md:bg-inherit">
            <div className="md:hidden">
              <FontAwesomeIcon icon={faHexagonNodes} size="3x" />
            </div>
            <div className="hidden md:block">
              <FontAwesomeIcon icon={faHexagonNodes} size="10x" />
            </div>
          </div>
          <div>
            <h2 className="text-center text-3xl font-extrabold sm:text-4xl md:w-max md:min-w-full md:text-left">
              Complejidad A Voluntad
            </h2>
            <div className="mt-4 flex flex-col gap-y-2 max-w-112">
              <p>
                Si los mecanismos comunes no son suficientes para tus necesidades, te tenemos cubierto.
              </p>
              <p>
                Para usuarios que buscan sacarle el máximo provecho a Bot de Puré.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </Main>
  )
}
