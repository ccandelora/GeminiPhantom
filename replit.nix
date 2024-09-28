{pkgs}: {
  deps = [
    pkgs.mailutils
    pkgs.run
    pkgs.espeak-ng
    pkgs.openssl
    pkgs.postgresql
  ];
}
