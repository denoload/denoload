import * as log from "std/log/mod.ts";
export default log;
const level = "WARNING";
log.setup({
  handlers: {
    main: new log.handlers.ConsoleHandler("NOTSET", {
      formatter: (logRecord)=>{
        // deno-lint-ignore no-explicit-any
        const args = logRecord.args.map((arg)=>arg.toString()).join(" ");
        return `${logRecord.datetime.toISOString()} [${logRecord.levelName}] [${logRecord.loggerName}] - ${logRecord.msg} ${args}`;
      }
    })
  },
  loggers: {
    // Main thread.
    "main": {
      level,
      handlers: [
        "main"
      ]
    }
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9hbmVncmVsL2NvZGUvamF2YXNjcmlwdC9kZW5vbG9hZC9zcmMvbG9nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxvZyBmcm9tIFwic3RkL2xvZy9tb2QudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgbG9nO1xuXG5jb25zdCBsZXZlbDogbG9nLkxldmVsTmFtZSA9IFwiV0FSTklOR1wiO1xuXG5sb2cuc2V0dXAoe1xuICBoYW5kbGVyczoge1xuICAgIG1haW46IG5ldyBsb2cuaGFuZGxlcnMuQ29uc29sZUhhbmRsZXIoXCJOT1RTRVRcIiwge1xuICAgICAgZm9ybWF0dGVyOiAobG9nUmVjb3JkOiBsb2cuTG9nUmVjb3JkKSA9PiB7XG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBsb2dSZWNvcmQuYXJncy5tYXAoKGFyZzogYW55KSA9PiBhcmcudG9TdHJpbmcoKSkuam9pbihcIiBcIik7XG5cbiAgICAgICAgcmV0dXJuIGAke2xvZ1JlY29yZC5kYXRldGltZS50b0lTT1N0cmluZygpfSBbJHtsb2dSZWNvcmQubGV2ZWxOYW1lfV0gWyR7bG9nUmVjb3JkLmxvZ2dlck5hbWV9XSAtICR7bG9nUmVjb3JkLm1zZ30gJHthcmdzfWA7XG4gICAgICB9LFxuICAgIH0pLFxuICB9LFxuICBsb2dnZXJzOiB7XG4gICAgLy8gTWFpbiB0aHJlYWQuXG4gICAgXCJtYWluXCI6IHtcbiAgICAgIGxldmVsLFxuICAgICAgaGFuZGxlcnM6IFtcIm1haW5cIl0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksU0FBUyxpQkFBaUI7QUFFdEMsZUFBZSxJQUFJO0FBRW5CLE1BQU0sUUFBdUI7QUFFN0IsSUFBSSxLQUFLLENBQUM7RUFDUixVQUFVO0lBQ1IsTUFBTSxJQUFJLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxVQUFVO01BQzlDLFdBQVcsQ0FBQztRQUNWLG1DQUFtQztRQUNuQyxNQUFNLE9BQU8sVUFBVSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBYSxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUM7UUFFbkUsT0FBTyxDQUFDLEVBQUUsVUFBVSxRQUFRLENBQUMsV0FBVyxHQUFHLEVBQUUsRUFBRSxVQUFVLFNBQVMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7TUFDNUg7SUFDRjtFQUNGO0VBQ0EsU0FBUztJQUNQLGVBQWU7SUFDZixRQUFRO01BQ047TUFDQSxVQUFVO1FBQUM7T0FBTztJQUNwQjtFQUNGO0FBQ0YifQ==