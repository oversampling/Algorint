// Problem: https://www.hackerrank.com/challenges/reduced-string/problem
/*
Sample Input 1
aaabccddd
Sample Output 1
abd
Sample Input 2
aa
Sample Output 2
Empty String
Sample Input 3
baab
Sample Output 3
Empty String
*/

use std::io;

fn super_reduced_string(input: String) {
    if input.is_empty() {
        println!("Empty String");
        return;
    }

    let input_chars: Vec<char> = input.chars().collect();
    let input_size: usize = input.len();
    let mut found_adjacent_letters: bool = false;

    for i in 0..(input_size - 1) {
        if input_chars[i] == input_chars[i + 1] {
            let result: String = reduce_string(&input_chars, input_size, i);

            super_reduced_string(result);
            found_adjacent_letters = true;
            break;
        }
    }

    if !found_adjacent_letters {
        println!("{}", input);
    }
}

fn reduce_string(input_chars: &Vec<char>, input_size: usize, index: usize) -> String {
    let mut result = String::new();
    let left_input: String = substring(&input_chars, 0, index);
    let right_input: String = substring(&input_chars, index + 2, input_size);

    result.push_str(&left_input);
    result.push_str(&right_input);

    result
}

fn substring(input: &Vec<char>, start_index: usize, end_index: usize) -> String {
    let mut result = String::new();

    for i in start_index..end_index {
        result.push(input[i]);
    }

    result
}

fn main() {
    let input: String = read_line();
    super_reduced_string(input);
}

fn read_line() -> String {
    let mut buffer = String::new();
    let reader: io::Stdin = io::stdin();

    reader
        .read_line(&mut buffer)
        .expect("Could not read stdin!");

    buffer.trim().to_string()
}
