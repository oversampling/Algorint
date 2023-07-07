import http from "k6/http";
import { group, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 30 },
    { duration: "30s", target: 50 },
    { duration: "20s", target: 20 },
  ],
};

export default function () {
  group("CEE Load Testing", function () {
    const response = http.post(
      `http://${__ENV.MY_HOSTNAME}/api/assignment/evaluate`
    );
    sleep(1);
  });
}
