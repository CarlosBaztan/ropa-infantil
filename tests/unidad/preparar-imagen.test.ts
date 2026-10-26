import { describe, expect, it } from "vitest";
import { calcularTamano, LADO_MAXIMO } from "@/lib/imagenes/preparar";

describe("calcularTamano", () => {
  it("reduce una foto de móvil al lado máximo", () => {
    // Una foto de 12 megapíxeles pesa varios megas y no aporta nada en
    // una tarjeta de catálogo.
    expect(calcularTamano(4032, 3024)).toEqual({ ancho: 1600, alto: 1200 });
  });

  it("reduce igual si la foto es vertical, que es como se fotografía la ropa", () => {
    expect(calcularTamano(3024, 4032)).toEqual({ ancho: 1200, alto: 1600 });
  });

  it("no agranda una foto pequeña", () => {
    // Estirarla no añade detalle: solo peso y una imagen borrosa.
    expect(calcularTamano(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });

  it("deja igual la que ya está en el límite", () => {
    expect(calcularTamano(1600, 1200)).toEqual({ ancho: 1600, alto: 1200 });
  });

  it("conserva la proporción al redondear", () => {
    const tamano = calcularTamano(3000, 2001);
    expect(tamano).not.toBeNull();
    expect(tamano?.ancho).toBe(LADO_MAXIMO);
    expect(tamano?.alto).toBe(Math.round((2001 * LADO_MAXIMO) / 3000));
  });

  it("nunca devuelve un lado de cero, por estrecha que sea", () => {
    const tamano = calcularTamano(5000, 2);
    expect(tamano?.ancho).toBe(LADO_MAXIMO);
    expect(tamano?.alto).toBeGreaterThanOrEqual(1);
  });

  it("una foto cuadrada sigue cuadrada", () => {
    expect(calcularTamano(2400, 2400)).toEqual({ ancho: 1600, alto: 1600 });
  });

  it("se defiende de dimensiones imposibles", () => {
    expect(calcularTamano(0, 100)).toBeNull();
    expect(calcularTamano(100, 0)).toBeNull();
    expect(calcularTamano(-10, 100)).toBeNull();
    expect(calcularTamano(Number.NaN, 100)).toBeNull();
  });
});
