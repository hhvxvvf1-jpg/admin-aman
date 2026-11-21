param([switch]$Recover, [switch]$Backup, [switch]$Restore, [switch]$NewBackupKey)
$ErrorActionPreference = 'Stop'
$node = Join-Path $PSScriptRoot 'runtime\node.exe'
$program = Join-Path $PSScriptRoot 'local.cjs'
function Configure-Account($Action) {
    $email = Read-Host 'Adresse e-mail du compte administrateur (aucun e-mail ne sera envoye)'
    $p1 = Read-Host 'Mot de passe (14 caracteres minimum)' -AsSecureString
    $p2 = Read-Host 'Confirmer le mot de passe' -AsSecureString
    $x = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($p1)
    $y = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($p2)
    try {
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($x)
        if ($plain -cne [Runtime.InteropServices.Marshal]::PtrToStringBSTR($y)) { throw 'Les mots de passe ne correspondent pas.' }
        $json = @{email=$email;password=$plain} | ConvertTo-Json -Compress
        $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
        $encoded | & $node $program $Action
        if ($LASTEXITCODE -ne 0) { throw 'Configuration du compte impossible. Consultez le message ci-dessus.' }
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($x)
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($y)
        $plain=$null; $json=$null; $encoded=$null
        $p1.Dispose(); $p2.Dispose()
    }
    Write-Host ''
    Write-Host 'Dans votre application Authenticator, ajoutez un compte avec une cle de configuration.'
    Write-Host 'Utilisez la cle affichee ci-dessus et choisissez un code base sur le temps (TOTP).'
    Write-Host 'Gardez la cle secrete, ne la partagez pas et ne photographiez pas cette fenetre.'
    [void](Read-Host 'Appuyez sur Entree une fois le compte ajoute')
    Clear-Host
}
function Run-Snapshot($Action) {
    Write-Host 'Fermez la fenetre AMAN avant cette operation. Les fichiers restent sur votre ordinateur.'
    $archive = Read-Host 'Chemin complet du fichier de sauvegarde (ex. C:\Sauvegardes\aman.snapshot)'
    $directory = ''
    if ($Action -eq 'restore') {
        $directory = Read-Host 'Chemin complet du nouveau dossier de restauration (ne doit pas exister)'
    }
    $secret = Read-Host 'Cle de sauvegarde (64 caracteres hexadecimaux)' -AsSecureString
    $x = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try {
        $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($x).Trim()
        $json = @{key=$key;archive=$archive.Trim();directory=$directory.Trim()} | ConvertTo-Json -Compress
        $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
        $encoded | & $node $program $Action
        if ($LASTEXITCODE -ne 0) { throw 'Operation impossible. Consultez le message ci-dessus.' }
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($x)
        $secret.Dispose(); $key=$null; $json=$null; $encoded=$null
    }
    if ($Action -eq 'restore') {
        Write-Host 'La base active reste inchangee. Le dossier de restauration doit rester protege.'
    }
    [void](Read-Host 'Appuyez sur Entree pour fermer')
}
try {
    if ($NewBackupKey) {
        Write-Host 'Enregistrez cette cle de sauvegarde dans votre gestionnaire de mots de passe, separement des fichiers de sauvegarde.'
        & $node $program 'keygen'
        if ($LASTEXITCODE -ne 0) { throw 'Impossible de generer la cle.' }
        [void](Read-Host 'Appuyez sur Entree une fois la cle enregistree')
        Clear-Host
        exit 0
    }
    if ($Backup) { Run-Snapshot 'backup'; exit 0 }
    if ($Restore) { Run-Snapshot 'restore'; exit 0 }
    if ($Recover) { Configure-Account 'recover'; exit 0 }
    & $node $program 'check'
    if ($LASTEXITCODE -eq 10) { Configure-Account 'setup' }
    elseif ($LASTEXITCODE -ne 0) { throw 'Impossible de lire la configuration locale.' }
    & $node $program 'start'
    exit $LASTEXITCODE
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
