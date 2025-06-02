#!/bin/bash
CURL=$(which curl)
FLATPAK_BUILDER=$(which flatpak-builder)
GIT=$(which git)
PYTHON=$(which python3)
PIP=$(which pip3)

error() {
    echo -e "\033[31m$1\033[0m" # Print the message in red
}

error_and_exit() {
    error "$1"
    exit 1
}

info() {
    echo -e "\033[34m$1\033[0m" # Print the message in blue
}

success() {
    echo -e "\033[32m$1\033[0m" # Print the message in green
}

dbg() {
    first_word=$(echo "$1" | cut -d"_" -f1)
    if [ $(echo "$1" | cut -c1) != "[" ] && [ "$first_word" != "error" ] && [ "$first_word" != "info" ] && [ "$first_word" != "success" ]; then
        echo -e "\033[90mRunning: $1\033[0m" # Print the message in gray
    fi
}

# Generates debug messages for each command executed
trap 'dbg "$BASH_COMMAND"; this_command=$BASH_COMMAND' DEBUG

if [ -z "$CURL" ]; then
    error_and_exit "curl is not installed. Please install curl to proceed."
    exit 1
fi
if [ -z "$FLATPAK_BUILDER" ]; then
    error_and_exit "flatpak-builder is not installed. Please install flatpak-builder to proceed."
    exit 1
fi
if [ -z "$GIT" ]; then
    error_and_exit "git is not installed. Please install git to proceed."
    exit 1
fi

# info "Calling flatpak-builder to build the flatpak"
# $FLATPAK_BUILDER --arch="x86_64" --delete-build-dirs --force-clean --sandbox --user --install --install-deps-from=flathub --mirror-screenshots-url=https://dl.flathub.org/media/ --ccache --repo=local_repo build-dir net.charlesschaefer.fairetodoapp.yml
# if [ $? -ne 0 ]; then
#     error "Failed to build the flatpak!"
#     info "Fix the errors described above and try again by running the following command:"
#     info "\t$FLATPAK_BUILDER --arch=\"x86_64\" --delete-build-dirs --force-clean --sandbox --user --install --install-deps-from=flathub --ccache --repo=local_repo build-dir net.charlesschaefer.fairetodoapp.yml"
#     exit 1
# fi

info "Copying the flatpak files to the flathub directory"
cp net.charlesschaefer.fairetodoapp.metainfo.xml ../../flathub/
if [ $? -ne 0 ]; then
    error_and_exit "Failed to copy the flatpak files to the flathub directory."
    exit 1
else
    success "Flatpak files copied successfully to the flathub directory."
fi

success "Flatpak build completed successfully."
