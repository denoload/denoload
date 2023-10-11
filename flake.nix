{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { flake-utils, nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;
      in
      {
        devShells = {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [ deno ];
          };
        };
        packages = {
          docker = pkgs.dockerTools.buildImage {
            name = "negrel/denoload";
            tag = "dev";

            copyToRoot = pkgs.buildEnv {
              name = "denoload-image-root";
              paths = [ ./. ];
              extraPrefix = "/denoload";
            };
            config = {
              Entrypoint = [ "${pkgs.deno}/bin/deno" "run" "-A" "/denoload/src/main.ts" ];
              WorkingDir = "/tests";
            };
          };
        };
      }
    );
}

