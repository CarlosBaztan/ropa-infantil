import { entrarConGoogle } from "@/app/acceso/acciones";

/**
 * El botón solo aparece si la variable dice que el proveedor está
 * configurado en Supabase. Sin esa cautela, mientras falte la
 * configuración el botón existiría y daría un error al pulsarlo, que es
 * peor que no ofrecerlo.
 */
export function BotonGoogle({ texto }: { texto: string }) {
  if (process.env.NEXT_PUBLIC_ACCESO_GOOGLE !== "1") return null;

  return (
    <>
      <form action={entrarConGoogle}>
        <button type="submit" className="boton boton-secundario">
          {texto}
        </button>
      </form>

      <p
        aria-hidden="true"
        style={{
          textAlign: "center",
          color: "var(--c-ink-muted)",
          fontSize: "var(--fs-sm)",
        }}
      >
        o
      </p>
    </>
  );
}
