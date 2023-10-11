export const options = {
  scenarios: {
    perVuIter: {
      executor: "per-vu-iterations",
      vus: 768,
      iterations: 100
    }
  }
};
const target = "http://localhost:8000";
export default async function() {
  await fetch(target);
  await fetch(target);
  await fetch(target);
  await fetch(target);
  await fetch(target);
  await fetch(target);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9hbmVncmVsL2NvZGUvamF2YXNjcmlwdC9kZW5vbG9hZC9iZXRhLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBvcHRpb25zID0ge1xuICBzY2VuYXJpb3M6IHtcbiAgICBwZXJWdUl0ZXI6IHtcbiAgICAgIGV4ZWN1dG9yOiBcInBlci12dS1pdGVyYXRpb25zXCIsXG4gICAgICB2dXM6IDc2OCxcbiAgICAgIGl0ZXJhdGlvbnM6IDEwMCxcbiAgICB9LFxuICB9LFxufTtcblxuY29uc3QgdGFyZ2V0ID0gXCJodHRwOi8vbG9jYWxob3N0OjgwMDBcIjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKCkge1xuICBhd2FpdCBmZXRjaCh0YXJnZXQpO1xuICBhd2FpdCBmZXRjaCh0YXJnZXQpO1xuICBhd2FpdCBmZXRjaCh0YXJnZXQpO1xuICBhd2FpdCBmZXRjaCh0YXJnZXQpO1xuICBhd2FpdCBmZXRjaCh0YXJnZXQpO1xuICBhd2FpdCBmZXRjaCh0YXJnZXQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sTUFBTSxVQUFVO0VBQ3JCLFdBQVc7SUFDVCxXQUFXO01BQ1QsVUFBVTtNQUNWLEtBQUs7TUFDTCxZQUFZO0lBQ2Q7RUFDRjtBQUNGLEVBQUU7QUFFRixNQUFNLFNBQVM7QUFFZixlQUFlO0VBQ2IsTUFBTSxNQUFNO0VBQ1osTUFBTSxNQUFNO0VBQ1osTUFBTSxNQUFNO0VBQ1osTUFBTSxNQUFNO0VBQ1osTUFBTSxNQUFNO0VBQ1osTUFBTSxNQUFNO0FBQ2QifQ==