import http from "k6/http";
import { group, sleep, check } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  discardResponseBodies: true,
  stages: [
    { duration: "54s", target: 2 }, // traffic ramp-up from 1 to 100 users over 5 minutes.
    { duration: "30s", target: 4 }, // stay at 100 users for 30 minutes
    { duration: "30s", target: 7 }, // ramp-down to 0 users
    { duration: "66s", target: 10 }, // ramp-down to 0 users
    { duration: "0s", target: 0 }, // ramp-down to 0 users
  ],
};

export default function () {
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
    sleep(randomIntBetween(2, 5));
  });
}
