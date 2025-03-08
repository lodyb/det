FROM archlinux:base

# Set up locale
RUN sed -i 's/#en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
 && locale-gen

# Enable multilib repository & install dependencies
RUN echo -e '[multilib]\nInclude = /etc/pacman.d/mirrorlist' >> /etc/pacman.conf \
 && pacman -Syu --noconfirm --needed \
    steam-native-runtime xorg-server-xvfb supervisor imagemagick \
    lib32-vulkan-icd-loader vulkan-icd-loader mesa lib32-mesa \
    xterm vim procps-ng lib32-glibc lib32-gcc-libs scrot \
    lib32-sdl2 lib32-fontconfig lib32-freetype2 lib32-curl xdotool \
    mimalloc \
 && pacman -Scc --noconfirm

# Create working directory
WORKDIR /game

# Copy necessary scripts and configurations
COPY supervisord.conf /etc/supervisord.conf
COPY scripts/ /game/scripts/
RUN chmod +x /game/scripts/*.sh

# Set environment variables
ENV DISPLAY=:0
ENV XDG_RUNTIME_DIR=/tmp/runtime-dir
ENV LD_LIBRARY_PATH=/usr/lib:/usr/lib32:/lib:/lib32

# Create required directories
RUN mkdir -p ${XDG_RUNTIME_DIR} && chmod 700 ${XDG_RUNTIME_DIR}

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]