import http from "k6/http";
import { group, sleep, check } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  // Key configurations for spike in this section
  discardResponseBodies: true,
  stages: [
    { duration: "1m", target: 25 }, // fast ramp-up to a high point
    // No plateau
    { duration: "1m", target: 0 }, // quick ramp-down to 0 users
  ],
};

export default () => {
  group("CEE Load Testing", function () {
    const response = http.post(
      `http://${__ENV.MY_HOSTNAME}/api/assignment/evaluate`
    );
    console.log(
      `VU: ${__VU}  -  ITER: ${__ITER}  -  ${new Date().toLocaleString()}`
    );
    check(response, {
      "is status 200": (r) => r.status === 200,
    });
    sleep(randomIntBetween(1, 4));
  });
};
