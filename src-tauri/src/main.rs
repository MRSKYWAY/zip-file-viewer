#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Cursor;
use tauri::{generate_handler, Builder};
use zip::result::ZipError;
use zip::ZipArchive;

#[tauri::command]
fn list_zip_file_names(file_contents: Vec<u8>, password: String) -> Result<Vec<String>, String> {
    println!("Received file contents");

    let cursor = Cursor::new(file_contents);
    let mut archive = match ZipArchive::new(cursor) {
        Ok(archive) => {
            println!("Successfully read ZIP archive");
            archive
        },
        Err(e) => {
            println!("Failed to read ZIP archive: {}", e);
            return Err(format!("Failed to read ZIP archive: {}", e));
        }
    };

    let mut file_names = Vec::new();
    for i in 0..archive.len() {
        match archive.by_index_decrypt(i, password.as_bytes()) {
            Ok(file) => {
                println!("Found file: {}", file.name());
                file_names.push(file.name().to_string());
            },
            Err(ZipError::UnsupportedArchive(msg)) if msg == "Password required to decrypt file" => {
                println!("Password required to decrypt file");
                return Err("Password required to decrypt file".to_string());
            },
            Err(ZipError::InvalidPassword) => {
                println!("Invalid password");
                return Err("Invalid password".to_string());
            },
            Err(e) => {
                println!("Failed to access file in ZIP archive: {}", e);
                return Err(format!("Failed to access file in ZIP archive: {}", e));
            }
        }
    }

    Ok(file_names)
}

fn main() {
    Builder::default()
        .invoke_handler(generate_handler![list_zip_file_names])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
