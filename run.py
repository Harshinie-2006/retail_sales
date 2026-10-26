"""
Shelf Signal — Unified Local Launcher
Starts the FastAPI backend (port 8000) and the Vite frontend (port 5173).
Usage:
    python run.py
"""
import subprocess
import sys
import time
import os
import signal

def main():
    print("=" * 60)
    print(" SHELF SIGNAL — RETAIL ANALYTICS WORKSTATION")
    print("=" * 60)
    print("Starting FastAPI backend on http://127.0.0.1:8000 ...")

    # Start FastAPI backend
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

    time.sleep(1.5)

    print("Starting Vite frontend on http://localhost:5173 ...")
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    
    # Run npm run dev in frontend
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "--host", "--port", "5173"],
        cwd=frontend_dir
    )

    print("\n[READY] Shelf Signal is running!")
    print(" -> Frontend: http://localhost:5173")
    print(" -> Backend Docs: http://127.0.0.1:8000/docs")
    print("\nPreset Demo Credentials:")
    print(" - Analyst: analyst@shelfsignal.local / AnalystSecure2026!")
    print(" - Admin:   admin@shelfsignal.local   / AdminSecure2026!")
    print("\nPress Ctrl+C to terminate both servers.")

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("Backend terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend terminated unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nShutting down Shelf Signal servers...")
    finally:
        try:
            backend_proc.terminate()
        except Exception:
            pass
        try:
            frontend_proc.terminate()
        except Exception:
            pass
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
