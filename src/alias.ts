import "module-alias/register";
import { addAliases } from "module-alias";
import path from "path";

addAliases({
  "@": path.resolve(__dirname),
  "@/config": path.resolve(__dirname, "config"),
  "@/constants": path.resolve(__dirname, "constants"),
  "@/events": path.resolve(__dirname, "events"),
  "@/utils": path.resolve(__dirname, "utils"),
  "@/routes": path.resolve(__dirname, "routes"),
  "@/controllers": path.resolve(__dirname, "controllers"),
  "@middlewares": path.resolve(__dirname, "middlewares"),
  "@/types": path.resolve(__dirname, "types"),
});
