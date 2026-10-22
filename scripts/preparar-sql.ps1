# Prepara las migraciones para pegarlas en el editor SQL de Supabase.
#
# Existe por un fallo real: al leer los archivos con Get-Content, PowerShell
# 5.1 los interpreta como texto ANSI y destroza los acentos. "2 años" llegó
# a la base de datos como "2 aÃ±os" y ninguna prueba se enteró, porque
# comparaban códigos y no etiquetas.
#
# Este guion lee en UTF-8 de forma explícita y, antes de copiar nada,
# comprueba que varios acentos sobrevivan. Si no, aborta.
#
#   .\scripts\preparar-sql.ps1              -> todas las migraciones y la semilla
#   .\scripts\preparar-sql.ps1 -Reinicio    -> además, borra antes lo que haya
#
# Después: pegar en el editor SQL del proyecto de PRUEBAS y ejecutar.

param([switch]$Reinicio)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot

$reinicio = @'
begin;

drop trigger if exists al_crear_usuario on auth.users;
drop function if exists crear_perfil_al_registrarse() cascade;
drop function if exists proteger_columnas_de_perfil() cascade;
drop function if exists tiene_correo_verificado() cascade;
drop table if exists aceptaciones cascade;
drop table if exists documentos_legales cascade;
drop table if exists perfiles cascade;
drop table if exists tallas cascade;
drop table if exists provincias cascade;
drop type if exists tipo_vendedor cascade;
drop type if exists grupo_talla cascade;
delete from auth.users where email like '%@ejemplo.test';

'@

function Leer-EnUtf8($ruta) {
    return [System.IO.File]::ReadAllText($ruta, [System.Text.Encoding]::UTF8)
}

$sql = if ($Reinicio) { $reinicio } else { "begin;`r`n`r`n" }

Get-ChildItem "$raiz\supabase\migrations\*.sql" | Sort-Object Name | ForEach-Object {
    $sql += (Leer-EnUtf8 $_.FullName) + "`r`n`r`n"
}
$sql += (Leer-EnUtf8 "$raiz\supabase\seed\tallas.sql") + "`r`ncommit;`r`n"

# Centinelas: si estos acentos no sobreviven, algo ha corrompido el texto.
foreach ($control in @("2 años", "Álava", "Cádiz", "Política de privacidad")) {
    if ($sql -notlike "*$control*") {
        throw "No encuentro '$control' intacto: el texto se ha corrompido."
    }
}
if ($sql -like "*Ã*") {
    throw "El texto lleva acentos rotos (aparece 'Ã'). Abortado."
}

Set-Clipboard -Value $sql
Write-Output "SQL en el portapapeles: $($sql.Length) caracteres, acentos verificados."
Write-Output "Pegalo en el editor SQL del proyecto de PRUEBAS y ejecutalo."
