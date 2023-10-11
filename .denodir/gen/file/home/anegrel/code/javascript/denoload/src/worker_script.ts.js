import * as log from "std/log/mod.ts";
import { workerProcedureHandler } from "./rpc.ts";
import * as vm from "./vu_global_this.js";
let logger = log.getLogger();
self.onmessage = workerProcedureHandler({
  // NOTE: setupWorker MUST NOT be async.
  setupWorker (workerId) {
    log.setup({
      handlers: {
        worker: new log.handlers.ConsoleHandler("NOTSET", {
          formatter: (logRecord)=>{
            const args = logRecord.args// deno-lint-ignore no-explicit-any
            .map((arg)=>arg.toString()).join(" ");
            return `${logRecord.datetime.toISOString()} [${logRecord.levelName}] [${logRecord.loggerName}/${workerId}] - ${logRecord.msg} ${args}`;
          }
        })
      },
      loggers: {
        "worker": {
          level: "WARNING",
          handlers: [
            "worker"
          ]
        }
      }
    });
    vm.setup();
    logger = log.getLogger("worker");
    logger.info("worker ready");
  },
  async iterations (moduleURL, nbIter) {
    const module = await import(moduleURL);
    for(let i = 0; i < nbIter; i++){
      const start = performance.now();
      try {
        await module.default();
      } catch (err) {
        console.error(err);
      }
      performance.measure("iteration", {
        start,
        end: performance.now()
      });
    }
  },
  collectPerformanceMetrics () {
    const result = {
      fetch: performance.getEntriesByName("fetch"),
      iteration: performance.getEntriesByName("iteration")
    };
    performance.clearMeasures("fetch");
    performance.clearMeasures("iteration");
    return result;
  }
}, self.postMessage);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9hbmVncmVsL2NvZGUvamF2YXNjcmlwdC9kZW5vbG9hZC9zcmMvd29ya2VyX3NjcmlwdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBsb2cgZnJvbSBcInN0ZC9sb2cvbW9kLnRzXCI7XG5pbXBvcnQgeyB3b3JrZXJQcm9jZWR1cmVIYW5kbGVyIH0gZnJvbSBcIi4vcnBjLnRzXCI7XG5pbXBvcnQgKiBhcyB2bSBmcm9tIFwiLi92dV9nbG9iYWxfdGhpcy5qc1wiO1xuXG5kZWNsYXJlIGNvbnN0IHNlbGY6IFdvcmtlcjtcblxubGV0IGxvZ2dlciA9IGxvZy5nZXRMb2dnZXIoKTtcblxuc2VsZi5vbm1lc3NhZ2UgPSB3b3JrZXJQcm9jZWR1cmVIYW5kbGVyKHtcbiAgLy8gTk9URTogc2V0dXBXb3JrZXIgTVVTVCBOT1QgYmUgYXN5bmMuXG4gIHNldHVwV29ya2VyKHdvcmtlcklkOiBudW1iZXIpIHtcbiAgICBsb2cuc2V0dXAoe1xuICAgICAgaGFuZGxlcnM6IHtcbiAgICAgICAgd29ya2VyOiBuZXcgbG9nLmhhbmRsZXJzLkNvbnNvbGVIYW5kbGVyKFwiTk9UU0VUXCIsIHtcbiAgICAgICAgICBmb3JtYXR0ZXI6IChsb2dSZWNvcmQ6IGxvZy5Mb2dSZWNvcmQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBsb2dSZWNvcmQuYXJnc1xuICAgICAgICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICAgICAgICAubWFwKChhcmc6IGFueSkgPT4gYXJnLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgIC5qb2luKFwiIFwiKTtcblxuICAgICAgICAgICAgcmV0dXJuIGAke2xvZ1JlY29yZC5kYXRldGltZS50b0lTT1N0cmluZygpfSBbJHtsb2dSZWNvcmQubGV2ZWxOYW1lfV0gWyR7bG9nUmVjb3JkLmxvZ2dlck5hbWV9LyR7d29ya2VySWR9XSAtICR7bG9nUmVjb3JkLm1zZ30gJHthcmdzfWA7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgICAgbG9nZ2Vyczoge1xuICAgICAgICBcIndvcmtlclwiOiB7XG4gICAgICAgICAgbGV2ZWw6IFwiV0FSTklOR1wiLFxuICAgICAgICAgIGhhbmRsZXJzOiBbXCJ3b3JrZXJcIl0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdm0uc2V0dXAoKTtcbiAgICBsb2dnZXIgPSBsb2cuZ2V0TG9nZ2VyKFwid29ya2VyXCIpO1xuICAgIGxvZ2dlci5pbmZvKFwid29ya2VyIHJlYWR5XCIpO1xuICB9LFxuICBhc3luYyBpdGVyYXRpb25zKG1vZHVsZVVSTDogc3RyaW5nLCBuYkl0ZXI6IG51bWJlcikge1xuICAgIGNvbnN0IG1vZHVsZSA9IGF3YWl0IGltcG9ydChtb2R1bGVVUkwpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuYkl0ZXI7IGkrKykge1xuICAgICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IG1vZHVsZS5kZWZhdWx0KCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgfVxuICAgICAgcGVyZm9ybWFuY2UubWVhc3VyZShcIml0ZXJhdGlvblwiLCB7XG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBlbmQ6IHBlcmZvcm1hbmNlLm5vdygpLFxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuICBjb2xsZWN0UGVyZm9ybWFuY2VNZXRyaWNzKCkge1xuICAgIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgUGVyZm9ybWFuY2VFbnRyeUxpc3Q+ID0ge1xuICAgICAgZmV0Y2g6IHBlcmZvcm1hbmNlLmdldEVudHJpZXNCeU5hbWUoXCJmZXRjaFwiKSxcbiAgICAgIGl0ZXJhdGlvbjogcGVyZm9ybWFuY2UuZ2V0RW50cmllc0J5TmFtZShcIml0ZXJhdGlvblwiKSxcbiAgICB9O1xuICAgIHBlcmZvcm1hbmNlLmNsZWFyTWVhc3VyZXMoXCJmZXRjaFwiKTtcbiAgICBwZXJmb3JtYW5jZS5jbGVhck1lYXN1cmVzKFwiaXRlcmF0aW9uXCIpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbn0sIHNlbGYucG9zdE1lc3NhZ2UpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksU0FBUyxpQkFBaUI7QUFDdEMsU0FBUyxzQkFBc0IsUUFBUSxXQUFXO0FBQ2xELFlBQVksUUFBUSxzQkFBc0I7QUFJMUMsSUFBSSxTQUFTLElBQUksU0FBUztBQUUxQixLQUFLLFNBQVMsR0FBRyx1QkFBdUI7RUFDdEMsdUNBQXVDO0VBQ3ZDLGFBQVksUUFBZ0I7SUFDMUIsSUFBSSxLQUFLLENBQUM7TUFDUixVQUFVO1FBQ1IsUUFBUSxJQUFJLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxVQUFVO1VBQ2hELFdBQVcsQ0FBQztZQUNWLE1BQU0sT0FBTyxVQUFVLElBQUksQUFDekIsbUNBQW1DO2FBQ2xDLEdBQUcsQ0FBQyxDQUFDLE1BQWEsSUFBSSxRQUFRLElBQzlCLElBQUksQ0FBQztZQUVSLE9BQU8sQ0FBQyxFQUFFLFVBQVUsUUFBUSxDQUFDLFdBQVcsR0FBRyxFQUFFLEVBQUUsVUFBVSxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsVUFBVSxDQUFDLENBQUMsRUFBRSxTQUFTLElBQUksRUFBRSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO1VBQ3hJO1FBQ0Y7TUFDRjtNQUNBLFNBQVM7UUFDUCxVQUFVO1VBQ1IsT0FBTztVQUNQLFVBQVU7WUFBQztXQUFTO1FBQ3RCO01BQ0Y7SUFDRjtJQUVBLEdBQUcsS0FBSztJQUNSLFNBQVMsSUFBSSxTQUFTLENBQUM7SUFDdkIsT0FBTyxJQUFJLENBQUM7RUFDZDtFQUNBLE1BQU0sWUFBVyxTQUFpQixFQUFFLE1BQWM7SUFDaEQsTUFBTSxTQUFTLE1BQU0sTUFBTSxDQUFDO0lBRTVCLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxRQUFRLElBQUs7TUFDL0IsTUFBTSxRQUFRLFlBQVksR0FBRztNQUM3QixJQUFJO1FBQ0YsTUFBTSxPQUFPLE9BQU87TUFDdEIsRUFBRSxPQUFPLEtBQUs7UUFDWixRQUFRLEtBQUssQ0FBQztNQUNoQjtNQUNBLFlBQVksT0FBTyxDQUFDLGFBQWE7UUFDL0I7UUFDQSxLQUFLLFlBQVksR0FBRztNQUN0QjtJQUNGO0VBQ0Y7RUFDQTtJQUNFLE1BQU0sU0FBK0M7TUFDbkQsT0FBTyxZQUFZLGdCQUFnQixDQUFDO01BQ3BDLFdBQVcsWUFBWSxnQkFBZ0IsQ0FBQztJQUMxQztJQUNBLFlBQVksYUFBYSxDQUFDO0lBQzFCLFlBQVksYUFBYSxDQUFDO0lBRTFCLE9BQU87RUFDVDtBQUNGLEdBQUcsS0FBSyxXQUFXIn0=