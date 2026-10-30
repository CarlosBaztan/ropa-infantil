/*
 * Las direcciones limpias del catálogo y el umbral para Google.
 *
 * Lógica pura, probada aparte de las pantallas, porque es la que paga el
 * marketing: el único canal de captación gratuito que va a tener este
 * proyecto es la búsqueda, y las dos reglas de abajo son las que impiden
 * el error que hunde a los marketplaces pequeños —miles de páginas
 * vacías pidiendo ser indexadas—.
 */

import { describe, expect, it } from "vitest";
import {
  UMBRAL_PARA_GOOGLE,
  direccionDeCategoria,
  direccionDeLotesPorTalla,
  direccionDeMarca,
  direccionDeTalla,
  marcaDesdeSlug,
  robotsSegunCuantosHay,
  tallaDesdeLaDireccion,
} from "@/lib/anuncios/direcciones-seo";

describe("el umbral para Google", () => {
  it("son diez anuncios", () => {
    expect(UMBRAL_PARA_GOOGLE).toBe(10);
  });

  it("por debajo de diez, la página existe pero no se ofrece", () => {
    // Existe para quien entre; lo que no hace es pedirle a Google que la
    // guarde. Una página de catálogo con tres anuncios decepciona a quien
    // llega y le dice a Google que este sitio es flojo.
    expect(robotsSegunCuantosHay(0)?.index).toBe(false);
    expect(robotsSegunCuantosHay(3)?.index).toBe(false);
    expect(robotsSegunCuantosHay(9)?.index).toBe(false);
  });

  it("a partir de diez, se ofrece", () => {
    expect(robotsSegunCuantosHay(10)).toBeUndefined();
    expect(robotsSegunCuantosHay(250)).toBeUndefined();
  });
});

describe("tallaDesdeLaDireccion", () => {
  it("acepta un código de la lista tal cual", () => {
    expect(tallaDesdeLaDireccion("3-6-meses")).toEqual({
      codigo: "3-6-meses",
      esAtajo: false,
    });
    expect(tallaDesdeLaDireccion("2-anos")).toEqual({
      codigo: "2-anos",
      esAtajo: false,
    });
  });

  it("resuelve el mes suelto a su rango, que es como se busca", () => {
    // Una madre busca «ropa bebé 3 meses», no «3-6 meses». El código de
    // la base sigue siendo el rango; el atajo vive solo en la dirección.
    expect(tallaDesdeLaDireccion("3-meses")).toEqual({
      codigo: "3-6-meses",
      esAtajo: true,
    });
    expect(tallaDesdeLaDireccion("1-mes")).toEqual({
      codigo: "0-3-meses",
      esAtajo: true,
    });
    expect(tallaDesdeLaDireccion("20-meses")).toEqual({
      codigo: "18-24-meses",
      esAtajo: true,
    });
  });

  it("resuelve también los años sueltos que no son código", () => {
    expect(tallaDesdeLaDireccion("24-meses")).toEqual({
      codigo: "2-anos",
      esAtajo: true,
    });
  });

  it("una talla inventada es null, para que la página sea un 404", () => {
    // Un 404 y no una página vacía: si cualquier texto devolviera una
    // página, habría infinitas direcciones y Google se comería el
    // presupuesto de rastreo en ellas.
    expect(tallaDesdeLaDireccion("talla-inventada")).toBeNull();
    expect(tallaDesdeLaDireccion("")).toBeNull();
    expect(tallaDesdeLaDireccion("999-meses")).toBeNull();
    expect(tallaDesdeLaDireccion("../../etc/passwd")).toBeNull();
  });

  it("no distingue mayúsculas, que la gente copia los enlaces como sea", () => {
    expect(tallaDesdeLaDireccion("3-6-MESES")?.codigo).toBe("3-6-meses");
  });
});

describe("las direcciones", () => {
  it("son rutas limpias, sin interrogación", () => {
    // La regla dura de la sección 7: ruta limpia puede ir a Google; con
    // interrogación, nunca.
    for (const direccion of [
      direccionDeTalla("3-6-meses"),
      direccionDeLotesPorTalla("3-6-meses"),
      direccionDeCategoria("vestidos"),
      direccionDeMarca("Zara"),
    ]) {
      expect(direccion).not.toContain("?");
      expect(direccion).not.toContain("&");
      expect(direccion.startsWith("/")).toBe(true);
    }
  });

  it("llevan a donde dice la especificación", () => {
    expect(direccionDeTalla("3-6-meses")).toBe("/ropa/talla/3-6-meses");
    expect(direccionDeLotesPorTalla("3-6-meses")).toBe("/lotes/talla/3-6-meses");
    expect(direccionDeCategoria("vestidos")).toBe("/ropa/vestidos");
  });

  it("la marca va en minúsculas y sin acentos ni espacios", () => {
    expect(direccionDeMarca("Zara")).toBe("/marca/zara");
    expect(direccionDeMarca("Petit Bateau")).toBe("/marca/petit-bateau");
    expect(direccionDeMarca("Prénatal")).toBe("/marca/prenatal");
  });

  it("y se puede volver del enlace al nombre que se busca", () => {
    expect(marcaDesdeSlug("petit-bateau")).toBe("petit bateau");
    expect(marcaDesdeSlug("zara")).toBe("zara");
  });
});
