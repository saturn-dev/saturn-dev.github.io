import os
import tkinter as tk
from tkinter import messagebox, filedialog

# Paths to your folders (change these to your actual paths)
PRODUCTS_DIR = os.path.join(os.getcwd(), "products")
QC_DIR = os.path.join(os.getcwd(), "qc")

def rename_files():
    old_name = entry_old.get().strip()
    new_name = entry_new.get().strip()

    if not old_name or not new_name:
        messagebox.showerror("Error", "Please enter both old and new names")
        return

    # ----- Update /products -----
    found = False
    for filename in os.listdir(PRODUCTS_DIR):
        name, ext = os.path.splitext(filename)
        if name == old_name:
            old_path = os.path.join(PRODUCTS_DIR, filename)
            new_path = os.path.join(PRODUCTS_DIR, new_name + ext)
            os.rename(old_path, new_path)
            found = True
            break

    if not found:
        messagebox.showwarning("Warning", f"Could not find '{old_name}' in /products")
    
    # ----- Update /qc folder -----
    old_qc_path = os.path.join(QC_DIR, old_name)
    new_qc_path = os.path.join(QC_DIR, new_name)
    if os.path.exists(old_qc_path) and os.path.isdir(old_qc_path):
        os.rename(old_qc_path, new_qc_path)
    else:
        messagebox.showwarning("Warning", f"Could not find QC folder '{old_name}' in /qc")
    
    messagebox.showinfo("Success", "Renaming complete!")

# ----- GUI -----
root = tk.Tk()
root.title("Batch Rename /products & /qc")

tk.Label(root, text="Old Name (current file/folder name)").pack(pady=(10, 0))
entry_old = tk.Entry(root, width=50)
entry_old.pack(pady=5)

tk.Label(root, text="New Name (desired file/folder name)").pack(pady=(10, 0))
entry_new = tk.Entry(root, width=50)
entry_new.pack(pady=5)

tk.Button(root, text="Update Names", command=rename_files, width=20, bg="#4CAF50", fg="white").pack(pady=20)

root.mainloop()
