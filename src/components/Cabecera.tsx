import Link from "next/link";

/*
 * La barra de arriba. Hasta ahora no había ninguna y a «Publicar» o a
 * «Tus anuncios» solo se llegaba escribiendo la dirección a mano.
 *
 * No mira si hay sesión a propósito. Leer la cookie aquí obligaría a
 * calcular en cada visita TODAS las páginas, incluidas la portada, las
 * legales y —cuando llegue— el catálogo, que son justo las que interesa
 * servir ya hechas y rápidas. Los dos enlaces funcionan con sesión y sin
 * ella: quien no la tenga acaba en la pantalla de entrar, que es donde
 * tiene que acabar.
 */
export function Cabecera() {
  return (
    <header className="cabecera">
      <Link href="/" className="marca">
        Ropa entre familias
      </Link>
      <nav aria-label="Principal" className="menu">
        <Link href="/publicar">Publicar</Link>
        <Link href="/perfil">Tu cuenta</Link>
      </nav>
    </header>
  );
}
