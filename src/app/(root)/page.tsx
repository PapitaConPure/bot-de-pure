import { faDiscord } from '@fortawesome/free-brands-svg-icons'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex w-full flex-col items-center gap-y-10 scroll-smooth font-[family-name:var(--font-geist-sans)] motion-reduce:scroll-auto">
      <section className="grid max-h-[80vh] min-h-[80vh] grid-rows-[1fr_max-content_1fr] items-center px-8 sm:items-start sm:px-10 md:px-8 lg:px-10 xl:px-12">
        <div className="row-start-2 flex flex-col-reverse items-center justify-center gap-6 sm:gap-10 md:flex-row md:gap-20 lg:gap-20 xl:gap-26">
          <div className="flex flex-col items-center gap-2 md:items-start md:gap-[32px]">
            <h1 className="-mb-1 max-w-74 text-center text-2xl font-extrabold tracking-[-.01em] sm:mb-0 sm:max-w-84 sm:text-[27px] md:max-w-94 md:text-left md:text-3xl lg:max-w-150 lg:text-5xl xl:max-w-188 xl:text-6xl">
              Dale a tu servidor el gusto que se merece
            </h1>
            <p className="text-center text-xs sm:text-left sm:text-sm md:text-base lg:text-lg">
              Utilidad. Administración. Personalización. Entretenimiento.
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
                className="border-foreground/8 bg-foreground/2 hover:bg-foreground/5 flex h-10 w-full items-center justify-center rounded-md border border-solid px-4 text-sm font-medium transition-colors hover:border-transparent sm:h-12 sm:text-base md:w-[117px] md:px-5 lg:w-auto"
                href="/learn"
              >
                <span className="inline sm:hidden lg:inline">
                  Obtener Ayuda
                </span>
                <span className="hidden sm:inline lg:hidden">Ayuda</span>
              </Link>
            </div>
          </div>
          <div className="relative min-w-max">
            <div className="shadow-primary/60 bg-primary/60 absolute inset-0 h-48 scale-120 animate-[pulse_16s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full mix-blend-lighten shadow-[0_0_600px] blur-2xl transition-all sm:h-64 md:h-72 lg:h-88 xl:h-112" />
            <div className="border-primary/30 absolute inset-0 h-48 animate-[ping_3s_cubic-bezier(0,0,0.3,1)_infinite] rounded-full border mix-blend-lighten transition-transform motion-reduce:hidden sm:h-64 md:h-72 lg:h-88 xl:h-112" />
            <img
              src="/boticon.png"
              alt="Logo de Bot de Puré"
              className="relative h-48 rounded-full transition-transform duration-300 ease-in-out hover:scale-105 sm:h-64 md:h-72 lg:h-88 xl:h-112"
            />
          </div>
        </div>
      </section>
      <section className="border-t-foreground/6 flex w-full flex-col gap-y-6 border-t px-8 py-4 sm:px-10 sm:py-6 lg:px-14 lg:py-10 xl:px-16 xl:py-12">
        <div className="flex flex-col flex-nowrap gap-x-6 gap-y-6 md:flex-row md:justify-center">
          <div className="rounded-md bg-secondary/20 flex grow flex-col gap-y-6 px-6 pt-4 pb-6 md:w-1/2 md:grow-0 lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 font-bold border-b pb-2 text-center text-lg md:text-xl">
              Utilidad Ante Todo
            </h1>
            <ul className="mx-auto flex flex-col gap-y-3 text-xs sm:text-left sm:text-sm lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Simplifica tareas por defecto.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-md bg-secondary/20 flex grow flex-col gap-y-6 px-6 pt-4 pb-6 md:w-1/2 md:grow-0 lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 font-bold border-b pb-2 text-center text-lg md:text-xl">
              Administración
            </h1>
            <ul className="mx-auto flex flex-col gap-y-3 text-xs sm:text-left sm:text-sm lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col flex-nowrap gap-x-6 gap-y-6 md:flex-row md:justify-center">
          <div className="rounded-md bg-secondary/20 flex grow flex-col gap-y-6 px-6 pt-4 pb-6 md:w-1/2 md:grow-0 lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 font-bold border-b pb-2 text-center text-lg md:text-xl">
              Entretenimiento
            </h1>
            <ul className="mx-auto flex flex-col gap-y-3 text-xs sm:text-left sm:text-sm lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-md bg-secondary/20 flex grow flex-col gap-y-6 px-6 pt-4 pb-6 md:w-1/2 md:grow-0 lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 font-bold border-b pb-2 text-center text-lg md:text-xl">
              Título de Carta
            </h1>
            <ul className="mx-auto flex flex-col gap-y-3 text-xs sm:text-left sm:text-sm lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col flex-nowrap gap-x-6 gap-y-6 md:flex-row md:place-content-evenly md:content-evenly md:justify-center">
          <div className="rounded-md bg-secondary/20 flex grow flex-col gap-y-6 px-6 pt-4 pb-6 md:w-1/2 md:grow-0 lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 font-bold border-b pb-2 text-center text-lg md:text-xl">
              Título de Carta
            </h1>
            <ul className="mx-auto flex flex-col gap-y-3 text-xs sm:text-left sm:text-sm lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Lorem Ipsum dolor sit amet.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-md bg-secondary/20 flex grow flex-col gap-y-6 px-6 pt-4 pb-6 md:w-1/2 md:grow-0 lg:px-8 lg:py-6">
            <h1 className="border-b-foreground/8 font-bold border-b pb-2 text-center text-lg md:text-xl">
              Título de Carta
            </h1>
            <ul className="mx-auto flex flex-col gap-y-3 text-xs sm:text-left sm:text-sm lg:text-lg">
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Utilidad y herramientas ante todo.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Entretenimiento y administración.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Personalización a nivel de usuario.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Personalización a nivel de servidor.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Configuración poderosa e intuitiva.</span>
              </li>
              <li className="flex flex-row items-center gap-x-4">
                <FontAwesomeIcon icon={faStar} />
                <span>Funcionalidad avanzada si gustas.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
