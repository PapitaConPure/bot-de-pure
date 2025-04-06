import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faLegal,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
  return (
    <footer className="pt-3 mb-6 border-t border-t-foreground/6 dark:border-t-foreground/[.08] row-start-3 flex gap-[24px] flex-wrap items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <a
        className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
        href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FontAwesomeIcon icon={faBook} className="fa-fw text-foreground/40" />
        Aprender
      </a>
      <a
        className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
        href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FontAwesomeIcon icon={faLegal} className="fa-fw text-foreground/40" />
        Términos y Condiciones
      </a>
      <a
        className="flex items-center gap-1.5 hover:underline hover:underline-offset-4"
        href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FontAwesomeIcon icon={faLock} className="fa-fw text-foreground/40" />
        Privacidad
      </a>
    </footer>
  );
};

export default Footer;
