#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use std::io::Cursor;
use tauri::{generate_handler, Builder};
use zip::ZipArchive;

#[tauri::command]
fn list_zip_file_names(file_contents: Vec<u8>) -> Result<Vec<String>, String> {
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
        match archive.by_index(i) {
            Ok(file) => {
                println!("Found file: {}", file.name());
                file_names.push(file.name().to_string());
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
