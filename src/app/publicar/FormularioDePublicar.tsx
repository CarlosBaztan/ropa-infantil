"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { aSlug, direccionDeAnuncio } from "@/lib/anuncios/direccion";
import { aCentimos, formatearPrecio, precioPorPieza } from "@/lib/anuncios/precio";
import type { OpcionConEtiqueta } from "@/lib/anuncios/modelo";
import { tituloSugerido, validarAnuncio } from "@/lib/anuncios/validacion";
import { prepararFoto } from "@/lib/imagenes/preparar";
import { clienteNavegador } from "@/lib/supabase/navegador";

/*
 * Publicar, en tres pasos y una revisión.
 *
 * El principio es «una mano, un pulgar, un minuto»: si publicar cuesta
 * esfuerzo no hay catálogo, y sin catálogo no hay negocio. De ahí la
 * cámara primero, los botones grandes en vez de desplegables, el título
 * que se escribe solo y el borrador que sobrevive a que el bebé llore.
 */

interface Props {
  tallas: OpcionConEtiqueta[];
  categorias: OpcionConEtiqueta[];
  estados: OpcionConEtiqueta[];
  temporadas: OpcionConEtiqueta[];
  generos: OpcionConEtiqueta[];
  ajustes: OpcionConEtiqueta[];
  provincias: OpcionConEtiqueta[];
  provinciaPorDefecto: string;
  ciudadPorDefecto: string;
}

interface FotoLista {
  blob: Blob;
  ancho: number;
  alto: number;
  vistaPrevia: string;
}

const CLAVE_BORRADOR = "borrador-anuncio";

export function FormularioDePublicar(props: Props) {
  const router = useRouter();

  const [paso, setPaso] = useState(1);
  const [fotos, setFotos] = useState<FotoLista[]>([]);
  const [preparando, setPreparando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<"prenda" | "lote">("prenda");
  const [talla, setTalla] = useState("");
  const [tallaHasta, setTallaHasta] = useState("");
  const [numeroPiezas, setNumeroPiezas] = useState(6);
  const [categoria, setCategoria] = useState("");
  const [genero, setGenero] = useState("");
  const [temporada, setTemporada] = useState("");
  const [estado, setEstado] = useState("");
  const [ajuste, setAjuste] = useState("normal");
  const [precio, setPrecio] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tituloTocado, setTituloTocado] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [defectos, setDefectos] = useState("");
  const [entregaMano, setEntregaMano] = useState(true);
  const [envio, setEnvio] = useState(false);
  const [zona, setZona] = useState("");
  const [provincia, setProvincia] = useState(props.provinciaPorDefecto);
  const [ciudad, setCiudad] = useState(props.ciudadPorDefecto);

  const entrada = useMemo(
    () => ({
      tipo,
      titulo,
      talla,
      tallaHasta: tallaHasta === "" ? null : tallaHasta,
      numeroPiezas: tipo === "lote" ? numeroPiezas : null,
      categoria,
      estado,
      precio,
      aceptaEntregaMano: entregaMano,
      aceptaEnvio: envio,
      numeroDeFotos: fotos.length,
    }),
    [
      tipo, titulo, talla, tallaHasta, numeroPiezas, categoria, estado,
      precio, entregaMano, envio, fotos.length,
    ],
  );

  // El título se escribe solo mientras no lo toque la persona: redactar
  // es donde la gente se bloquea y abandona.
  useEffect(() => {
    if (tituloTocado) return;
    const sugerido = tituloSugerido({ ...entrada, titulo: "" });
    if (sugerido) setTitulo(sugerido);
  }, [entrada, tituloTocado]);

  // Borrador automático. Las fotos no caben aquí, pero lo demás sí: si se
  // cierra la pestaña a media publicación, no se pierde lo escrito.
  useEffect(() => {
    try {
      localStorage.setItem(
        CLAVE_BORRADOR,
        JSON.stringify({
          tipo, talla, tallaHasta, numeroPiezas, categoria, genero,
          temporada, estado, ajuste, precio, titulo, descripcion, defectos,
          entregaMano, envio, zona, provincia, ciudad,
        }),
      );
    } catch {
      // Sin almacenamiento local se publica igual; solo se pierde el
      // borrador si se cierra la pestaña.
    }
  }, [
    tipo, talla, tallaHasta, numeroPiezas, categoria, genero, temporada,
    estado, ajuste, precio, titulo, descripcion, defectos, entregaMano,
    envio, zona, provincia, ciudad,
  ]);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_BORRADOR);
      if (!guardado) return;
      const b = JSON.parse(guardado) as Record<string, unknown>;
      if (typeof b.titulo === "string" && b.titulo) {
        setTituloTocado(true);
        setTitulo(b.titulo);
      }
      if (typeof b.tipo === "string") setTipo(b.tipo as "prenda" | "lote");
      if (typeof b.talla === "string") setTalla(b.talla);
      if (typeof b.categoria === "string") setCategoria(b.categoria);
      if (typeof b.estado === "string") setEstado(b.estado);
      if (typeof b.precio === "string") setPrecio(b.precio);
    } catch {
      // Un borrador corrupto no debe impedir publicar: se ignora.
    }
    // Solo al montar: recuperar el borrador una vez, no en cada cambio.
  }, []);

  const centimos = aCentimos(precio);
  const porPieza =
    tipo === "lote" && centimos !== null && numeroPiezas > 0
      ? precioPorPieza(centimos, numeroPiezas)
      : null;

  async function anadirFotos(lista: FileList | null) {
    if (!lista) return;
    setError(null);
    setPreparando(true);
    try {
      const nuevas: FotoLista[] = [];
      for (const archivo of Array.from(lista).slice(0, 5 - fotos.length)) {
        const preparada = await prepararFoto(archivo);
        nuevas.push({
          ...preparada,
          vistaPrevia: URL.createObjectURL(preparada.blob),
        });
      }
      setFotos((previas) => [...previas, ...nuevas]);
    } catch {
      setError("No hemos podido preparar alguna foto. Prueba con otra.");
    } finally {
      setPreparando(false);
    }
  }

  async function publicar() {
    const comprobado = validarAnuncio(entrada);
    if (!comprobado.valido) {
      setError(comprobado.error);
      return;
    }
    setError(null);
    setEnviando(true);

    const supabase = clienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/acceso");
      return;
    }

    // Nace retirado, o sea invisible. Pasa a activo cuando sus fotos
    // están arriba: nadie debe encontrarse un anuncio sin fotos durante
    // los segundos que tarda la subida.
    const { data: creado, error: errorCrear } = await supabase
      .from("anuncios")
      .insert({
        vendedor: user.id,
        tipo,
        titulo: comprobado.valor.titulo,
        slug: aSlug(comprobado.valor.titulo),
        descripcion: descripcion || null,
        defectos: defectos || null,
        talla,
        talla_hasta: tipo === "lote" && tallaHasta ? tallaHasta : null,
        numero_piezas: tipo === "lote" ? numeroPiezas : null,
        categoria,
        genero: genero || null,
        temporada: temporada || null,
        estado,
        ajuste,
        precio_centimos: centimos,
        acepta_entrega_mano: entregaMano,
        acepta_envio: envio,
        zona_encuentro: zona || null,
        provincia: provincia || null,
        ciudad: ciudad || null,
        situacion: "retirada",
      })
      .select("id, id_publico, slug")
      .single();

    if (errorCrear || !creado) {
      setError("No hemos podido publicar. Revisa los datos e inténtalo otra vez.");
      setEnviando(false);
      return;
    }

    try {
      for (const [indice, foto] of fotos.entries()) {
        const orden = indice + 1;
        const ruta = `${creado.id}/${orden}.webp`;

        const { error: errorSubida } = await supabase.storage
          .from("anuncios")
          .upload(ruta, foto.blob, { contentType: "image/webp" });
        if (errorSubida) throw errorSubida;

        const { error: errorFila } = await supabase.from("fotos").insert({
          anuncio: creado.id,
          ruta,
          orden,
          ancho: foto.ancho,
          alto: foto.alto,
        });
        if (errorFila) throw errorFila;
      }

      await supabase
        .from("anuncios")
        .update({ situacion: "activa" })
        .eq("id", creado.id);
    } catch {
      // El anuncio se queda retirado: existe pero no lo ve nadie, y la
      // persona puede recuperarlo desde sus anuncios en vez de perder
      // todo lo que había escrito.
      setError(
        "El anuncio se ha guardado pero alguna foto no ha subido. " +
          "Lo encontrarás en «Mis anuncios» para terminarlo.",
      );
      setEnviando(false);
      return;
    }

    try {
      localStorage.removeItem(CLAVE_BORRADOR);
    } catch {
      /* da igual */
    }

    router.push(direccionDeAnuncio(creado.slug, creado.id_publico));
  }

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Publicar
      </h1>
      <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
        Paso {paso} de 3
      </p>

      {error ? (
        <p role="alert" className="aviso-error" style={{ marginTop: "var(--sp-5)" }}>
          <span>{error}</span>
        </p>
      ) : null}

      {paso === 1 ? (
        <section className="pila" style={{ marginTop: "var(--sp-6)" }}>
          <h2 style={{ fontSize: "var(--fs-xl)" }}>Fotos</h2>
          <p className="ayuda">
            <strong>Fotografía la prenda sola.</strong> No subas fotos en
            las que aparezca una persona, y menos un niño o una niña.
          </p>

          <div className="campo">
            <label htmlFor="fotos">Añadir fotos (hasta 5)</label>
            <input
              id="fotos"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              disabled={preparando || fotos.length >= 5}
              onChange={(e) => void anadirFotos(e.target.files)}
            />
            <span className="ayuda">
              Se reducen de tamaño y se les quitan los datos de
              localización antes de subirlas.
            </span>
          </div>

          {preparando ? <p aria-live="polite">Preparando las fotos…</p> : null}

          {/*
            * Las miniaturas, en columna cada una con su boton debajo. La
            * primera version ponia el boton al lado y cada foto ocupaba
            * una fila entera: con cinco, la pantalla se llenaba de
            * vistas previas y el boton de seguir quedaba a dos pantallas
            * de distancia, en el paso donde mas importa no perder a
            * nadie.
            */}
          <ul className="miniaturas" role="list">
            {fotos.map((foto, i) => (
              <li key={foto.vistaPrevia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.vistaPrevia}
                  alt={`Foto ${i + 1} de ${fotos.length}`}
                  width={96}
                  height={120}
                />
                <button
                  type="button"
                  className="boton boton-secundario"
                  aria-label={`Quitar la foto ${i + 1}`}
                  onClick={() =>
                    setFotos((p) => p.filter((_, j) => j !== i))
                  }
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="boton"
            disabled={fotos.length === 0}
            onClick={() => setPaso(2)}
          >
            Continuar
          </button>
        </section>
      ) : null}

      {paso === 2 ? (
        <section className="pila" style={{ marginTop: "var(--sp-6)" }}>
          <h2 style={{ fontSize: "var(--fs-xl)" }}>Qué es</h2>

          <fieldset className="campo" style={{ border: "none" }}>
            <legend>¿Una prenda o un lote?</legend>
            <label>
              <input
                type="radio"
                name="tipo"
                checked={tipo === "prenda"}
                onChange={() => setTipo("prenda")}
              />
              <span>Una prenda suelta</span>
            </label>
            <label>
              <input
                type="radio"
                name="tipo"
                checked={tipo === "lote"}
                onChange={() => setTipo("lote")}
              />
              <span>Un lote de varias</span>
            </label>
          </fieldset>

          {tipo === "lote" ? (
            <div className="campo">
              <label htmlFor="piezas">¿Cuántas piezas?</label>
              <input
                id="piezas"
                type="number"
                min={2}
                max={200}
                inputMode="numeric"
                value={numeroPiezas}
                onChange={(e) => setNumeroPiezas(Number(e.target.value))}
              />
            </div>
          ) : null}

          <Selector
            id="talla"
            etiqueta={tipo === "lote" ? "Talla (desde)" : "Talla"}
            opciones={props.tallas}
            valor={talla}
            alCambiar={setTalla}
          />

          {tipo === "lote" ? (
            <Selector
              id="talla-hasta"
              etiqueta="Hasta la talla (opcional)"
              opciones={props.tallas}
              valor={tallaHasta}
              alCambiar={setTallaHasta}
            />
          ) : null}

          <Selector
            id="categoria"
            /* No «Qué es»: asi se llamaba, y el paso entero se titula ya
               «Qué es». Dos cosas con el mismo nombre en la misma
               pantalla, una de ellas un desplegable, es justo lo que hace
               dudar y abandonar a mitad. */
            etiqueta="Qué prenda es"
            opciones={props.categorias}
            valor={categoria}
            alCambiar={setCategoria}
          />
          <Selector
            id="genero"
            etiqueta="Para (opcional)"
            opciones={props.generos}
            valor={genero}
            alCambiar={setGenero}
          />
          <Selector
            id="temporada"
            etiqueta="Temporada (opcional)"
            opciones={props.temporadas}
            valor={temporada}
            alCambiar={setTemporada}
          />

          <div style={{ display: "flex", gap: "var(--sp-3)" }}>
            <button type="button" className="boton boton-secundario" onClick={() => setPaso(1)}>
              Atrás
            </button>
            <button type="button" className="boton" onClick={() => setPaso(3)}>
              Continuar
            </button>
          </div>
        </section>
      ) : null}

      {paso === 3 ? (
        <section className="pila" style={{ marginTop: "var(--sp-6)" }}>
          <h2 style={{ fontSize: "var(--fs-xl)" }}>Precio y entrega</h2>

          <div className="campo">
            <label htmlFor="precio">Precio</label>
            <input
              id="precio"
              inputMode="decimal"
              placeholder="12,50"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              aria-describedby="por-pieza"
            />
            <span id="por-pieza" className="ayuda precio" aria-live="polite">
              {porPieza !== null
                ? `Sale a ${formatearPrecio(porPieza)} la pieza`
                : centimos !== null
                  ? formatearPrecio(centimos)
                  : "Escribe el precio"}
            </span>
          </div>

          <Selector
            id="estado"
            etiqueta="En qué estado está"
            opciones={props.estados}
            valor={estado}
            alCambiar={setEstado}
          />
          <Selector
            id="ajuste"
            etiqueta="¿Talla normal?"
            opciones={props.ajustes}
            valor={ajuste}
            alCambiar={setAjuste}
          />

          <div className="campo">
            <label htmlFor="defectos">Defectos (opcional)</label>
            <textarea
              id="defectos"
              rows={2}
              value={defectos}
              onChange={(e) => setDefectos(e.target.value)}
              aria-describedby="ayuda-defectos"
            />
            <span id="ayuda-defectos" className="ayuda">
              Decir que tiene una mancha genera más confianza que
              esconderla, y evita la discusión después.
            </span>
          </div>

          <fieldset className="campo" style={{ border: "none" }}>
            <legend>Cómo se entrega</legend>
            <label>
              <input
                type="checkbox"
                checked={entregaMano}
                onChange={(e) => setEntregaMano(e.target.checked)}
              />
              <span>En mano, sin gastos de envío</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={envio}
                onChange={(e) => setEnvio(e.target.checked)}
              />
              <span>Por envío, que acordáis en el chat</span>
            </label>
          </fieldset>

          {entregaMano ? (
            <div className="campo">
              <label htmlFor="zona">Dónde quedarías (opcional)</label>
              <input
                id="zona"
                maxLength={120}
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                aria-describedby="ayuda-zona"
              />
              <span id="ayuda-zona" className="ayuda">
                Un barrio o un sitio público. Nunca tu dirección.
              </span>
            </div>
          ) : null}

          <Selector
            id="provincia"
            etiqueta="Provincia"
            opciones={props.provincias}
            valor={provincia}
            alCambiar={setProvincia}
          />

          <div className="campo">
            <label htmlFor="ciudad">Ciudad o pueblo (opcional)</label>
            <input
              id="ciudad"
              maxLength={80}
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              aria-describedby="ayuda-ciudad-anuncio"
            />
            <span id="ayuda-ciudad-anuncio" className="ayuda">
              Ayuda a que te encuentren cerca. Viene puesta la de tu
              perfil; cámbiala si este anuncio se entrega en otro sitio.
            </span>
          </div>

          <div className="campo">
            <label htmlFor="titulo">Título</label>
            <input
              id="titulo"
              maxLength={120}
              value={titulo}
              onChange={(e) => {
                setTituloTocado(true);
                setTitulo(e.target.value);
              }}
            />
            <span className="ayuda">Lo escribimos nosotros; cámbialo si quieres.</span>
          </div>

          <div className="campo">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <textarea
              id="descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--sp-3)" }}>
            <button type="button" className="boton boton-secundario" onClick={() => setPaso(2)}>
              Atrás
            </button>
            <button
              type="button"
              className="boton"
              disabled={enviando}
              onClick={() => void publicar()}
            >
              {enviando ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Selector({
  id,
  etiqueta,
  opciones,
  valor,
  alCambiar,
}: {
  id: string;
  etiqueta: string;
  opciones: OpcionConEtiqueta[];
  valor: string;
  alCambiar: (v: string) => void;
}) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} value={valor} onChange={(e) => alCambiar(e.target.value)}>
        <option value="">Elige una opción</option>
        {opciones.map((o) => (
          <option key={o.codigo} value={o.codigo}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
