use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
fn open_login_browser(app: tauri::AppHandle) -> Result<(), String> {
    app.opener()
        .open_url("http://localhost:3000/users/sign_in?tauri=1", None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn verify_cv_token(token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("http://localhost:3000/api/v1/me")
        .header("Authorization", format!("Token {}", token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if response.status().is_success() {
        response
            .json::<serde_json::Value>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        Err(format!("Auth failed: {} — make sure Rails is running on localhost:3000", response.status()))
    }
}

fn extract_token_from_url(url: &str) -> Option<String> {
    url.split('?')
        .nth(1)?
        .split('&')
        .find(|pair| pair.starts_with("token="))
        .map(|pair| pair["token=".len()..].to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
            for arg in argv.iter() {
                if arg.starts_with("circuitverse://") {
                    if let Some(token) = extract_token_from_url(arg) {
                        let _ = app.emit("tauri://cv-auth-token", &token);
                    }
                }
            }
        }))
        .invoke_handler(tauri::generate_handler![open_login_browser, verify_cv_token])
        .setup(|app| {
            #[cfg(target_os = "windows")]
            app.deep_link().register("circuitverse")?;

            // ── Deep Link Handler ─────────────────────────────────────────
            {
                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    for url in event.urls() {
                        let url_str = url.to_string();
                        if url_str.starts_with("circuitverse://auth") {
                            if let Some(token) = extract_token_from_url(&url_str) {
                                if let Err(e) = handle.emit("tauri://cv-auth-token", &token) {
                                    eprintln!("Failed to emit auth token: {}", e);
                                }
                            }
                        }
                    }
                });
            }
            // ─────────────────────────────────────────────────────────────

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                let file_menu = SubmenuBuilder::new(app, "File")
                    .text("new-circuit", "New Circuit")
                    .separator()
                    .text("save-offline", "Save")
                    .text("save-online", "Save Online")
                    .separator()
                    .text("open-offline", "Open")
                    .separator()
                    .hide_others()
                    .show_all()
                    .separator()
                    .quit()
                    .build()?;

                let project_menu = SubmenuBuilder::new(app, "Project")
                    .text("new-project", "New Project")
                    .text("save-online", "Save Online")
                    .separator()
                    .text("save-offline", "Save Offline")
                    .text("open-offline", "Open Offline")
                    .separator()
                    .text("export", "Export as File")
                    .text("import", "Import Project")
                    .separator()
                    .text("clear", "Clear Project")
                    .text("recover", "Recover Project")
                    .separator()
                    .text("preview-circuit", "Preview Circuit")
                    .text("previous-ui", "Previous UI")
                    .build()?;

                let circuit_menu = SubmenuBuilder::new(app, "Circuit")
                    .text("new-circuit", "New Circuit +")
                    .text("new-verilog-module", "New Verilog Module")
                    .text("insert-sub-circuit", "Insert SubCircuit")
                    .build()?;

                let tools_menu = SubmenuBuilder::new(app, "Tools")
                    .text("combinational-analysis", "Combinational Analysis")
                    .text("hex-bin-dec", "Hex-Bin-Dec Converter")
                    .text("download-image", "Download Image")
                    .text("themes", "Themes")
                    .text("custom-shortcut", "Custom Shortcut")
                    .text("export-verilog", "Export Verilog")
                    .build()?;

                let help_menu = SubmenuBuilder::new(app, "Help")
                    .text("tutorial", "Tutorial Guide")
                    .text("user-manual", "User Manual")
                    .text("learn-digital-logic", "Learn Digital Logic")
                    .text("discussion-forum", "Discussion Forum")
                    .build()?;

                let menu = MenuBuilder::new(app)
                    .items(&[
                        &file_menu,
                        &project_menu,
                        &circuit_menu,
                        &tools_menu,
                        &help_menu,
                    ])
                    .build()?;

                app.set_menu(menu)?;

                app.on_menu_event(move |app, event| {
                    if event.id() == "new-project" {
                        if let Err(e) = app.emit("new-project", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "save-online" {
                        if let Err(e) = app.emit("save-online", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "save-offline" {
                        if let Err(e) = app.emit("save-offline", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "open-offline" {
                        if let Err(e) = app.emit("open-offline", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "export" {
                        if let Err(e) = app.emit("export", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "import" {
                        if let Err(e) = app.emit("import", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "clear" {
                        if let Err(e) = app.emit("clear", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "recover" {
                        if let Err(e) = app.emit("recover", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "preview-circuit" {
                        if let Err(e) = app.emit("preview-circuit", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "previous-ui" {
                        if let Err(e) = app.emit("previous-ui", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "new-circuit" {
                        if let Err(e) = app.emit("new-circuit", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "new-verilog-module" {
                        if let Err(e) = app.emit("new-verilog-module", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "insert-sub-circuit" {
                        if let Err(e) = app.emit("insert-sub-circuit", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "combinational-analysis" {
                        if let Err(e) = app.emit("combinational-analysis", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "hex-bin-dec" {
                        if let Err(e) = app.emit("hex-bin-dec", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "download-image" {
                        if let Err(e) = app.emit("download-image", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "themes" {
                        if let Err(e) = app.emit("themes", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "custom-shortcut" {
                        if let Err(e) = app.emit("custom-shortcut", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "export-verilog" {
                        if let Err(e) = app.emit("export-verilog", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "tutorial" {
                        if let Err(e) = app.emit("tutorial", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "user-manual" {
                        if let Err(e) = app.emit("user-manual", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "learn-digital-logic" {
                        if let Err(e) = app.emit("learn-digital-logic", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "discussion-forum" {
                        if let Err(e) = app.emit("discussion-forum", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
