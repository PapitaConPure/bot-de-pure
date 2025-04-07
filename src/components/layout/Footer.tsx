import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLegal,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="pt-3 mb-6 border-t border-t-foreground/6 dark:border-t-foreground/[.08] row-start-3 flex gap-[24px] flex-wrap items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <a
        className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
        href="https://github.com/PapitaConPure/bot-de-pure"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FontAwesomeIcon icon={faGithub} className="fa-fw text-foreground/40" />
        Código Fuente
      </a>
      <Link
        className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
        href="/terms"
      >
        <FontAwesomeIcon icon={faLegal} className="fa-fw text-foreground/40" />
        Términos y Condiciones
      </Link>
      <Link
        className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
        href="/privacy"
      >
        <FontAwesomeIcon icon={faLock} className="fa-fw text-foreground/40" />
        Privacidad
      </Link>
    </footer>
  );
};

export default Footer;
