import * as log from "std/log/mod.ts";
export default log;
const level = "WARNING";
log.setup({
  handlers: {
    main: new log.handlers.ConsoleHandler("NOTSET", {
      formatter: (logRecord)=>{
        // deno-lint-ignore no-explicit-any
        const args = logRecord.args.map((arg)=>JSON.stringify(arg)).join(" ");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9hbmVncmVsL2NvZGUvamF2YXNjcmlwdC9kZW5vbG9hZC9zcmMvbG9nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxvZyBmcm9tIFwic3RkL2xvZy9tb2QudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgbG9nO1xuXG5jb25zdCBsZXZlbDogbG9nLkxldmVsTmFtZSA9IFwiV0FSTklOR1wiO1xuXG5sb2cuc2V0dXAoe1xuICBoYW5kbGVyczoge1xuICAgIG1haW46IG5ldyBsb2cuaGFuZGxlcnMuQ29uc29sZUhhbmRsZXIoXCJOT1RTRVRcIiwge1xuICAgICAgZm9ybWF0dGVyOiAobG9nUmVjb3JkOiBsb2cuTG9nUmVjb3JkKSA9PiB7XG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBsb2dSZWNvcmQuYXJncy5tYXAoKGFyZzogYW55KSA9PiBKU09OLnN0cmluZ2lmeShhcmcpKVxuICAgICAgICAgIC5qb2luKFwiIFwiKTtcblxuICAgICAgICByZXR1cm4gYCR7bG9nUmVjb3JkLmRhdGV0aW1lLnRvSVNPU3RyaW5nKCl9IFske2xvZ1JlY29yZC5sZXZlbE5hbWV9XSBbJHtsb2dSZWNvcmQubG9nZ2VyTmFtZX1dIC0gJHtsb2dSZWNvcmQubXNnfSAke2FyZ3N9YDtcbiAgICAgIH0sXG4gICAgfSksXG4gIH0sXG4gIGxvZ2dlcnM6IHtcbiAgICAvLyBNYWluIHRocmVhZC5cbiAgICBcIm1haW5cIjoge1xuICAgICAgbGV2ZWwsXG4gICAgICBoYW5kbGVyczogW1wibWFpblwiXSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxTQUFTLGlCQUFpQjtBQUV0QyxlQUFlLElBQUk7QUFFbkIsTUFBTSxRQUF1QjtBQUU3QixJQUFJLEtBQUssQ0FBQztFQUNSLFVBQVU7SUFDUixNQUFNLElBQUksSUFBSSxRQUFRLENBQUMsY0FBYyxDQUFDLFVBQVU7TUFDOUMsV0FBVyxDQUFDO1FBQ1YsbUNBQW1DO1FBQ25DLE1BQU0sT0FBTyxVQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFhLEtBQUssU0FBUyxDQUFDLE1BQzFELElBQUksQ0FBQztRQUVSLE9BQU8sQ0FBQyxFQUFFLFVBQVUsUUFBUSxDQUFDLFdBQVcsR0FBRyxFQUFFLEVBQUUsVUFBVSxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO01BQzVIO0lBQ0Y7RUFDRjtFQUNBLFNBQVM7SUFDUCxlQUFlO0lBQ2YsUUFBUTtNQUNOO01BQ0EsVUFBVTtRQUFDO09BQU87SUFDcEI7RUFDRjtBQUNGIn0=