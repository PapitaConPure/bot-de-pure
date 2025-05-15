import Main from '@/components/layout/Main'
import Section from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import {
  faCode,
  faImage,
  faMusic,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Modules() {
  return (
    <Main>
      <Section>
        <h1 className="mb-10 text-center text-3xl font-extrabold sm:text-4xl md:text-5xl md:font-black">
          Módulos
        </h1>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="bg-secondary/25 flex flex-col gap-y-6 rounded-md px-6 pt-4 pb-6 lg:px-8 lg:py-6">
            <h2 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              <span>
                <FontAwesomeIcon
                  icon={faVolumeHigh}
                  className="text-accent mr-3"
                />
              </span>
              <span>PuréVoice</span>
            </h2>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Sistema de despliegue de sesiones de voz autoincrementales.
            </p>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Brinda una avanzada personalización y administración de sesiones.
            </p>
            <Button className="bg-primary">Aprender Más</Button>
          </div>
          <div className="bg-secondary/25 flex flex-col gap-y-6 rounded-md px-6 pt-4 pb-6 lg:px-8 lg:py-6">
            <h2 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              <span>
                <FontAwesomeIcon icon={faMusic} className="text-accent mr-3" />
              </span>
              <span>PuréMusic</span>
            </h2>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Solución de reproducción de música con administración de cola.
            </p>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Ofrece un gran potencial y facilidad de uso con mínimo esfuerzo.
            </p>
            <Button className="bg-primary">Aprender Más</Button>
          </div>
          <div className="bg-secondary/25 flex flex-col gap-y-6 rounded-md px-6 pt-4 pb-6 lg:px-8 lg:py-6">
            <h2 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              <span>
                <FontAwesomeIcon icon={faImage} className="text-accent mr-3" />
              </span>
              <span>PuréFeed</span>
            </h2>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Motor de suministro automatizado de multimedia anime y manga.
            </p>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Flujos de implementación y configuración sencillos e intuitivos.
            </p>
            <Button className="bg-primary">Aprender Más</Button>
          </div>
          <div className="bg-secondary/25 flex flex-col gap-y-6 rounded-md px-6 pt-4 pb-6 lg:px-8 lg:py-6">
            <h2 className="border-b-foreground/8 border-b pb-2 text-center text-lg font-bold md:text-xl">
              <span>
                <FontAwesomeIcon icon={faCode} className="text-accent mr-3" />
              </span>
              <span>PuréScript</span>
            </h2>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Poderosa implementación de comandos personalizados de servidor.
            </p>
            <p className="w-full text-center text-xs sm:text-sm md:text-base">
              Ofrece acciones avanzadas y un flujo de trabajo modular y
              extensible.
            </p>
            <Button className="bg-primary">Aprender Más</Button>
          </div>
        </div>
      </Section>
    </Main>
  )
}
