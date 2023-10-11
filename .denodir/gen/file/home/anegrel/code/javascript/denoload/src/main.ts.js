import * as path from "std/path/mod.ts";
import executors from "./executors.ts";
import log from "./log.ts";
const logger = log.getLogger("main");
/**
 * Load a module and its exported options.
 *
 * @param moduleURL - URL of the module to load.
 * @returns Options exported by the module.
 *
 * @throws {@link TypeError}
 * This exception is thrown if the module can't bet imported.
 */ async function loadOptions(moduleURL) {
  const module = await import(moduleURL.toString());
  // TODO(@negrel): validate options object before returning it.
  return module.options;
}
function printAsciiArt() {
  const dino = [
    "                __  ",
    "               / _) ",
    "      _.----._/ /   ",
    "     /         /    ",
    "  __/ (  | (  |     ",
    " /__.-'|_|--|_|     "
  ];
  const denoload = [
    " ___                   _                _ ",
    "|   \\  ___  _ _   ___ | | ___  __ _  __| |",
    "| |) |/ -_)| ' \\ / _ \\| |/ _ \\/ _` |/ _` |",
    "|___/ \\___||_||_|\\___/|_|\\___/\\__/_|\\__/_|"
  ];
  for(let i = 0; i < 6; i++){
    let str = dino[i];
    if (i >= 1 && i < 5) {
      str += denoload[i - 1];
    }
    console.log(str);
  }
  console.log();
}
(async ()=>{
  printAsciiArt();
  const moduleURL = (()=>{
    if (Deno.args.length < 1) {
      logger.error("modules URL missing");
      Deno.exit(1);
    }
    return new URL(path.join("file://", Deno.cwd(), Deno.args[0]));
  })();
  logger.debug(`loading options of module "${moduleURL}"...`);
  const options = await loadOptions(moduleURL);
  for (const [scenarioName, scenarioOptions] of Object.entries(options.scenarios)){
    const executor = new executors[scenarioOptions.executor]();
    await executor.execute(moduleURL, scenarioName, scenarioOptions);
  }
  logger.info("scenarios successfully executed, exiting...");
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9hbmVncmVsL2NvZGUvamF2YXNjcmlwdC9kZW5vbG9hZC9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJzdGQvcGF0aC9tb2QudHNcIjtcblxuaW1wb3J0IHsgT3B0aW9ucyB9IGZyb20gXCIuL2RhdGF0eXBlcy50c1wiO1xuaW1wb3J0IGV4ZWN1dG9ycyBmcm9tIFwiLi9leGVjdXRvcnMudHNcIjtcbmltcG9ydCBsb2cgZnJvbSBcIi4vbG9nLnRzXCI7XG5cbmNvbnN0IGxvZ2dlciA9IGxvZy5nZXRMb2dnZXIoXCJtYWluXCIpO1xuXG4vKipcbiAqIExvYWQgYSBtb2R1bGUgYW5kIGl0cyBleHBvcnRlZCBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSBtb2R1bGVVUkwgLSBVUkwgb2YgdGhlIG1vZHVsZSB0byBsb2FkLlxuICogQHJldHVybnMgT3B0aW9ucyBleHBvcnRlZCBieSB0aGUgbW9kdWxlLlxuICpcbiAqIEB0aHJvd3Mge0BsaW5rIFR5cGVFcnJvcn1cbiAqIFRoaXMgZXhjZXB0aW9uIGlzIHRocm93biBpZiB0aGUgbW9kdWxlIGNhbid0IGJldCBpbXBvcnRlZC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZE9wdGlvbnMobW9kdWxlVVJMOiBVUkwpOiBQcm9taXNlPE9wdGlvbnM+IHtcbiAgY29uc3QgbW9kdWxlID0gYXdhaXQgaW1wb3J0KG1vZHVsZVVSTC50b1N0cmluZygpKTtcbiAgLy8gVE9ETyhAbmVncmVsKTogdmFsaWRhdGUgb3B0aW9ucyBvYmplY3QgYmVmb3JlIHJldHVybmluZyBpdC5cbiAgcmV0dXJuIG1vZHVsZS5vcHRpb25zO1xufVxuXG5mdW5jdGlvbiBwcmludEFzY2lpQXJ0KCkge1xuICBjb25zdCBkaW5vID0gW1xuICAgIFwiICAgICAgICAgICAgICAgIF9fICBcIixcbiAgICBcIiAgICAgICAgICAgICAgIC8gXykgXCIsXG4gICAgXCIgICAgICBfLi0tLS0uXy8gLyAgIFwiLFxuICAgIFwiICAgICAvICAgICAgICAgLyAgICBcIixcbiAgICBcIiAgX18vICggIHwgKCAgfCAgICAgXCIsXG4gICAgXCIgL19fLi0nfF98LS18X3wgICAgIFwiLFxuICBdO1xuICBjb25zdCBkZW5vbG9hZCA9IFtcbiAgICBcIiBfX18gICAgICAgICAgICAgICAgICAgXyAgICAgICAgICAgICAgICBfIFwiLFxuICAgIFwifCAgIFxcXFwgIF9fXyAgXyBfICAgX19fIHwgfCBfX18gIF9fIF8gIF9ffCB8XCIsXG4gICAgXCJ8IHwpIHwvIC1fKXwgJyBcXFxcIC8gXyBcXFxcfCB8LyBfIFxcXFwvIF9gIHwvIF9gIHxcIixcbiAgICBcInxfX18vIFxcXFxfX198fF98fF98XFxcXF9fXy98X3xcXFxcX19fL1xcXFxfXy9ffFxcXFxfXy9ffFwiLFxuICBdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgNjsgaSsrKSB7XG4gICAgbGV0IHN0ciA9IGRpbm9baV07XG4gICAgaWYgKGkgPj0gMSAmJiBpIDwgNSkge1xuICAgICAgc3RyICs9IGRlbm9sb2FkW2kgLSAxXTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coc3RyKTtcbiAgfVxuICBjb25zb2xlLmxvZygpO1xufVxuXG4oYXN5bmMgKCkgPT4ge1xuICBwcmludEFzY2lpQXJ0KCk7XG4gIGNvbnN0IG1vZHVsZVVSTCA9ICgoKSA9PiB7XG4gICAgaWYgKERlbm8uYXJncy5sZW5ndGggPCAxKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoXCJtb2R1bGVzIFVSTCBtaXNzaW5nXCIpO1xuICAgICAgRGVuby5leGl0KDEpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVVJMKHBhdGguam9pbihcImZpbGU6Ly9cIiwgRGVuby5jd2QoKSwgRGVuby5hcmdzWzBdKSk7XG4gIH0pKCk7XG5cbiAgbG9nZ2VyLmRlYnVnKGBsb2FkaW5nIG9wdGlvbnMgb2YgbW9kdWxlIFwiJHttb2R1bGVVUkx9XCIuLi5gKTtcbiAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IGxvYWRPcHRpb25zKG1vZHVsZVVSTCk7XG5cbiAgZm9yIChcbiAgICBjb25zdCBbc2NlbmFyaW9OYW1lLCBzY2VuYXJpb09wdGlvbnNdIG9mIE9iamVjdC5lbnRyaWVzKG9wdGlvbnMuc2NlbmFyaW9zKVxuICApIHtcbiAgICBjb25zdCBleGVjdXRvciA9IG5ldyBleGVjdXRvcnNbc2NlbmFyaW9PcHRpb25zLmV4ZWN1dG9yXSgpO1xuICAgIGF3YWl0IGV4ZWN1dG9yLmV4ZWN1dGUobW9kdWxlVVJMLCBzY2VuYXJpb05hbWUsIHNjZW5hcmlvT3B0aW9ucyk7XG4gIH1cblxuICBsb2dnZXIuaW5mbyhcInNjZW5hcmlvcyBzdWNjZXNzZnVsbHkgZXhlY3V0ZWQsIGV4aXRpbmcuLi5cIik7XG59KSgpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksVUFBVSxrQkFBa0I7QUFHeEMsT0FBTyxlQUFlLGlCQUFpQjtBQUN2QyxPQUFPLFNBQVMsV0FBVztBQUUzQixNQUFNLFNBQVMsSUFBSSxTQUFTLENBQUM7QUFFN0I7Ozs7Ozs7O0NBUUMsR0FDRCxlQUFlLFlBQVksU0FBYztFQUN2QyxNQUFNLFNBQVMsTUFBTSxNQUFNLENBQUMsVUFBVSxRQUFRO0VBQzlDLDhEQUE4RDtFQUM5RCxPQUFPLE9BQU8sT0FBTztBQUN2QjtBQUVBLFNBQVM7RUFDUCxNQUFNLE9BQU87SUFDWDtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7R0FDRDtFQUNELE1BQU0sV0FBVztJQUNmO0lBQ0E7SUFDQTtJQUNBO0dBQ0Q7RUFFRCxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxJQUFLO0lBQzFCLElBQUksTUFBTSxJQUFJLENBQUMsRUFBRTtJQUNqQixJQUFJLEtBQUssS0FBSyxJQUFJLEdBQUc7TUFDbkIsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFO0lBQ3hCO0lBQ0EsUUFBUSxHQUFHLENBQUM7RUFDZDtFQUNBLFFBQVEsR0FBRztBQUNiO0FBRUMsQ0FBQTtFQUNDO0VBQ0EsTUFBTSxZQUFZLEFBQUMsQ0FBQTtJQUNqQixJQUFJLEtBQUssSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHO01BQ3hCLE9BQU8sS0FBSyxDQUFDO01BQ2IsS0FBSyxJQUFJLENBQUM7SUFDWjtJQUVBLE9BQU8sSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLFdBQVcsS0FBSyxHQUFHLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtFQUM5RCxDQUFBO0VBRUEsT0FBTyxLQUFLLENBQUMsQ0FBQywyQkFBMkIsRUFBRSxVQUFVLElBQUksQ0FBQztFQUMxRCxNQUFNLFVBQVUsTUFBTSxZQUFZO0VBRWxDLEtBQ0UsTUFBTSxDQUFDLGNBQWMsZ0JBQWdCLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxTQUFTLEVBQ3pFO0lBQ0EsTUFBTSxXQUFXLElBQUksU0FBUyxDQUFDLGdCQUFnQixRQUFRLENBQUM7SUFDeEQsTUFBTSxTQUFTLE9BQU8sQ0FBQyxXQUFXLGNBQWM7RUFDbEQ7RUFFQSxPQUFPLElBQUksQ0FBQztBQUNkLENBQUEifQ==