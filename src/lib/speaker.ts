/**
 * Quién presenta. Un solo sitio para editarlo.
 *
 * La presentación lee de aquí, así que cambiar el nombre, la foto o un enlace
 * no obliga a tocar ninguna lámina.
 */

export interface SpeakerLink {
  label: string;
  /** Lo que se lee en pantalla: el handle, no la URL completa. */
  handle: string;
  href: string;
}

export interface Repo {
  label: string;
  handle: string;
  href: string;
}

export interface Speaker {
  name: string;
  /** Una línea bajo el nombre. */
  role: string;
  /**
   * Ruta de la foto dentro de /public. Si el archivo no existe, la lámina
   * muestra las iniciales en su lugar, así que no rompe nada dejarla puesta.
   */
  photo: string | null;
  links: SpeakerLink[];
  repos: Repo[];
}

export const SPEAKER: Speaker = {
  name: "Eduardo Villegas Bojórquez",
  role: "Desarrollador · Lima, Perú",
  photo: "/eduardo.png",

  links: [
    {
      label: "LinkedIn",
      handle: "eduardo-enrique-villegas-bojorquez",
      href: "https://www.linkedin.com/in/eduardo-enrique-villegas-bojorquez",
    },
    {
      label: "GitHub",
      handle: "EduardoVillegasB02",
      href: "https://github.com/EduardoVillegasB02",
    },
    {
      label: "Instagram",
      handle: "@eduvb2002",
      href: "https://www.instagram.com/eduvb2002/",
    },
    {
      label: "Email",
      handle: "eduvb02@gmail.com",
      href: "mailto:eduvb02@gmail.com",
    },
  ],

  repos: [
    {
      label: "Backend · NestJS",
      handle: "actovyn-backend",
      href: "https://github.com/EduardoVillegasB02/actovyn-backend",
    },
    {
      label: "Frontend · Next.js",
      handle: "actovyn-frontend",
      href: "https://github.com/EduardoVillegasB02/actovyn-frontend",
    },
  ],
};

/** Iniciales, para cuando no hay foto. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
