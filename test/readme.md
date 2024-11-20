k6 run -e MY_HOSTNAME=localhost script.js
k6 run -e MY_HOSTNAME=localhost -o cloud baseline_load_testing.js
k6 run -e MY_HOSTNAME=localhost -o cloud spike_testing.js
k6 run -e MY_HOSTNAME=localhost -o cloud stress_testing.js
