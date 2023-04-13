/*
input = ["4 \n57 57 -57 57", "10 \n5 5 5 5 5 5 5 5 5 6"]
test_cases = ["-57", "5"]
*/
let n;
let arr = ["<replace-1>"];

arr = [...new Set(arr)];
arr.sort((a, b) => b - a);
console.log(arr[1]);
