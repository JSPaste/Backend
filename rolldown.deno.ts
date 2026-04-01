import path from "node:path";

import denoVite from "@deno/vite-plugin";
import type { Plugin, PluginContext, CustomPluginOptions, ResolveIdResult } from "rolldown";

export const deno = (): Plugin[] => {
  const plugins = denoVite();

  const configPlugin = plugins.find((p) => p.name === "deno:config");
  if (configPlugin) {
    configPlugin.buildStart = (): void => {
      for (const plugin of plugins as { configResolved?: (args: { root: string }) => void }[]) {
        plugin.configResolved?.({ root: Deno.cwd() });
      }
    };
  }

  const mainPlugin = plugins.find((p) => p.name === "deno");
  if (mainPlugin?.resolveId) {
    const originalResolveId = mainPlugin.resolveId;

    mainPlugin.resolveId = async function (
      this: PluginContext,
      id: string,
      importer?: string,
      options?: CustomPluginOptions
    ): Promise<ResolveIdResult> {
      if (importer && id.startsWith(".") && !importer.startsWith("\0")) {
        id = path.resolve(path.dirname(importer), id);
      }

      return await (
        originalResolveId as (
          this: PluginContext,
          id: string,
          importer?: string,
          options?: CustomPluginOptions
        ) => ResolveIdResult | Promise<ResolveIdResult>
      ).call(this, id, importer, options);
    };
  }

  return plugins;
};
