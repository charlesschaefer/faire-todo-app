#!/bin/bash

# --- Configurações Iniciais ---
APP_NAME="fairetodoapp" # Nome do seu aplicativo (minúsculo, sem espaços)
EXECUTABLE_NAME="faire-todo-app" # Nome do executável final (como ele é chamado no sistema)
PPA_IDENTIFIER="faire-todo-app" # O nome do seu PPA no Launchpad, ex: ppa:SEU_USUARIO/meuapp
LAUNCHPAD_USER="charlesschaefer" # Seu nome de usuário do Launchpad
MAINTAINER_NAME="Charles Schaefer" # Seu nome para o Maintainer do pacote
MAINTAINER_EMAIL="charlesschaefer@gmail.com" # Seu e-mail para o Maintainer do pacote (deve corresponder ao do Launchpad)

# Diretório raiz do seu projeto (onde este script está e onde package.json está)
PROJECT_ROOT_DIR="$(pwd)" # Usando pwd, pois o script será executado na raiz do projeto

# Diretório onde os arquivos debian/ estão ou serão criados
DEBIAN_DIR_IN_PROJECT="${PROJECT_ROOT_DIR}/debian"

# Diretório temporário para a construção do pacote
TEMP_BUILD_ROOT_DIR="/tmp/${APP_NAME}_ppa_build_root" # Onde o .orig.tar.gz e o diretório fonte estarão

# Diretório temporário para o .deb baixado e extração
TEMP_DEB_DIR="/tmp/${APP_NAME}_downloaded_deb"

# --- Funções Auxiliares ---

# Função para exibir mensagens de erro e sair
error_exit() {
    echo "Erro: $1" >&2
    exit 1
}

# Função para exibir mensagens de sucesso
success_msg() {
    echo "Sucesso: $1"
}

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# --- 1. Verificações de Pré-requisitos ---
echo "--- Verificando pré-requisitos..."

command_exists curl || error_exit "curl não está instalado. Necessário para baixar o .deb."
command_exists ar || error_exit "ar não está instalado. Necessário para extrair o .deb. Instale com 'sudo apt install binutils'."
command_exists tar || error_exit "tar não está instalado. Necessário para extrair o .deb."
command_exists debuild || error_exit "debuild não está instalado. Instale com 'sudo apt install devscripts'."
command_exists dput || error_exit "dput não está instalado. Instale com 'sudo apt install dput'."
command_exists gpg || error_exit "gpg não está instalado. Necessário para assinar pacotes."

# Instalar dependências de build localmente (apenas as que realmente forem necessárias para o pacote fonte)
echo "--- Instalando/Verificando dependências de build localmente (apenas essenciais para empacotamento)..."
sudo apt update
sudo apt install -y debhelper-compat binutils tar build-essential devscripts dpkg-dev gnupg || error_exit "Falha ao instalar dependências de build. Verifique se os nomes dos pacotes estão corretos."

# Verificar GPG Key (simples, assume que já está configurada com o Launchpad)
if ! gpg --list-secret-keys --keyid-format LONG | grep -q "$MAINTAINER_EMAIL"; then
    echo "Aviso: Nenhuma chave GPG encontrada para '$MAINTAINER_EMAIL'. Certifique-se de que sua chave GPG está configurada e associada ao seu Launchpad."
fi

# --- 2. Obter Última Versão e Baixar .deb do GitHub ---
echo "--- Obtendo a última versão e baixando o .deb pré-compilado do GitHub Releases..."
# Limpa o diretório temporário para o .deb
rm -rf "$TEMP_DEB_DIR"
mkdir -p "$TEMP_DEB_DIR" || error_exit "Não foi possível criar o diretório temporário para o .deb: $TEMP_DEB_DIR"
cd "$TEMP_DEB_DIR" || error_exit "Não foi possível entrar no diretório temporário: $TEMP_DEB_DIR"

# Baixa o HTML da página de latest release para extrair a versão
curl --location -o latest_release_info "https://github.com/charlesschaefer/faire-todo-app/releases/latest" || error_exit "Falha ao baixar informações da última release do GitHub."

# Extrai a versão usando sed
APP_VERSION=$(cat latest_release_info | sed -n -e "/App v/ {s/.*App v\([[:digit:]]\+.[[:digit:]]\+.[[:digit:]]\+\).*/\1/gp;q}") || error_exit "Não foi possível extrair a versão do aplicativo da página de release."

if [ -z "$APP_VERSION" ]; then
    error_exit "Versão do aplicativo não encontrada na página de release do GitHub."
fi

echo "Versão do aplicativo detectada: $APP_VERSION"

DEB_FILENAME="Faire.Todo.App_${APP_VERSION}_amd64.deb"
DOWNLOAD_URL="https://github.com/charlesschaefer/faire-todo-app/releases/download/app-v${APP_VERSION}/${DEB_FILENAME}"

echo "Baixando o .deb: $DOWNLOAD_URL"
curl --location -o "$DEB_FILENAME" "$DOWNLOAD_URL" || error_exit "Falha ao baixar o arquivo .deb do GitHub."

# --- Extrair arquivos do .deb baixado ---
echo "--- Extraindo executável, .desktop e ícones do .deb baixado para uso no empacotamento..."
# Limpa ou cria o diretório src-tauri/target para os arquivos extraídos
EXTRACT_TARGET_DIR="${PROJECT_ROOT_DIR}/src-tauri/target"
mkdir -p "$EXTRACT_TARGET_DIR" || error_exit "Não foi possível criar o diretório de destino para extração: $EXTRACT_TARGET_DIR"

# Extrai o conteúdo do .deb
# Primeiro, extrai data.tar.gz (onde estão os arquivos do sistema de arquivos)
ar x "$DEB_FILENAME" data.tar.gz || error_exit "Falha ao extrair data.tar.xz ou data.tar.gz do .deb." # Tenta xz e depois gz

# Extrai os arquivos para o diretório de destino temporário
tar -xf data.tar.gz -C "$EXTRACT_TARGET_DIR" || error_exit "Falha ao extrair data.tar.xz ou data.tar.gz."

# Move o executável para um subdiretório esperado pelo rules se necessário
# O executável provavelmente estará em ${EXTRACT_TARGET_DIR}/usr/bin/${EXECUTABLE_NAME_LOWERCASE}
# E o .desktop em ${EXTRACT_TARGET_DIR}/usr/share/applications/
# E os ícones em ${EXTRACT_TARGET_DIR}/usr/share/icons/...

# Limpeza dos arquivos temporários do .deb
rm "$DEB_FILENAME" data.tar.gz 2>/dev/null
rm latest_release_info

echo "Arquivos extraídos para: $EXTRACT_TARGET_DIR"
# O nome real do executável no .deb pode ser diferente de $APP_NAME
# O nome do ícone e .desktop também
# Vamos precisar mapear isso no debian/rules. O Tauri geralmente usa o "package.productName"
# ou "package.name" para o executável e .desktop.
# Vamos assumir que o executável dentro do .deb é ${EXECUTABLE_NAME_LOWERCASE}
EXECUTABLE_NAME_LOWERCASE=$(echo "$EXECUTABLE_NAME" | tr '[:upper:]' '[:lower:]')

mv ${EXTRACT_TARGET_DIR}/usr/share/applications/*.desktop ${EXTRACT_TARGET_DIR}/usr/share/applications/${EXECUTABLE_NAME_LOWERCASE}.desktop

# Define o caminho completo para o executável extraído
EXTRACTED_EXECUTABLE_PATH="${EXTRACT_TARGET_DIR}/usr/bin/${EXECUTABLE_NAME_LOWERCASE}"
# Define o caminho completo para o .desktop extraído
EXTRACTED_DESKTOP_PATH="${EXTRACT_TARGET_DIR}/usr/share/applications/${EXECUTABLE_NAME_LOWERCASE}.desktop"
# Define o caminho completo para os ícones extraídos (assumindo que o nome do ícone é o executável lowercase)
EXTRACTED_SVG_ICON_PATH="${EXTRACT_TARGET_DIR}/usr/share/icons/hicolor/scalable/apps/${EXECUTABLE_NAME_LOWERCASE}.svg"
EXTRACTED_PNG_ICON_PATH="${EXTRACT_TARGET_DIR}/usr/share/icons/hicolor/256x256/apps/${EXECUTABLE_NAME_LOWERCASE}.png"

# Voltar para o diretório raiz do projeto
cd "$PROJECT_ROOT_DIR" || error_exit "Não foi possível retornar ao diretório do projeto: $PROJECT_ROOT_DIR"


# Nome completo do diretório fonte para o empacotamento Debian
DEB_SOURCE_DIR="${APP_NAME}-${APP_VERSION}"
DEB_CHANGES_FILE_BASENAME="${APP_NAME}_${APP_VERSION}" # Parte base do nome do arquivo .changes

# --- 3. Criar ou Atualizar o Diretório `debian/` no Projeto ---
echo "--- Verificando e preparando o diretório debian/ em seu projeto..."
if [ ! -d "$DEBIAN_DIR_IN_PROJECT" ]; then
    echo "Diretório '$DEBIAN_DIR_IN_PROJECT' não encontrado. Criando e populando arquivos essenciais..."
    mkdir -p "$DEBIAN_DIR_IN_PROJECT/source" || error_exit "Não foi possível criar o diretório debian/: $DEBIAN_DIR_IN_PROJECT"

    # Criar debian/source/format
    # REMOVENDO build-depends de rustc e cargo, já que não vamos compilar
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/source/format"
3.0 (native)
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/source/format"

    # Criar debian/control
    # REMOVENDO build-depends de rustc e cargo, já que não vamos compilar
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/control"
Source: ${APP_NAME}
Section: utils
Priority: optional
Maintainer: ${MAINTAINER_NAME} <${MAINTAINER_EMAIL}>
Build-Depends: debhelper-compat (= 13),
               binutils,
               tar,
               libwebkit2gtk-4.1-dev,
               libgtk-3-dev,
               libsoup-3.0-dev,
               libappindicator3-dev,
               pkg-config
Standards-Version: 4.6.0
Homepage: https://launchpad.net/${APP_NAME}
Vcs-Browser: https://git.launchpad.net/~${LAUNCHPAD_USER}/+git/${APP_NAME}
Vcs-Git: https://git.launchpad.net/~${LAUNCHPAD_USER}/+git/${APP_NAME}

Package: ${APP_NAME}
Architecture: amd64
Depends: \${shlibs:Depends}, \${misc:Depends},
         libwebkit2gtk-4.1-0,
         libgtk-3-0,
         libappindicator3-1
Description: Um aplicativo de lista de tarefas simples e eficiente (Tauri).
 Este pacote fornece o aplicativo FaireToDo pré-compilado, construído com Tauri,
 projetado para ajudar você a organizar suas tarefas diárias com uma interface moderna.
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/control"

    # Criar debian/copyright
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/copyright"
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: FaireToDo App
Upstream-Contact: ${MAINTAINER_NAME} <${MAINTAINER_EMAIL}>
Source: https://launchpad.net/${APP_NAME}

Files: *
Copyright: $(date +%Y) ${MAINTAINER_NAME}
License: MIT
 Permissão é concedida, gratuitamente, a qualquer pessoa que obtenha uma cópia
 deste software e arquivos de documentação associados (o "Software"), para
 negociar no Software sem restrição, incluindo, sem limitação, os direitos de
 usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender
 cópias do Software, e para permitir que pessoas a quem o Software é fornecido
 o façam, sujeito às seguintes condições:

 A notificação de direitos autorais acima e esta notificação de permissão
 deverão ser incluídas em todas as cópias ou partes substanciais do Software.

 O SOFTWARE É FORNECIDO "AS IS", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU
 IMPLÍCITA, INCLUINDO, MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO,
 ADEQUAÇÃO A UMA FINALIDADE ESPECÍFICA E NÃO INFRAÇÃO. EM NENHUM CASO OS AUTORES
 OU DETENTORES DOS DIREITOS AUTORAIS SERÃO RESPONSÁVEIS POR QUALQUER REIVINDICAÇÃO,
 DANOS OU OUTRA RESPONSABILIDADE, SEJA EM UMA AÇÃO DE CONTRATO, DANO OU DE OUTRA
 FORMA, DECORRENTE DE, FORA DE OU EM CONEXÃO COM O SOFTWARE OU O USO OU OUTRAS
 NEGOCIAÇÕES NO SOFTWARE.
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/copyright"

    # Criar debian/fairetodoapp.install
    # Aqui ficam os arquivos que precisam ser instalados no .deb
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/${APP_NAME}.install"
src-tauri/target/usr/bin/faire-todo-app usr/bin
src-tauri/target/usr/share/icons/hicolor/256x256@2/apps/faire-todo-app.png usr/share/icons/hicolor/256x256@2/apps
src-tauri/target/usr/share/icons/hicolor/128x128/apps/faire-todo-app.png usr/share/icons/hicolor/128x128/apps
src-tauri/target/usr/share/icons/hicolor/32x32/apps/faire-todo-app.png usr/share/icons/hicolor/32x32/apps
src-tauri/target/usr/share/applications/faire-todo-app.desktop usr/share/applications
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/${APP_NAME}.install"

    # Criar debian/rules
    # MUDANDO as regras de build/clean/install para usar o binário pré-compilado
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/rules"
#!/usr/bin/make -f
# Uncomment this to turn on verbose mode.
# export DH_VERBOSE = 1

# O buildsystem agora é 'none' ou apenas 'simple', pois não estamos compilando Rust.
# Não precisamos de 'dh-cargo' ou '--with rust'.
%:
	dh \$@ --buildsystem=none --skip-missing-doc --skip-systemd-service
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/rules"

    # Criar debian/fairetodoapp.desktop (Este será o modelo para o .desktop que o script vai extrair,
    # ou podemos usar o extraído diretamente se for garantido que está correto.
    # Para consistência e para garantir que o nome do Exec e Icon no .desktop gerado
    # corresponda ao que queremos no pacote Debian, é melhor ter um modelo aqui e copiar o conteúdo extraído)
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/${APP_NAME}.desktop"
[Desktop Entry]
Version=1.0
Name=FaireToDo App
Comment=Um aplicativo de lista de tarefas com Tauri
Exec=${EXECUTABLE_NAME}
Icon=${EXECUTABLE_NAME}
Terminal=false
Type=Application
Categories=Utility;Productivity;
StartupNotify=true
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/${APP_NAME}.desktop"

    # Estas configurações e arquivos não são mais necessários se estamos pegando um binário pré-compilado
    # rm "${DEBIAN_DIR_IN_PROJECT}/cargo.config" 2>/dev/null
    # rm -Rf "${DEBIAN_DIR_IN_PROJECT}/source" 2>/dev/null
    # rm "${DEBIAN_DIR_IN_PROJECT}/source/format" 2>/dev/null
    # rm "${DEBIAN_DIR_IN_PROJECT}/source/include-binaries" 2>/dev/null


    # Criar debian/changelog (apenas a primeira entrada)
    # Voltar para o diretório raiz do projeto para o dch
    CURRENT_DIR=$(pwd)
    cd "$PROJECT_ROOT_DIR"
    echo "Rodando o dch para gerar o changes: "
    echo "dch --create -v \"${APP_VERSION}-1\" --package \"${APP_NAME}\" \"Initial release.\" --distribution \"noble\""
    dch --create -v "${APP_VERSION}-1" --package "${APP_NAME}" "Initial release." --distribution "noble"
    cd "$CURRENT_DIR" # Voltar para o diretório de construção temporário
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/changelog com a versão ${APP_VERSION}-1."

    echo "Os arquivos essenciais para empacotamento Debian foram criados em ${DEBIAN_DIR_IN_PROJECT}/."
    echo "REVISE CUIDADOSAMENTE CADA UM DESTES ARQUIVOS, ESPECIALMENTE 'debian/rules' e 'debian/control', PARA GARANTIR QUE ESTÃO CORRETOS PARA SEU PROJETO TAURI."
    echo "Você pode precisar ajustar caminhos de ícones e dependências."
    echo "Pressione Enter para continuar após a revisão (ou Ctrl+C para abortar e ajustar)."
    read -r
fi

# REMOVENDO etapas de cargo vendor e npm install, pois agora baixamos o binário
# --- 3.1 Gerar o diretório de vendors do cargo, empacotar dentro de debian e deopis remover novamente
# cd "$PROJECT_ROOT_DIR/src-tauri"
# rm Cargo.lock
# cargo vendor || error_exit "Não foi possível gerar o diretório de libs vendors do cargo"
# tar -czf "${DEBIAN_DIR_IN_PROJECT}/vendor.tar.gz" vendor || error_exit "Não foi possível empacotar o diretório de vendors"
# rm -Rf vendor/

# --- 3.2 Gerar o diretório node_modules atualizado, empacotar dentro de debian e depois remover novamente
# cd "$PROJECT_ROOT_DIR"
# npm clean-install
# npm install @tauri-apps/cli @tauri-apps/api rollup ts-node @angular/cli tsx
# tar -czf "${DEBIAN_DIR_IN_IN_PROJECT}/node_modules.tar.gz" node_modules || error_exit "Não foi possível empacotar o diretório node_modules"
# rm -Rf node_modules

# --- 4. Limpar e Preparar Diretório de Construção Temporário ---
echo "--- Limpando e preparando diretório de construção temporário ($TEMP_BUILD_ROOT_DIR)..."
rm -rf "$TEMP_BUILD_ROOT_DIR"
mkdir -p "$TEMP_BUILD_ROOT_DIR" || error_exit "Não foi possível criar o diretório temporário: $TEMP_BUILD_ROOT_DIR"

# --- 5. Criar o tarball .orig.tar.gz ---
echo "--- Criando o tarball .orig.tar.gz..."
# Vá para o diretório raiz do projeto original para criar o tarball
cd "$PROJECT_ROOT_DIR" || error_exit "Não foi possível retornar ao diretório do projeto: $PROJECT_ROOT_DIR"

# Crie o tarball incluindo apenas os arquivos de código-fonte
# Exclua o diretório src-tauri/target para não incluir o binário baixado no .orig.tar.gz
tar -czf "$TEMP_BUILD_ROOT_DIR/${APP_NAME}_${APP_VERSION}.orig.tar.gz" \
    --exclude='node_modules' \
    --exclude='src-tauri/target' \
    --exclude='src-tauri/gen/android/app/build' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='debian' \
    --exclude='npm-debug.log' \
    --exclude='.vscode' \
    --exclude='*.deb' \
    --exclude="${APP_NAME}_ppa_build_root" \
    --exclude="${TEMP_DEB_DIR}" \
    --transform="s|^./|${APP_NAME}-${APP_VERSION}/|" . \
    || error_exit "Falha ao criar o tarball .orig.tar.gz."

success_msg "Criado ${APP_NAME}_${APP_VERSION}.orig.tar.gz em $TEMP_BUILD_ROOT_DIR"

# --- 6. Copiar o Código-Fonte e o Diretório debian/ para o Diretório de Construção Temporário ---
echo "--- Copiando o código-fonte e o diretório debian/ para o diretório de construção temporário..."
# Copie o código-fonte (sem os diretórios excluídos)
rsync -a \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'target' \
    --exclude 'dist' \
    --exclude '*.deb' \
    --exclude 'npm-debug.log' \
    --exclude '.vscode' \
    "${PROJECT_ROOT_DIR}/" "$TEMP_BUILD_ROOT_DIR/${DEB_SOURCE_DIR}/" || error_exit "Erro ao copiar o código-fonte para o diretório temporário."

# Copiar o diretório debian/ para o diretório fonte dentro do TEMP_BUILD_ROOT_DIR
cp -r "${DEBIAN_DIR_IN_PROJECT}/" "$TEMP_BUILD_ROOT_DIR/${DEB_SOURCE_DIR}/" || error_exit "Erro ao copiar o diretório debian/ para o diretório de construção."

# Adicionar os arquivos extraídos do .deb para o diretório de construção para que o rules possa acessá-los
# O rules espera encontrá-los dentro de src-tauri/target, que já foi definido como EXTRACT_TARGET_DIR
cp -r "${EXTRACT_TARGET_DIR}/" "$TEMP_BUILD_ROOT_DIR/${DEB_SOURCE_DIR}/src-tauri/target/" || error_exit "Erro ao copiar arquivos extraídos para o diretório de construção."


# Entrar no diretório de construção Debian (onde `debian/` está dentro)
cd "$TEMP_BUILD_ROOT_DIR/$DEB_SOURCE_DIR/" || error_exit "Não foi possível entrar no diretório de construção: $TEMP_BUILD_ROOT_DIR/$DEB_SOURCE_DIR/"

# --- 7. Atualizar o Changelog (para uploads subsequentes) ---
echo "--- Verificando e atualizando debian/changelog para o upload atual..."
# Obtém a última versão do changelog
LAST_CHANGELOG_VERSION=$(dpkg-parsechangelog -ldebian/changelog -SVersion | cut -d'-' -f1)
LAST_CHANGELOG_REV=$(dpkg-parsechangelog -ldebian/changelog -SVersion | cut -d'-' -f2)

# Determinar a nova versão do pacote Debian
NEW_DEB_VERSION_FULL="${APP_VERSION}"
echo "Versões: "
echo "LAST_CHANGELOG_VERSION: $LAST_CHANGELOG_VERSION"
echo "APP_VERSION: $APP_VERSION"

# Com a nova estratégia, sempre usaremos a versão do binário baixado.
# Se a versão do APP_VERSION (baixada) for diferente da última no changelog, reiniciamos a revisão para -1.
# Se for a mesma, incrementamos a revisão Debian.
if [ "$LAST_CHANGELOG_VERSION" != "$APP_VERSION" ]; then
    # Nova versão do upstream, reinicia revisão Debian
    dch -v "${APP_VERSION}-1" "New upstream release of ${APP_NAME} (pre-built binary)." --distribution "noble"
    DEB_CHANGES_FILE="${DEB_CHANGES_FILE_BASENAME}-1_source.changes"
    # Para a primeira vez com uma nova versão upstream, sempre incluímos o .orig.tar.gz
    DEBUILD_FLAGS="-S -sa"
    wget -O "$TEMP_BUILD_ROOT_DIR/${APP_NAME}_${APP_VERSION}.orig.tar.gz" "https://launchpad.net/~charlesschaefer/+archive/ubuntu/${PPA_IDENTIFIER}/+sourcefiles/${APP_NAME}/${APP_VERSION}-2/${APP_NAME}_${APP_VERSION}.orig.tar.gz"
else
    # Mesma versão do upstream, incrementa revisão Debian
    NEW_DEB_REVISION=$((LAST_CHANGELOG_REV + 1))
    dch -v "${APP_VERSION}-${NEW_DEB_REVISION}" "Rebuild for new PPA upload (pre-built binary)." --distribution "noble"
    DEB_CHANGES_FILE="${DEB_CHANGES_FILE_BASENAME}-${NEW_DEB_REVISION}_source.changes"
    # Para revisões da mesma versão upstream, não precisamos incluir o .orig.tar.gz
    DEBUILD_FLAGS="-S -sd"
fi

# Apenas para garantir que o control está com as informações mais recentes (pode ser redundante após a primeira criação, mas é seguro)
sed -i "s/^Maintainer: .*$/Maintainer: ${MAINTAINER_NAME} <${MAINTAINER_EMAIL}>/" debian/control
sed -i "s/^Homepage: .*$/Homepage: https:\/\/launchpad.net\/${APP_NAME}/" debian/control
sed -i "s/^Vcs-Browser: .*$/Vcs-Browser: https:\/\/git.launchpad.net\/~${LAUNCHPAD_USER}\/+git\/${APP_NAME}/" debian/control
sed -i "s/^Vcs-Git: .*$/Vcs-Git: https:\/\/git.launchpad.net\/~${LAUNCHPAD_USER}\/+git\/${APP_NAME}/" debian/control

# --- 8. Construir o Pacote Fonte Debian ---
echo "--- Construindo o pacote fonte Debian no $(pwd)/..."
# Usar as flags definidas dinamicamente (-sa ou -sd)
debuild $DEBUILD_FLAGS || error_exit "Erro ao construir o pacote fonte Debian. Verifique os logs acima."

# --- 9. Enviar para o PPA ---
echo "--- Pacote fonte construído com sucesso. Enviando para o PPA ${PPA_IDENTIFIER}..."
# cd para o diretório pai onde os arquivos .changes foram gerados
cd "$TEMP_BUILD_ROOT_DIR"
if [ ! -f "$DEB_CHANGES_FILE" ]; then
    error_exit "Arquivo .changes não encontrado: $DEB_CHANGES_FILE. Algo deu errado na construção."
fi

echo "--- Assinando o pacote fonte construído..."
debsign "$DEB_CHANGES_FILE" -m "$MAINTAINER_NAME" -e "$MAINTAINER_EMAIL" || error_exit "Falha ao assinar o pacote. Verifique sua chave GPG."

# dput envia o pacote. Você precisará digitar sua senha GPG.
dput "ppa:${LAUNCHPAD_USER}/${PPA_IDENTIFIER}" "$DEB_CHANGES_FILE" || error_exit "Erro ao enviar o pacote para o PPA. Verifique suas credenciais e o status do Launchpad."

# Copia o changelog de volta para o diretório original do projeto para manter o histórico
cp "$TEMP_BUILD_ROOT_DIR/$DEB_SOURCE_DIR/debian/changelog" "$PROJECT_ROOT_DIR/debian/" || error_exit "Falha ao copiar o changelog de volta para o projeto."

success_msg "Processo concluído!"
echo "Verifique o status da build em https://launchpad.net/~${LAUNCHPAD_USER}/+archive/ubuntu/${PPA_IDENTIFIER}"
echo "O arquivo .changes enviado foi: $DEB_CHANGES_FILE"