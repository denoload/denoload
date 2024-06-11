import http from "k6/http";
import { sleep } from "k6";

export const options = {
  scenarios: {
    shared: {
      executor: "shared-iterations",
      iterations: 256,
      vus: 128,
      gracefulStop: "3s",
    },
    //  perVuIter: {
    //    executor: "per-vu-iterations",
    //    vus: 512,
    //    iterations: 1,
    //  },
    //  perVuIter2: {
    //    executor: "constant-vus",
    // duration: '3s',
    //    vus: 10,
    //  },
  },
};

const target = "http://localhost:8000";

export default function () {
  for (let i = 0; i < 5; i++) {
    http.get(target);
    sleep(1);
  }
}
