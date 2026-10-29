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
#   .\scripts\preparar-sql.ps1 -Solo 0011   -> solo esa migración
#   .\scripts\preparar-sql.ps1 -Desde 0008  -> esa y todas las siguientes
#
# -Solo es lo normal cuando la base ya está montada: aplicar la migración
# nueva y nada más. -Desde sirve para poner al día una base que se quedó
# atrás, que es el caso de producción. Rehacerlo todo solo tiene sentido
# en una base vacía.
#
# Después: pegar en el editor SQL del proyecto que toque y ejecutar.
# Comprueba el nombre del proyecto arriba del panel antes de darle a Run.

param([switch]$Reinicio, [string]$Solo, [string]$Desde)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot

# Ojo: no llamar a esta variable $reinicio. PowerShell no distingue
# mayusculas en los nombres, asi que machacaria el parametro -Reinicio.
$sqlDeReinicio = @'
begin;

drop trigger if exists al_crear_usuario on auth.users;
drop function if exists crear_perfil_al_registrarse() cascade;
drop function if exists proteger_columnas_de_perfil() cascade;
drop function if exists tiene_correo_verificado() cascade;
drop function if exists puede_publicar() cascade;
drop function if exists comprobar_mayoria_de_edad(date) cascade;
drop function if exists comprobar_edad_al_editar() cascade;
drop function if exists sellar_fecha_de_aceptacion() cascade;
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

$sql = if ($Reinicio) { $sqlDeReinicio } else { "begin;`r`n`r`n" }

if ($Solo) {
    $elegidas = @(Get-ChildItem "$raiz\supabase\migrations\*$Solo*.sql")
    if ($elegidas.Count -eq 0) {
        throw "No hay ninguna migracion que case con '$Solo'."
    }
    if ($elegidas.Count -gt 1) {
        throw "'$Solo' casa con varias: $($elegidas.Name -join ', '). Concreta mas."
    }
    $sql += (Leer-EnUtf8 $elegidas[0].FullName) + "`r`ncommit;`r`n"
    Write-Output "Solo: $($elegidas[0].Name)"
} elseif ($Desde) {
    $todas = @(Get-ChildItem "$raiz\supabase\migrations\*.sql" | Sort-Object Name)
    $primera = [array]::FindIndex($todas, [Predicate[object]]{ param($f) $f.Name -like "*$Desde*" })
    if ($primera -lt 0) {
        throw "No hay ninguna migracion que case con '$Desde'."
    }
    $elegidas = $todas[$primera..($todas.Count - 1)]
    foreach ($archivo in $elegidas) {
        $sql += (Leer-EnUtf8 $archivo.FullName) + "`r`n`r`n"
    }
    $sql += "commit;`r`n"
    Write-Output "Desde la $Desde : $($elegidas.Name -join ', ')"
} else {
    Get-ChildItem "$raiz\supabase\migrations\*.sql" | Sort-Object Name | ForEach-Object {
        $sql += (Leer-EnUtf8 $_.FullName) + "`r`n`r`n"
    }
    $sql += (Leer-EnUtf8 "$raiz\supabase\seed\tallas.sql") + "`r`ncommit;`r`n"
}

# Centinelas: si estos acentos no sobreviven, algo ha corrompido el texto.
#
# Se construyen por codigo de caracter y no escribiendolos tal cual, porque
# PowerShell 5.1 lee tambien este guion como ANSI y los acentos literales
# llegarian rotos aqui dentro: el vigilante caeria en la misma trampa que
# vigila. Paso por eso una vez.
$enie = [char]0xF1   # n con virgulilla
$aAcc = [char]0xE1   # a con tilde
$AAcc = [char]0xC1   # A con tilde
$iAcc = [char]0xED   # i con tilde
$aTil = [char]0xC3   # el sintoma tipico de un UTF-8 leido como ANSI

$centinelas = @(
    "2 a${enie}os",
    "${AAcc}lava",
    "C${aAcc}diz",
    "Pol${iAcc}tica de privacidad"
)

# Las frases concretas solo estan cuando va todo junto. Con -Solo o -Desde
# queda el vigilante de abajo, que busca el sintoma de la corrupcion y no
# una frase en particular.
if (-not $Solo -and -not $Desde) {
    foreach ($control in $centinelas) {
        if ($sql -notlike "*$control*") {
            throw "No encuentro '$control' intacto: el texto se ha corrompido."
        }
    }
}
if ($sql -like "*$aTil*") {
    throw "El texto lleva acentos rotos. Abortado."
}

# Fuera la marca de orden de bytes, si se ha colado al leer algún archivo.
# PostgreSQL no la entiende y responde "syntax error at or near begin",
# señalando a una palabra que parece correcta: se pierde un buen rato
# buscando un error que no está donde parece.
$sql = $sql.TrimStart([char]0xFEFF)
if ($sql[0] -ne 'b') {
    throw "El SQL no empieza por 'begin': lleva algo delante."
}

$copiado = $false
foreach ($intento in 1..8) {
    try { Set-Clipboard -Value $sql -ErrorAction Stop; $copiado = $true; break }
    catch { Start-Sleep -Milliseconds 500 }   # el portapapeles lo ocupa otro
}
if (-not $copiado) { throw "No se ha podido acceder al portapapeles." }

if ((Get-Clipboard -Raw)[0] -ne 'b') {
    throw "Lo que hay en el portapapeles no empieza por 'begin'."
}

Write-Output "SQL en el portapapeles: $($sql.Length) caracteres, acentos y comienzo verificados."
Write-Output "Pegalo en el editor SQL del proyecto de PRUEBAS y ejecutalo."
