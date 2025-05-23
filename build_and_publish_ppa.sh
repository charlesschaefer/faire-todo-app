#!/bin/bash

# --- Configurações Iniciais ---
APP_NAME="fairetodoapp" # Nome do seu aplicativo (minúsculo, sem espaços)
EXECUTABLE_NAME="faire-todo-app"
PPA_IDENTIFIER="faire-todo-app" # O nome do seu PPA no Launchpad, ex: ppa:SEU_USUARIO/meuapp
LAUNCHPAD_USER="charlesschaefer" # Seu nome de usuário do Launchpad
MAINTAINER_NAME="Charles Schaefer" # Seu nome para o Maintainer do pacote
MAINTAINER_EMAIL="charlesschaefer@gmail.com" # Seu e-mail para o Maintainer do pacote (deve corresponder ao do Launchpad)

# Diretório raiz do seu projeto (onde este script está e onde package.json está)
#PROJECT_ROOT_DIR="$(dirname "$0")"
PROJECT_ROOT_DIR="$(pwd)"

# Diretório onde os arquivos debian/ estão ou serão criados
DEBIAN_DIR_IN_PROJECT="${PROJECT_ROOT_DIR}/debian"

# Diretório temporário para a construção do pacote
TEMP_BUILD_ROOT_DIR="/tmp/${APP_NAME}_ppa_build_root" # Onde o .orig.tar.gz e o diretório fonte estarão

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

command_exists git || error_exit "git não está instalado."
command_exists node || error_exit "Node.js não está instalado. Necessário para ler package.json."
command_exists npm || error_exit "npm não está instalado. Necessário para instalar dependências do frontend."
command_exists rustc || error_exit "rustc (Rust compiler) não está instalado. Necessário para Tauri."
command_exists cargo || error_exit "cargo (Rust package manager) não está instalado. Necessário para Tauri."
command_exists debuild || error_exit "debuild não está instalado. Instale com 'sudo apt install devscripts'."
command_exists dput || error_exit "dput não está instalado. Instale com 'sudo apt install dput'."
command_exists gpg || error_exit "gpg não está instalado. Necessário para assinar pacotes."

# Instalar dependências de build localmente (para que dpkg-checkbuilddeps não falhe)
echo "--- Instalando/Verificando dependências de build localmente..."
sudo apt update
sudo apt install -y nodejs npm rustc cargo libwebkit2gtk-4.1-dev libgtk-3-dev pkg-config libssl-dev build-essential devscripts dpkg-dev gnupg || error_exit "Falha ao instalar dependências de build. Verifique se os nomes dos pacotes estão corretos."

# Verificar GPG Key (simples, assume que já está configurada com o Launchpad)
if ! gpg --list-secret-keys --keyid-format LONG | grep -q "$MAINTAINER_EMAIL"; then
    echo "Aviso: Nenhuma chave GPG encontrada para '$MAINTAINER_EMAIL'. Certifique-se de que sua chave GPG está configurada e associada ao seu Launchpad."
fi

# --- 2. Obter Versão do Aplicativo ---
echo "--- Obtendo versão do aplicativo do package.json..."
cd "$PROJECT_ROOT_DIR" || error_exit "Não foi possível entrar no diretório do projeto: $PROJECT_ROOT_DIR"
APP_VERSION=$(node -p "require('./package.json').version") || error_exit "Não foi possível ler a versão do package.json."
echo "Versão do aplicativo: $APP_VERSION"

# Nome completo do diretório fonte para o empacotamento Debian
DEB_SOURCE_DIR="${APP_NAME}-${APP_VERSION}"
DEB_CHANGES_FILE_BASENAME="${APP_NAME}_${APP_VERSION}" # Parte base do nome do arquivo .changes

# --- 3. Criar ou Atualizar o Diretório `debian/` no Projeto ---
echo "--- Verificando e preparando o diretório debian/ em seu projeto..."
if [ ! -d "$DEBIAN_DIR_IN_PROJECT" ]; then
    echo "Diretório '$DEBIAN_DIR_IN_PROJECT' não encontrado. Criando e populando arquivos essenciais..."
    mkdir -p "$DEBIAN_DIR_IN_PROJECT" || error_exit "Não foi possível criar o diretório debian/: $DEBIAN_DIR_IN_PROJECT"

    # Criar debian/control
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/control"
Source: ${APP_NAME}
Section: utils
Priority: optional
Maintainer: ${MAINTAINER_NAME} <${MATAINER_EMAIL}>
Build-Depends: debhelper-compat (= 13),
               nodejs,
               npm,
               rustc,
               cargo,
               libwebkit2gtk-4.1-dev,
               libgtk-3-dev,
               libappindicator3-dev,
               pkg-config,
               libssl-dev
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
 Este é o aplicativo FaireToDo, construído com Tauri, projetado para ajudar
 você a organizar suas tarefas diárias com uma interface moderna.
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

 O SOFTWARE É FORNECIDO "COMO ESTÁ", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU
 IMPLÍCITA, INCLUINDO, MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO,
 ADEQUAÇÃO A UMA FINALIDADE ESPECÍFICA E NÃO INFRAÇÃO. EM NENHUM CASO OS AUTORES
 OU DETENTORES DOS DIREITOS AUTORAIS SERÃO RESPONSÁVEIS POR QUALQUER REIVINDICAÇÃO,
 DANOS OU OUTRA RESPONSABILIDADE, SEJA EM UMA AÇÃO DE CONTRATO, DANO OU DE OUTRA
 FORMA, DECORRENTE DE, FORA DE OU EM CONEXÃO COM O SOFTWARE OU O USO OU OUTRAS
 NEGOCIAÇÕES NO SOFTWARE.
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/copyright"

    # Criar debian/rules
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/rules"
#!/usr/bin/make -f
# Uncomment this to turn on verbose mode.
# export DH_VERBOSE = 1

%:
	dh \$@ --skip-missing-doc --skip-systemd-service

# NOVO: Regra para limpar o projeto Cargo/Tauri
override_dh_auto_clean:
	# Limpa o projeto Cargo/Tauri dentro de src-tauri
	(cd src-tauri && cargo clean)
	# Limpa dependências e caches do Node.js
	#npm cache clean || true

override_dh_auto_build:
	(cd src-tauri && tar -zxvf ../debian/vendor.tar.gz)
	tar -zxvf debian/node_modules.tar.gz
	rm debian/vendor.tar.gz debian/node_modules.tar.gz

	# Compila o aplicativo Tauri
	(cd src-tauri && npm run tauri build -- --no-bundle --target x86_64-unknown-linux-gnu -- --frozen)

override_dh_auto_install:
	# Caminho onde o Tauri coloca o executável e outros arquivos
	# Ajuste conforme o nome real do seu executável gerado pelo Tauri
	TAURI_BUILD_DIR=\$(pwd)/src-tauri/target/x86_64-unknown-linux-gnu/release
	APP_EXECUTABLE_NAME=\$(echo ${EXECUTABLE_NAME} | tr '[:upper:]' '[:lower:]')

	# Cria os diretórios de destino
	mkdir -p \$(DESTDIR)/usr/bin
	mkdir -p \$(DESTDIR)/usr/share/applications
	mkdir -p \$(DESTDIR)/usr/share/icons/hicolor/scalable/apps
	mkdir -p \$(DESTDIR)/usr/share/icons/hicolor/256x256/apps

	# Copia o executável principal
	cp "\${TAURI_BUILD_DIR}/\${APP_EXECUTABLE_NAME}" "\$(DESTDIR)/usr/bin/\${APP_EXECUTABLE_NAME}"
	chmod +x "\$(DESTDIR)/usr/bin/\${APP_EXECUTABLE_NAME}"

	# Copia o arquivo .desktop
	cp debian/${APP_NAME}.desktop \$(DESTDIR)/usr/share/applications/\${APP_EXECUTABLE_NAME}.desktop

	# Copia ícones (verifique onde estão seus ícones no projeto - images/icon.svg, images/icon_256x256.png)
	# Verifique se o arquivo images/icon.svg existe no seu projeto.
	# Ou comente se você não tem esses ícones ou se o Tauri os empacota de outra forma.
	[ -f images/icon.svg ] && cp images/icon.svg \$(DESTDIR)/usr/share/icons/hicolor/scalable/apps/\${APP_EXECUTABLE_NAME}.svg
	[ -f images/icon_256x256.png ] && cp images/icon_256x256.png \$(DESTDIR)/usr/share/icons/hicolor/256x256/apps/\${APP_EXECUTABLE_NAME}.png

	# Limpar arquivos de build
	dh_clean
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/rules"

    # Criar debian/fairetodoapp.desktop
    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/${APP_NAME}.desktop"
[Desktop Entry]
Version=1.0
Name=FaireToDo App
Comment=Um aplicativo de lista de tarefas com Tauri
Exec=${APP_NAME}
Icon=${APP_NAME}
Terminal=false
Type=Application
Categories=Utility;Productivity;
StartupNotify=true
EOF
    success_msg "Criado ${DEBIAN_DIR_IN_PROJECT}/${APP_NAME}.desktop"

    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/cargo.config"
[source.crates-io]
replace-with = vendored-sources

[source.vendored-sources]
directory = "vendor"
EOF
    success_msg "Criado o arquivo ${DEBIAN_DIR_IN_PROJECT}/cargo.config"

	mkdir "${DEBIAN_DIR_IN_PROJECT}/source"

    echo "3.0 (quilt)" > "${DEBIAN_DIR_IN_PROJECT}/source/format"
    success_msg "Criado o arquivo ${DEBIAN_DIR_IN_PROJECT}/source/format"

    cat <<EOF > "${DEBIAN_DIR_IN_PROJECT}/source/include-binaries"
debian/vendor.tar.gz
debian/node_modules.tar.gz
EOF

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
    echo "Você pode precisar ajustar caminhos de ícones, dependências, e comandos de build/install."
    echo "Pressione Enter para continuar após a revisão (ou Ctrl+C para abortar e ajustar)."
    read -r
fi

# --- 3.1 Gerar o diretório de vendors do cargo, empacotar dentro de debian e deopis remover novamente
cd $PROJECT_ROOT_DIR/src-tauri
cargo vendor || error_exit "Não foi possível gerar o diretório de libs vendors do cargo"
tar -czf "${DEBIAN_DIR_IN_PROJECT}/vendor.tar.gz" vendor || error_exit "Não foi possível empacotar o diretório de vendors"
rm -Rf vendor/

# --- 3.2 Gerar o diretório node_modules atualizado, empacotar dentro de debian e depois remover novamente
cd $PROJECT_ROOT_DIR
npm clean-install

tar -czf "${DEBIAN_DIR_IN_PROJECT}/node_modules.tar.gz" node_modules || error_exit "Não foi possível empacotar o diretório node_modules"
rm -Rf node_modules

# --- 4. Limpar e Preparar Diretório de Construção Temporário ---
echo "--- Limpando e preparando diretório de construção temporário ($TEMP_BUILD_ROOT_DIR)..."
rm -rf "$TEMP_BUILD_ROOT_DIR"
mkdir -p "$TEMP_BUILD_ROOT_DIR" || error_exit "Não foi possível criar o diretório temporário: $TEMP_BUILD_ROOT_DIR"

# --- 5. Criar o tarball .orig.tar.gz ---
echo "--- Criando o tarball .orig.tar.gz..."
# Vá para o diretório raiz do projeto original para criar o tarball
cd "$PROJECT_ROOT_DIR" || error_exit "Não foi possível retornar ao diretório do projeto: $PROJECT_ROOT_DIR"

# Crie o tarball incluindo apenas os arquivos de código-fonte
# Exclua node_modules, target, dist, .git, e o próprio diretório debian/ para o .orig.tar.gz
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
if [ -n "$LAST_CHANGELOG_VERSION" ]; then
    if [ "$LAST_CHANGELOG_VERSION" == "$APP_VERSION" ]; then
        # Mesma versão do app, incrementa a revisão Debian
        NEW_DEB_REVISION=$((LAST_CHANGELOG_REV + 1))
        dch -v "${APP_VERSION}-${NEW_DEB_REVISION}" "Rebuild for new PPA upload." --distribution "noble"
        DEB_CHANGES_FILE="${DEB_CHANGES_FILE_BASENAME}-${NEW_DEB_REVISION}_source.changes"
	wget -O "$TEMP_BUILD_ROOT_DIR/${APP_NAME}_${APP_VERSION}.orig.tar.gz" "https://launchpad.net/~charlesschaefer/+archive/ubuntu/${PPA_IDENTIFIER}/+sourcefiles/${APP_NAME}/${APP_VERSION}-2/${APP_NAME}_${APP_VERSION}.orig.tar.gz"
    else
        # Nova versão do app, nova entrada no changelog
        dch -v "${APP_VERSION}-1" "New upstream release of ${APP_NAME}." --distribution "noble"
        DEB_CHANGES_FILE="${DEB_CHANGES_FILE_BASENAME}-1_source.changes"
    fi
else 
    echo "Não foi possível ler LAST_CHANGELOG_VERSION"
    exit 1
fi

# Apenas para garantir que o control está com as informações mais recentes (pode ser redundante após a primeira criação, mas é seguro)
# (Estas linhas já foram feitas se debian/ foi gerado, mas é bom para garantir atualizações manuais)
sed -i "s/^Maintainer: .*$/Maintainer: ${MAINTAINER_NAME} <${MAINTAINER_EMAIL}>/" debian/control
sed -i "s/^Homepage: .*$/Homepage: https:\/\/launchpad.net\/${APP_NAME}/" debian/control
sed -i "s/^Vcs-Browser: .*$/Vcs-Browser: https:\/\/git.launchpad.net\/~${LAUNCHPAD_USER}\/+git\/${APP_NAME}/" debian/control
sed -i "s/^Vcs-Git: .*$/Vcs-Git: https:\/\/git.launchpad.net\/~${LAUNCHPAD_USER}\/+git\/${APP_NAME}/" debian/control

# --- 8. Construir o Pacote Fonte Debian ---
echo "--- Construindo o pacote fonte Debian no $(pwd)/src-tauri/..."
# dpkg-buildpackage -S -sa: cria apenas o pacote fonte e inclui o tarball original
if [ -z "$NEW_DEB_REVISION" ]; then
    debuild -S -sa || error_exit "Erro ao construir o pacote fonte Debian. Verifique os logs acima."
else 
    debuild -S -sd || error_exit "Erro ao construir o pacote fonte Debian. Verifique os logs acima."
fi

# --- 9. Enviar para o PPA ---
echo "--- Pacote fonte construído com sucesso. Enviando para o PPA ${PPA_IDENTIFIER}..."
# cd para o diretório pai onde os arquivos .changes foram gerados
cd "$TEMP_BUILD_ROOT_DIR"
if [ ! -f "$DEB_CHANGES_FILE" ]; then
    error_exit "Arquivo .changes não encontrado: $DEB_CHANGES_FILE. Algo deu errado na construção."
fi

echo "--- Assinando o pacote fonte construído..."
debsign "$DEB_CHANGES_FILE" -m $MAINTAINER_NAME -e $MAINTAINER_EMAIL 

# dput envia o pacote. Você precisará digitar sua senha GPG.
dput "ppa:${LAUNCHPAD_USER}/${PPA_IDENTIFIER}" "$DEB_CHANGES_FILE" || error_exit "Erro ao enviar o pacote para o PPA. Verifique suas credenciais e o status do Launchpad."

cp "$TEMP_BUILD_ROOT_DIR/$DEB_SOURCE_DIR/debian/*" "$PROJECT_ROOT_DIR/debian/"

success_msg "Processo concluído!"
echo "Verifique o status da build em https://launchpad.net/~${LAUNCHPAD_USER}/+archive/ubuntu/${PPA_IDENTIFIER}"
echo "O arquivo .changes enviado foi: $DEB_CHANGES_FILE"
