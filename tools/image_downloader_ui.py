import os
import requests
import tkinter as tk
from tkinter import messagebox
import json

BASE_DIR = os.path.join(os.getcwd(), "QC")

# ---------- Colors ----------
BG = "#0f1115"
PANEL = "#151922"
ACCENT = "#ff4d8d"
TEXT = "#e8ecf1"
SUBTEXT = "#9aa4b2"
INPUT = "#1c2230"

def download_images():
    folder_name = folder_entry.get().strip()
    urls = url_text.get("1.0", tk.END).strip()

    if not folder_name:
        messagebox.showerror("Error", "Enter a folder name")
        return

    if not urls:
        messagebox.showerror("Error", "Paste image URLs")
        return

    os.makedirs(BASE_DIR, exist_ok=True)
    target_folder = os.path.join(BASE_DIR, folder_name)
    os.makedirs(target_folder, exist_ok=True)

    url_list = [u.strip() for u in urls.split(",") if u.strip()]
    status_label.config(text="Downloading...")

    saved_files = []   # <-- store filenames for index.json

    for i, url in enumerate(url_list, start=1):
        try:
            ext = ".png"
            if ".jpg" in url or ".jpeg" in url:
                ext = ".jpg"
            if ".webp" in url:
                ext = ".webp"

            filename = f"{i}{ext}"
            file_path = os.path.join(target_folder, filename)

            response = requests.get(url, timeout=20)
            response.raise_for_status()

            with open(file_path, "wb") as f:
                f.write(response.content)

            saved_files.append(filename)  # <-- track file
            root.update()

        except Exception as e:
            print("Failed:", url, e)

    # 🔥 Create index.json
    index_data = {
        "images": saved_files
    }

    with open(os.path.join(target_folder, "index.json"), "w") as f:
        json.dump(index_data, f, indent=2)

    status_label.config(text=f"Success! Downloaded {len(saved_files)} images + index.json created")

# ---------- Window ----------
root = tk.Tk()
root.title("QC Image Downloader")
root.geometry("560x620")
root.configure(bg=BG)
root.resizable(False, False)
root.attributes("-topmost", True)

panel = tk.Frame(root, bg=PANEL, padx=25, pady=25)
panel.pack(padx=20, pady=20, fill="both", expand=True)

title = tk.Label(panel, text="QC Image Downloader", fg=TEXT, bg=PANEL,
                 font=("Segoe UI", 20, "bold"))
title.pack(pady=(0, 10))

subtitle = tk.Label(panel, text="seperate by ,",
                    fg=SUBTEXT, bg=PANEL, font=("Segoe UI", 10))
subtitle.pack(pady=(0, 20))

tk.Label(panel, text="Folder Name", fg=TEXT, bg=PANEL,
         font=("Segoe UI", 11, "bold")).pack(anchor="w")

folder_entry = tk.Entry(panel, bg=INPUT, fg=TEXT, insertbackground=TEXT,
                        relief="flat", font=("Segoe UI", 12))
folder_entry.pack(fill="x", pady=(5, 15), ipady=8)

tk.Label(panel, text="Image URLs", fg=TEXT, bg=PANEL,
         font=("Segoe UI", 11, "bold")).pack(anchor="w")

url_text = tk.Text(panel, height=10, bg=INPUT, fg=TEXT,
                   insertbackground=TEXT, relief="flat",
                   font=("Segoe UI", 11))
url_text.pack(fill="both", pady=(5, 15))

upload_btn = tk.Button(panel, text="Upload Images",
                       bg=ACCENT, fg="white",
                       activebackground="#ff6aa3",
                       relief="flat",
                       font=("Segoe UI", 13, "bold"),
                       command=download_images,
                       cursor="hand2")
upload_btn.pack(fill="x", ipady=10)

status_label = tk.Label(panel, text="Waiting for upload...",
                        fg=SUBTEXT, bg=PANEL,
                        font=("Segoe UI", 10))
status_label.pack(pady=(15, 0))

root.mainloop()
