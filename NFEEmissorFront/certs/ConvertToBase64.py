import base64
import os
from pathlib import Path

# ---- CONFIG ----
FOLDER = r"C:\Users\Igor Marinho\Documents\GitHub\NFEEmissorFront\NFEEmissorFront\test certs"

# Extensions to convert (case-insensitive)
CERT_EXTENSIONS = {".pfx", ".p12", ".cer", ".crt", ".pem", ".key", ".der"}
# ---------------


def convert_file_to_base64(file_path: Path, line_breaks: bool = False) -> Path:
    """Convert a single cert file to Base64 and write .txt next to it."""
    with open(file_path, "rb") as f:
        data = f.read()

    b64 = base64.b64encode(data).decode("ascii")

    if line_breaks:
        b64 = "\n".join(b64[i:i + 64] for i in range(0, len(b64), 64))

    out_path = file_path.with_suffix(file_path.suffix + ".base64.txt")
    with open(out_path, "w", encoding="ascii") as f:
        f.write(b64)

    return out_path


def main():
    folder = Path(FOLDER)

    if not folder.is_dir():
        print(f"❌ Folder not found: {folder}")
        return

    print(f"📂 Scanning: {folder}\n")

    # Find all matching cert files (case-insensitive)
    found = []
    for entry in folder.iterdir():
        if entry.is_file() and entry.suffix.lower() in CERT_EXTENSIONS:
            found.append(entry)

    if not found:
        print("⚠️  No certificate files found in this folder.")
        print(f"   Looked for: {', '.join(sorted(CERT_EXTENSIONS))}")
        return

    print(f"🔍 Found {len(found)} certificate file(s):\n")

    for cert_file in sorted(found):
        try:
            out = convert_file_to_base64(cert_file, line_breaks=False)
            size_kb = cert_file.stat().st_size / 1024
            b64_size = out.stat().st_size
            print(f"  ✅ {cert_file.name}")
            print(f"     → {out.name}")
            print(f"     Original: {size_kb:.2f} KB | Base64: {b64_size} chars\n")
        except Exception as e:
            print(f"  ❌ Failed on {cert_file.name}: {e}\n")

    print("🎉 All done!")


if __name__ == "__main__":
    main()