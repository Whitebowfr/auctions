{ lib
, stdenv
, autoreconfHook
, pkg-config
, gettext
, zlib
, openssl
, fuse3
, src ? ./. 
, sharedLibraries ? {}
}:

let
  sharedLibraryNames = [
    "libbfio"
    "libcaes"
    "libcdata"
    "libcerror"
    "libcfile"
    "libclocale"
    "libcnotify"
    "libcpath"
    "libcsplit"
    "libcthreads"
    "libfcache"
    "libfdata"
    "libfguid"
    "libfplist"
    "libfvalue"
    "libhmac"
    "libuna"
  ];

  syncSharedLibraries = lib.concatMapStringsSep "\n" (name:
    if builtins.hasAttr name sharedLibraries then
      ''
        if [ ! -d ${name} ] && [ -e ${toString (builtins.getAttr name sharedLibraries)} ]; then
          cp -R ${toString (builtins.getAttr name sharedLibraries)} ${name}
        fi
      ''
    else
      ""
  ) sharedLibraryNames;
in
stdenv.mkDerivation rec {
  pname = "libfvde";
  version = "20260705";

  src = lib.cleanSource src;

  nativeBuildInputs = [
    autoreconfHook
    pkg-config
  ];

  buildInputs = [
    gettext
    zlib
    openssl
    fuse3
  ];

  preConfigure = ''
    runHook preConfigure

    ${syncSharedLibraries}
  '';

  doCheck = false;

  enableParallelBuilding = true;

  meta = with lib; {
    description = "Library and tools to access Core Storage / FileVault 2 volumes";
    homepage = "https://github.com/libyal/libfvde";
    license = licenses.lgpl3Plus;
    platforms = platforms.linux;
  };
}