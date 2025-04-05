import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[calc(100vh-8rem)] p-8 pb-20 gap-16 sm:p-12 md:p-16 lg:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="row-start-2 items-center sm:items-start">
        <div className="flex flex-col-reverse md:flex-row gap-6 sm:gap-10 md:gap-20 lg:gap-28 xl:gap-36 items-center justify-center">
          <div className="flex flex-col gap-2 md:gap-[32px] row-start-2 items-center md:items-start">
            <h1 className="text-2xl sm:text-[27px] md:text-3xl lg:text-4xl xl:text-5xl font-bold -mb-1 sm:mb-0 tracking-[-.01em] text-center sm:text-left">
              Una bot para Discord
            </h1>
            <div className="list-inside text-sm md:text-base lg:text-base text-center sm:text-left">
              <p>Entretenimiento, administración y utilidad.</p>
              <p>Dale a tu servidor el poder que merece.</p>
            </div>

            <div className="flex gap-4 items-center w-3/4 sm:w-5/6 md:w-full mt-6 md:mt-0 flex-col md:flex-row">
              <a
                className="rounded-md border border-solid border-transparent transition-colors flex items-center justify-center bg-discord gap-2 hover:bg-[#383838] dark:hover:bg-discord/80 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 md:px-5 w-full md:w-auto"
                href="https://discord.com/oauth2/authorize?client_id=651250669390528561"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faDiscord}/>
                <span className="hidden lg:inline">Agregar a Servidor</span>
                <span className="inline lg:hidden">Agregar App</span>
              </a>
              <a
                className="rounded-md border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 md:px-5 w-full md:w-[117px] lg:w-auto"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="inline sm:hidden lg:inline">Obtener Ayuda</span>
                <span className="hidden sm:inline lg:hidden">Ayuda</span>
              </a>
            </div>
          </div>

          <img
            src="/boticon.png"
            alt="Logo de Bot de Puré"
            className="h-48 sm:h-64 md:h-56 lg:h-64 rounded-full"
          />
        </div>
      </main>
    </div>
  );
}
