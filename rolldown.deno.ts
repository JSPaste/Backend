// oxlint-disable
// vibecode resolver
// based on: https://github.com/denoland/deno-rolldown-plugin

import {
  type Loader,
  type LoadResponse,
  MediaType,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
  type WorkspaceOptions
} from "@deno/loader";
import { fromFileUrl } from "@std/path";

const MARegex = /.*/;

type Module = {
  specifier: string;
  code: string;
};

/** Options for creating the Deno plugin. */
export interface DenoPluginOptions extends WorkspaceOptions {
  /** Entry points for the build (optional, can be provided in buildStart) */
  entrypoints?: string[];
  /**
   * Patterns to treat as external when Deno loader can't resolve them.
   * Useful for npm packages that should remain external.
   */
  externalPatterns?: (string | RegExp)[];
}

export type BuildStartOptions = {
  input?: string | string[] | Record<string, string>;
};

export type ResolveIdOptions = {
  kind: "import-statement" | "dynamic-import" | "require-call";
};

export interface DenoPlugin extends Disposable {
  name: string;
  buildStart(options?: BuildStartOptions): Promise<void>;
  resolveId: {
    filter: { id: RegExp };
    handler(
      source: string,
      importer: string | undefined,
      options: ResolveIdOptions
    ): Promise<string | { id: string; external: boolean } | null | undefined>;
  };
  load: {
    filter: { id: RegExp };
    handler(id: string): string | undefined;
  };
}

function isBareSpecifier(source: string): boolean {
  return !(
    source.startsWith(".") ||
    source.startsWith("/") ||
    source.startsWith("file:") ||
    source.startsWith("http:") ||
    source.startsWith("https:") ||
    source.startsWith("npm:") ||
    source.startsWith("jsr:") ||
    source.startsWith("node:")
  );
}

/**
 * Creates a deno plugin for use with rolldown.
 * @returns The plugin.
 */
export function deno(pluginOptions: DenoPluginOptions = {}): DenoPlugin {
  let loader: Loader | undefined;
  let primaryEntrypoint: string | undefined;
  const loads = new Map<string, Promise<LoadResponse | undefined>>();
  const modules = new Map<string, Module | undefined>();

  return {
    name: "deno-plugin",

    [Symbol.dispose]: () => {
      if (loader && typeof loader[Symbol.dispose] === "function") {
        loader[Symbol.dispose]();
      }
    },

    buildStart: async (options) => {
      let inputs: string[] = [];

      if (options?.input != null) {
        const { input } = options;
        if (Array.isArray(input)) {
          inputs = input;
        } else if (typeof input === "object") {
          inputs = Object.values(input);
        } else if (typeof input === "string") {
          inputs = [input];
        }
      } else if (pluginOptions.entrypoints?.length) {
        inputs = pluginOptions.entrypoints;
      }

      if (inputs.length === 0) return;

      [primaryEntrypoint] = inputs;

      const workspace = new Workspace({ ...pluginOptions });
      loader = await workspace.createLoader();
      await loader.addEntrypoints(inputs);
    },

    resolveId: {
      filter: { id: MARegex },

      handler: async (source, importer, options) => {
        if (!loader) {
          throw new Error("Deno loader not initialized. Make sure buildStart was called.");
        }

        const resolutionMode = resolveKindToResolutionMode(options.kind);
        const normalizedImporter = importer != null ? (modules.get(importer)?.specifier ?? importer) : undefined;

        let resolvedSpecifier: string | undefined;

        try {
          resolvedSpecifier = await loader.resolve(source, normalizedImporter, resolutionMode);
        } catch (error: unknown) {
          if ((error as { code?: string })?.code !== "ERR_MODULE_NOT_FOUND") {
            throw error;
          }
        }

        if (resolvedSpecifier === undefined && isBareSpecifier(source)) {
          if (primaryEntrypoint) {
            try {
              resolvedSpecifier = await loader.resolve(source, primaryEntrypoint, resolutionMode);
            } catch {}
          }

          if (resolvedSpecifier === undefined) {
            try {
              resolvedSpecifier = await loader.resolve(source, undefined, resolutionMode);
            } catch {}
          }
        }

        if (resolvedSpecifier === undefined) {
          if (pluginOptions.externalPatterns) {
            for (const pattern of pluginOptions.externalPatterns) {
              if (typeof pattern === "string") {
                if (source === pattern || source.startsWith(`${pattern}/`)) {
                  return { id: source, external: true };
                }
              } else if (pattern.test(source)) {
                return { id: source, external: true };
              }
            }
          }

          if (isBareSpecifier(source)) {
            return { id: source, external: true };
          }

          return;
        }

        let loadPromise = loads.get(resolvedSpecifier);
        if (!loadPromise) {
          loadPromise = loader.load(resolvedSpecifier, RequestedModuleType.Default);
          loads.set(resolvedSpecifier, loadPromise);
        }

        const result = await loadPromise;

        if (!result) {
          modules.set(resolvedSpecifier, undefined);
          return resolvedSpecifier;
        }

        if (result.kind === "external") {
          return { id: result.specifier, external: true };
        }

        const ext = mediaTypeToExtension(result.mediaType);
        let { specifier } = result;

        if (!specifier.endsWith(ext)) {
          specifier += `.rolldown${ext}`;
        }

        if (specifier.startsWith("file:///")) {
          specifier = fromFileUrl(specifier);
        }

        modules.set(specifier, {
          specifier: result.specifier,
          code: new TextDecoder().decode(result.code)
        });

        return specifier;
      }
    },

    load: {
      filter: { id: MARegex },

      handler: (id) => {
        return modules.get(id)?.code;
      }
    }
  };
}

function mediaTypeToExtension(mediaType: MediaType): string {
  switch (mediaType) {
    case MediaType.JavaScript:
      return ".js";
    case MediaType.Mjs:
      return ".mjs";
    case MediaType.Cjs:
      return ".cjs";
    case MediaType.Jsx:
      return ".jsx";
    case MediaType.TypeScript:
      return ".ts";
    case MediaType.Mts:
      return ".mts";
    case MediaType.Cts:
      return ".cts";
    case MediaType.Dts:
      return ".d.ts";
    case MediaType.Dmts:
      return ".d.mts";
    case MediaType.Dcts:
      return ".d.cts";
    case MediaType.Tsx:
      return ".tsx";
    case MediaType.Css:
      return ".css";
    case MediaType.Json:
      return ".json";
    case MediaType.Html:
      return ".html";
    case MediaType.Sql:
      return ".sql";
    case MediaType.Wasm:
      return ".wasm";
    case MediaType.SourceMap:
      return ".map";
    default:
      return "";
  }
}

function resolveKindToResolutionMode(kind: string): ResolutionMode {
  switch (kind) {
    case "import-statement":
    case "dynamic-import":
      return ResolutionMode.Import;
    case "require-call":
      return ResolutionMode.Require;
    default:
      throw new Error(`not implemented: ${kind}`);
  }
}
